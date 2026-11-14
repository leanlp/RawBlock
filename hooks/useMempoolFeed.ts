"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/track";
import {
    applyMempoolChange,
    MEMPOOL_STREAM_LEASE_MS,
    parseMempoolRows,
    parseMempoolStreamFrame,
    parseSnapshotObservation,
    reconcileMempoolRows,
    type MempoolChange,
    type MempoolSnapshot,
    type MempoolTransaction,
} from "@/lib/mempoolFeed";

const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "https://apigoland.rawblock.net").replace(/\/+$/, "");
const SOCKET_URL = `${API_URL.replace(/^http/i, "ws")}/ws`;
const PUBLIC_RECENT_URL = "https://mempool.space/api/mempool/recent";
const SNAPSHOT_POLL_MS = 30_000;
const SNAPSHOT_TIMEOUT_MS = 2_500;
const HANDSHAKE_TIMEOUT_MS = 5_000;
const RETRY_CAP_MS = 30_000;

type StreamStatus = "connecting" | "awaiting" | "live" | "retrying" | "offline";
type StreamFailure = "ws_handshake" | "ws_closed" | "ws_error" | "ws_stale";
type SnapshotStatus = Pick<MempoolSnapshot, "source" | "observedAt">;

type Replacement = {
    txid: string;
    replacedTxid: string;
    feeBumpSats: number | null;
};

async function fetchSnapshot(url: string, publicFallback: boolean, signal: AbortSignal): Promise<MempoolSnapshot> {
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS)]);
    const res = await fetch(url, { signal: requestSignal, cache: "no-store" });
    if (!res.ok) throw new Error("Mempool snapshot unavailable");
    const rows = parseMempoolRows(await res.json(), publicFallback ? "sat" : "btc");
    if (rows === null) throw new Error("Invalid mempool snapshot");

    if (publicFallback) return { rows, source: "public", observedAt: null };

    const header = res.headers.get("X-RawBlock-Data-Source");
    const source = header === "local_node" ? "node" : header === "public_api" ? "public" : "unknown";
    const observedAt = parseSnapshotObservation(res.headers.get("X-RawBlock-Updated-At"), Date.now());
    return { rows, source, observedAt };
}

async function getSnapshot(signal: AbortSignal): Promise<MempoolSnapshot> {
    try {
        return await fetchSnapshot(`${API_URL}/api/mempool-recent`, false, signal);
    } catch (error) {
        if (signal.aborted) throw error;
        return fetchSnapshot(PUBLIC_RECENT_URL, true, signal);
    }
}

