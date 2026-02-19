"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Header from '../../../components/Header';
import PeerMap from '../../components/PeerMap';
import CountryDetailPanel from '../../components/CountryDetailPanel';
import Card, { CardRow } from '../../../components/Card';
import { LoadingState, ErrorState } from '../../../components/EmptyState';
import PageHeader from '../../../components/PageHeader';

interface Peer {
    id: number;
    addr: string;
    ip: string;
    subver: string;
    inbound: boolean;
    ping: number;
    version: number;
    location: {
        country: string;
        city: string;
        ll: [number, number];
        countryCode?: string;
        countryName?: string;
    } | null;
    bytes_sent: number;
    bytes_recv: number;
}

interface NodeLocation {
    country?: string;
    countryCode?: string;
    countryName?: string;
    city?: string;
    ll?: [number, number];
}

interface KnownPeer {
    id?: number | string;
    addr?: string;
    subver?: string;
    ping?: number;
    location?: NodeLocation | null;
    services?: number;
    time?: number;
}

type DataMode = "live" | "demo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const DEMO_PEERS: Peer[] = [
    { id: 1, addr: "203.0.113.11:8333", ip: "203.0.113.11", subver: "/Satoshi:26.0.0/", inbound: false, ping: 0.042, version: 70016, location: { country: "US", city: "New York", ll: [40.71, -74.00] }, bytes_sent: 0, bytes_recv: 0 },
    { id: 2, addr: "198.51.100.24:8333", ip: "198.51.100.24", subver: "/Satoshi:25.1.0/", inbound: true, ping: 0.081, version: 70016, location: { country: "DE", city: "Frankfurt", ll: [50.11, 8.68] }, bytes_sent: 0, bytes_recv: 0 },
    { id: 3, addr: "192.0.2.58:8333", ip: "192.0.2.58", subver: "/SatoshiKnots:26.0.0/", inbound: false, ping: 0.114, version: 70016, location: { country: "JP", city: "Tokyo", ll: [35.68, 139.76] }, bytes_sent: 0, bytes_recv: 0 },
    { id: 4, addr: "203.0.113.77:8333", ip: "203.0.113.77", subver: "/Satoshi:26.0.0/", inbound: true, ping: 0.097, version: 70016, location: { country: "BR", city: "Sao Paulo", ll: [-23.55, -46.63] }, bytes_sent: 0, bytes_recv: 0 },
    { id: 5, addr: "198.51.100.91:8333", ip: "198.51.100.91", subver: "/Satoshi:25.0.0/", inbound: false, ping: 0.073, version: 70016, location: { country: "GB", city: "London", ll: [51.50, -0.12] }, bytes_sent: 0, bytes_recv: 0 },
];

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceKm = (from: [number, number], to: [number, number]) => {
    const earthRadiusKm = 6371;
    const dLat = toRadians(to[0] - from[0]);
    const dLon = toRadians(to[1] - from[1]);
    const lat1 = toRadians(from[0]);
    const lat2 = toRadians(to[0]);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
};

const hasCoordinates = <T extends { location?: NodeLocation | null }>(
    node: T
): node is T & { location: NodeLocation & { ll: [number, number] } } => {
    const ll = node?.location?.ll;
    return Array.isArray(ll) && ll.length === 2 && Number.isFinite(ll[0]) && Number.isFinite(ll[1]);
};