export function useMempoolFeed() {
    const [rows, setRows] = useState<MempoolTransaction[]>([]);
    const [snapshot, setSnapshot] = useState<SnapshotStatus | null>(null);
    const [snapshotLoading, setSnapshotLoading] = useState(true);
    const [snapshotFailed, setSnapshotFailed] = useState(false);
    const [streamStatus, setStreamStatus] = useState<StreamStatus>("connecting");
    const [streamObservedAt, setStreamObservedAt] = useState<number | null>(null);
    const [mempoolCount, setMempoolCount] = useState<{ value: number; observedAt: number } | null>(null);
    const [replacement, setReplacement] = useState<Replacement | null>(null);
    const retryRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        const changes = new Map<string, MempoolChange>();
        const startedAt = performance.now();
        let mounted = true;
        let currentSnapshot: MempoolSnapshot | null = null;
        let evictedThrough = 0;
        let snapshotController: AbortController | null = null;
        let snapshotFailureReported = false;
        let firstSnapshotReported = false;
        let snapshotResyncRequested = false;
        let socket: WebSocket | null = null;
        let socketTimer: number | undefined;
        let retryTimer: number | undefined;
        let publishTimer: number | undefined;
        let replacementTimer: number | undefined;
        let lastFrameAt: number | null = null;
        let reconnectSince: number | null = null;
        let retryCount = 0;
        let firstFrameReported = false;

        function publishRows() {
            if (publishTimer !== undefined) return;
            // A busy mempool can deliver many lifecycle frames from one tracker poll.
            publishTimer = window.setTimeout(() => {
                publishTimer = undefined;
                setRows(reconcileMempoolRows(currentSnapshot, changes));
            }, 50);
        }

        async function refreshSnapshot(supersede = false) {
            if (!navigator.onLine || (snapshotController !== null && !supersede)) return;
            snapshotController?.abort();
            const controller = new AbortController();
            snapshotController = controller;
            const requestedAt = performance.now();
            const requestedAtWallClock = Date.now();
            if (currentSnapshot === null) setSnapshotLoading(true);

            try {
                const incoming = await getSnapshot(controller.signal);
                if (!mounted || snapshotController !== controller) return;
                // Tracker frames have second precision. A pending snapshot that
                // could precede a dropped delta cannot be safely reconciled.
                if ((incoming.observedAt ?? requestedAtWallClock) < evictedThrough + 1000) {
                    throw new Error("Snapshot predates retained stream changes");
                }
                if (currentSnapshot?.source === "node" && currentSnapshot.observedAt !== null
                    && incoming.source === "node" && (incoming.observedAt === null || incoming.observedAt < currentSnapshot.observedAt)) {
                    throw new Error("Snapshot predates the displayed capture");
                }
                currentSnapshot = incoming;
                setSnapshot({ source: incoming.source, observedAt: incoming.observedAt });
                setSnapshotFailed(false);
                snapshotFailureReported = false;
                publishRows();
                if (!firstSnapshotReported) {
                    firstSnapshotReported = true;
                    track({
                        name: "explorer_data_timing",
                        properties: {
                            tool: "mempool",
                            phase: "snapshot_ready",
                            duration_ms: Math.round(performance.now() - startedAt),
                            source: incoming.source === "public" ? "fallback" : "api",
                            age_ms: incoming.observedAt === null ? undefined : Math.max(0, Date.now() - incoming.observedAt),
                        },
                    });
                }
            } catch {
                if (!mounted || snapshotController !== controller) return;
                setSnapshotFailed(true);
                if (!snapshotFailureReported) {
                    snapshotFailureReported = true;
                    track({
                        name: "explorer_data_failed",
                        properties: { tool: "mempool", error_type: "snapshot_unavailable", duration_ms: Math.round(performance.now() - requestedAt) },
                    });
                }
            } finally {
                if (mounted && snapshotController === controller) {
                    snapshotController = null;
                    setSnapshotLoading(false);
                    if (snapshotResyncRequested) {
                        snapshotResyncRequested = false;
                        void refreshSnapshot();
                    }
                }
            }
        }

        function closeSocket() {
            window.clearTimeout(socketTimer);
            const previous = socket;
            socket = null;
            lastFrameAt = null;
            if (!previous) return;
            previous.onopen = previous.onmessage = previous.onerror = previous.onclose = null;
            try {
                previous.close();
            } catch {
                // A browser may already be tearing down its networking context.
            }
        }

        function scheduleRetry(failure: StreamFailure, requestedAt: number) {
            closeSocket();
            setMempoolCount(null);
            if (!navigator.onLine) {
                setStreamStatus("offline");
                return;
            }
            setStreamStatus("retrying");
            if (reconnectSince === null) {
                reconnectSince = performance.now();
                track({
                    name: "explorer_data_failed",
                    properties: { tool: "mempool", error_type: failure, duration_ms: Math.round(reconnectSince - requestedAt) },
                });
            }
            const backoff = Math.min(RETRY_CAP_MS, 1000 * 2 ** Math.min(retryCount, 5));
            retryCount += 1;
            retryTimer = window.setTimeout(connect, backoff * (0.5 + Math.random() * 0.5));
        }

        function announceReplacement(change: MempoolChange) {
            if (!change.replacedBy || change.replacedBy === change.txid) return;
            const localRows = currentSnapshot?.source === "node" ? currentSnapshot.rows : [];
            const oldFee = changes.get(change.txid)?.transaction?.feeSats
                ?? localRows.find((tx) => tx.txid === change.txid)?.feeSats;
            const newFee = changes.get(change.replacedBy)?.transaction?.feeSats
                ?? localRows.find((tx) => tx.txid === change.replacedBy)?.feeSats;
            const feeBumpSats = oldFee != null && newFee != null && newFee > oldFee ? newFee - oldFee : null;
            setReplacement({ txid: change.replacedBy, replacedTxid: change.txid, feeBumpSats });
            window.clearTimeout(replacementTimer);
            replacementTimer = window.setTimeout(() => setReplacement(null), 5000);
        }

        function connect() {
            window.clearTimeout(retryTimer);
            retryTimer = undefined;
            if (!mounted || socket !== null || !navigator.onLine) return;
            setStreamStatus("connecting");
            const requestedAt = performance.now();
            let connection: WebSocket;
            try {
                connection = new WebSocket(SOCKET_URL);
            } catch {
                scheduleRetry("ws_error", requestedAt);
                return;
            }
            socket = connection;
            let lastSequence = 0;
            let verified = false;

            socketTimer = window.setTimeout(() => scheduleRetry("ws_handshake", requestedAt), HANDSHAKE_TIMEOUT_MS);
            connection.onopen = () => {
                if (socket !== connection) return;
                window.clearTimeout(socketTimer);
                socketTimer = window.setTimeout(() => scheduleRetry("ws_stale", requestedAt), MEMPOOL_STREAM_LEASE_MS);
                setStreamStatus("awaiting");
                track({
                    name: "explorer_data_timing",
                    properties: { tool: "mempool", phase: "ws_open", duration_ms: Math.round(performance.now() - requestedAt), source: "websocket" },
                });
                if (reconnectSince !== null) void refreshSnapshot(true);
            };

            connection.onmessage = (event) => {
                if (socket !== connection) return;
                const now = Date.now();
                const frame = parseMempoolStreamFrame(event.data, now);
                if (!frame || (lastFrameAt !== null && frame.observedAt < lastFrameAt)) return;

                if (frame.kind === "change") {
                    if (frame.change.sequence <= lastSequence) return;
                    if (lastSequence > 0 && frame.change.sequence > lastSequence + 1) {
                        if (snapshotController !== null) snapshotResyncRequested = true;
                        else void refreshSnapshot();
                    }
                    lastSequence = frame.change.sequence;
                    announceReplacement(frame.change);
                    const evictedAt = applyMempoolChange(changes, frame.change, currentSnapshot);
                    if (evictedAt !== null) evictedThrough = Math.max(evictedThrough, evictedAt);
                    publishRows();
                } else if (frame.kind === "heartbeat") {
                    setMempoolCount({ value: frame.txCount, observedAt: frame.observedAt });
                }

                if (frame.observedAt !== lastFrameAt) {
                    lastFrameAt = frame.observedAt;
                    setStreamObservedAt(frame.observedAt);
                    window.clearTimeout(socketTimer);
                    const elapsed = Math.max(0, now - frame.observedAt);
                    socketTimer = window.setTimeout(() => scheduleRetry("ws_stale", requestedAt), MEMPOOL_STREAM_LEASE_MS - elapsed);
                }
                if (verified) return;
                verified = true;
                retryCount = 0;
                setStreamStatus("live");
                if (!firstFrameReported) {
                    firstFrameReported = true;
                    track({
                        name: "explorer_data_timing",
                        properties: { tool: "mempool", phase: "ws_first_frame", duration_ms: Math.round(performance.now() - requestedAt), source: "websocket" },
                    });
                }
                if (reconnectSince !== null) {
                    track({
                        name: "explorer_data_timing",
                        properties: { tool: "mempool", phase: "ws_recovered", duration_ms: Math.round(performance.now() - reconnectSince), source: "websocket" },
                    });
                    reconnectSince = null;
                }
            };

            connection.onerror = () => {
                if (socket === connection) scheduleRetry("ws_error", requestedAt);
            };
            connection.onclose = () => {
                if (socket === connection) scheduleRetry("ws_closed", requestedAt);
            };
        }

        function goOffline() {
            window.clearTimeout(retryTimer);
            retryTimer = undefined;
            reconnectSince ??= performance.now();
            closeSocket();
            snapshotController?.abort();
            snapshotController = null;
            setSnapshotLoading(false);
            setMempoolCount(null);
            setStreamStatus("offline");
        }

        function resume() {
            if (!navigator.onLine) return;
            void refreshSnapshot(true);
            connect();
        }

        function onVisibilityChange() {
            if (document.visibilityState !== "visible" || !navigator.onLine) return;
            if (lastFrameAt !== null && Date.now() - lastFrameAt >= MEMPOOL_STREAM_LEASE_MS) {
                closeSocket();
                setMempoolCount(null);
            }
            if (socket === null) connect();
            void refreshSnapshot();
        }

        retryRef.current = resume;
        window.addEventListener("offline", goOffline);
        window.addEventListener("online", resume);
        document.addEventListener("visibilitychange", onVisibilityChange);
        const interval = window.setInterval(() => void refreshSnapshot(), SNAPSHOT_POLL_MS);

        if (navigator.onLine) {
            void refreshSnapshot();
            connect();
        } else {
            goOffline();
        }

        return () => {
            mounted = false;
            retryRef.current = null;
            closeSocket();
            snapshotController?.abort();
            window.clearInterval(interval);
            window.clearTimeout(retryTimer);
            window.clearTimeout(publishTimer);
            window.clearTimeout(replacementTimer);
            window.removeEventListener("offline", goOffline);
            window.removeEventListener("online", resume);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);

    const retry = useCallback(() => retryRef.current?.(), []);
    const currentCount = streamStatus === "live" && mempoolCount && streamObservedAt !== null
        && streamObservedAt - mempoolCount.observedAt < MEMPOOL_STREAM_LEASE_MS ? mempoolCount.value : null;

    return { rows, snapshot, snapshotLoading, snapshotFailed, streamStatus, streamObservedAt, mempoolCount: currentCount, replacement, retry };
}