export default function NetworkPage() {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [knownPeers, setKnownPeers] = useState<KnownPeer[]>([]);
    const [dataMode, setDataMode] = useState<DataMode>(API_URL ? "live" : "demo");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<{ code: string, name: string } | null>(null);
    const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);
    const autoDeepScanTriggeredRef = useRef(false);

    const fetchPeers = useCallback(() => {
        autoDeepScanTriggeredRef.current = false;
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);

        const fallbackToDemo = () => {
            setPeers(DEMO_PEERS);
            setKnownPeers([]);
            setMapFocus(null);
            setDataMode("demo");
            setLoading(false);
        };

        if (!API_URL) {
            fallbackToDemo();
            clearTimeout(timeout);
            return;
        }

        fetch(`${API_URL}/api/peers`, { cache: "no-store", signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                const safePeers = Array.isArray(data) ? (data as Peer[]) : [];
                if (safePeers.length === 0) {
                    fallbackToDemo();
                    return;
                }
                setPeers(safePeers);
                setDataMode("live");
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch peers:", err);
                fallbackToDemo();
            })
            .finally(() => {
                clearTimeout(timeout);
            });
    }, []);

    useEffect(() => {
        fetchPeers();
    }, [fetchPeers]);

    const focusNearestNode = useCallback(async (nodes: KnownPeer[]) => {
        const locatedNodes = nodes.filter(hasCoordinates);
        if (locatedNodes.length === 0) {
            setMapFocus(null);
            return;
        }

        const browserLocation = await new Promise<[number, number] | null>((resolve) => {
            if (typeof navigator === "undefined" || !navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                ({ coords }) => resolve([coords.latitude, coords.longitude]),
                () => resolve(null),
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
            );
        });

        let nearestNode = locatedNodes[0];
        if (browserLocation) {
            let closestDistance = haversineDistanceKm(browserLocation, nearestNode.location.ll);
            for (let i = 1; i < locatedNodes.length; i += 1) {
                const candidate = locatedNodes[i];
                const distance = haversineDistanceKm(browserLocation, candidate.location.ll);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    nearestNode = candidate;
                }
            }
        } else {
            let lowestPing = Number.isFinite(nearestNode?.ping) ? Number(nearestNode.ping) : Number.POSITIVE_INFINITY;
            for (let i = 1; i < locatedNodes.length; i += 1) {
                const candidate = locatedNodes[i];
                const candidatePing = Number.isFinite(candidate?.ping) ? Number(candidate.ping) : Number.POSITIVE_INFINITY;
                if (candidatePing < lowestPing) {
                    lowestPing = candidatePing;
                    nearestNode = candidate;
                }
            }
        }

        setMapFocus(nearestNode.location.ll);

        const countryCode = String(nearestNode.location.countryCode || nearestNode.location.country || "").trim();
        if (countryCode) {
            setSelectedCountry({
                code: countryCode,
                name: String(nearestNode.location.countryName || nearestNode.location.country || countryCode),
            });
        }
    }, []);

    const handleDeepScan = useCallback(async () => {
        if (dataMode === "demo" || scanning) return;
        setScanning(true);
        try {
            const res = await fetch(`${API_URL}/api/known-nodes`, { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const safeNodes = Array.isArray(data) ? (data as KnownPeer[]) : [];
            setKnownPeers(safeNodes);
            await focusNearestNode(safeNodes);
        } catch (e) {
            console.error("Deep Scan failed", e);
        } finally {
            setScanning(false);
        }
    }, [dataMode, focusNearestNode, scanning]);

    useEffect(() => {
        if (loading || dataMode !== "live" || peers.length === 0 || scanning || autoDeepScanTriggeredRef.current) {
            return;
        }
        autoDeepScanTriggeredRef.current = true;
        void handleDeepScan();
    }, [dataMode, handleDeepScan, loading, peers.length, scanning]);

    const selectedCountryNodes = useMemo(() => {
        if (!selectedCountry) return [];
        const allNodes = [...peers, ...knownPeers];
        return allNodes.filter((node) => {
            const code = String(node.location?.countryCode || node.location?.country || "").trim();
            return code === selectedCountry.code;
        });
    }, [selectedCountry, peers, knownPeers]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-900 selection:text-cyan-100 pb-20 relative overflow-x-hidden">
            {selectedCountry && (
                <CountryDetailPanel
                    countryCode={selectedCountry.code}
                    countryName={selectedCountry.name}
                    nodes={selectedCountryNodes}
                    onClose={() => setSelectedCountry(null)}
                />
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Header />

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <PageHeader
                        title="Global Network"
                        subtitle={
                            dataMode === "live"
                                ? "Visualizing the decentralized P2P connections of your local Bitcoin node."
                                : "Demo mode: showing a static peer snapshot while live node APIs are unavailable."
                        }
                        icon="🌐"
                        gradient="from-emerald-400 to-cyan-400"
                    />

                    {dataMode === "demo" && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                            Live peer discovery is unavailable. Rendering demo peer data so this view remains usable.
                        </div>
                    )}

                    {loading && <LoadingState message="Connecting to peer telemetry..." />}

                    {!loading && error && <ErrorState message={error} onRetry={fetchPeers} />}

                    {!loading && !error && peers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="text-6xl mb-4">🌍</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Peers Found</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-8">
                                Your node does not seem to be connected to any peers. Check your network connection.
                            </p>
                            <button
                                onClick={fetchPeers}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-200 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !error && peers.length > 0 && (
                        <>
                            <div className="relative">
                                <PeerMap
                                    peers={peers}
                                    knownPeers={knownPeers}
                                    onCountrySelect={(code, name) => {
                                        setMapFocus(null);
                                        setSelectedCountry({ code, name });
                                    }}
                                    selectedCountryCode={selectedCountry?.code}
                                    focusCoordinates={mapFocus}
                                />

                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={handleDeepScan}
                                        disabled={dataMode === "demo" || scanning}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase border transition-all ${scanning
                                                ? 'bg-cyan-900/50 border-cyan-800 text-cyan-400 cursor-wait'
                                                : dataMode === "demo"
                                                    ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
                                                    : knownPeers.length > 0
                                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:border-emerald-300'
                                                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400'
                                            }`}
                                    >
                                        {dataMode === "demo"
                                            ? "Deep Scan (Live API Required)"
                                            : scanning
                                                ? 'Scanning...'
                                                : knownPeers.length > 0
                                                    ? `Re-Scan (${knownPeers.length})`
                                                    : 'Deep Scan'}
                                    </button>
                                </div>
                            </div>

                            {/* Peer Section */}
                            <Card variant="panel" className="p-0 overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Connections</h3>
                                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">{peers.length} Peers</span>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden p-4 space-y-3">
                                    {peers.slice(0, 20).map((peer) => (
                                        <Card key={peer.id} className="p-4" hoverable={false}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-mono text-sm text-cyan-300 truncate max-w-[60vw] md:max-w-44">
                                                    {peer.addr}
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${peer.inbound
                                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                    }`}>
                                                    {peer.inbound ? 'IN' : 'OUT'}
                                                </span>
                                            </div>
                                            <CardRow
                                                label="Location"
                                                value={peer.location ? `${peer.location.city}, ${peer.location.country}` : 'Unknown'}
                                            />
                                            <CardRow
                                                label="Client"
                                                value={peer.subver.replace(/\//g, '').substring(0, 20)}
                                            />
                                            <CardRow
                                                label="Ping"
                                                value={`${(peer.ping * 1000).toFixed(0)} ms`}
                                                mono
                                            />
                                        </Card>
                                    ))}
                                    {peers.length > 20 && (
                                        <p className="text-center text-xs text-slate-500 py-2">
                                            Showing 20 of {peers.length} peers
                                        </p>
                                    )}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-400">
                                        <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">IP Address</th>
                                                <th className="px-6 py-3 font-medium">Location</th>
                                                <th className="px-6 py-3 font-medium">Client</th>
                                                <th className="px-6 py-3 font-medium text-right">Direction</th>
                                                <th className="px-6 py-3 font-medium text-right">Ping</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {peers.slice(0, 20).map((peer) => (
                                                <tr key={peer.id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-cyan-300/80 max-w-40 truncate" title={peer.addr}>
                                                        {peer.addr}
                                                    </td>
                                                    <td className="px-6 py-4 max-w-[60vw] md:max-w-44 truncate">
                                                        {peer.location ? (
                                                            <span title={`${peer.location.city}, ${peer.location.country}`}>
                                                                {peer.location.city}, {peer.location.country}
                                                            </span>
                                                        ) : <span className="text-slate-600 italic">Unknown</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 whitespace-nowrap inline-block max-w-40 truncate align-middle" title={peer.subver}>
                                                            {peer.subver.replace(/\//g, '')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${peer.inbound
                                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                            }`}>
                                                            {peer.inbound ? 'INBOUND' : 'OUTBOUND'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                                                        {(peer.ping * 1000).toFixed(0)} ms
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {peers.length > 20 && (
                                    <div className="hidden md:block px-6 py-3 bg-slate-900/30 text-center text-xs text-slate-500 border-t border-slate-800">
                                        showing top 20 of {peers.length} peers
                                    </div>
                                )}
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
