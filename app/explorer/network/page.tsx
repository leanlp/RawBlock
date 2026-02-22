"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Header from '../../../components/Header';
import dynamic from 'next/dynamic';

const PeerMap = dynamic(() => import('../../components/PeerMap'), {
    ssr: false,
    loading: () => <div className="animate-pulse h-[600px] w-full bg-slate-900/50 rounded-xl" />
});
import CountryDetailPanel from '../../components/CountryDetailPanel';
import Card, { CardRow } from '../../../components/Card';
import { LoadingState, ErrorState } from '../../../components/EmptyState';
import PageHeader from '../../../components/PageHeader';
import NetworkAnalyticsPanel from '../../../components/network/NetworkAnalyticsPanel';
import ProvenanceBadge from '../../../components/ProvenanceBadge';
import ScreenshotExport from '../../../components/ScreenshotExport';
import { useTranslation } from '@/lib/i18n';

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

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const DEMO_PEERS: Peer[] = [
    { id: 1, addr: "203.0.113.11:8333", ip: "203.0.113.11", subver: "/Satoshi:26.0.0/", inbound: false, ping: 0.042, version: 70016, location: { country: "US", city: "New York", ll: [40.71, -74.00] }, bytes_sent: 0, bytes_recv: 0 },
    { id: 2, addr: "198.51.100.24:8333", ip: "198.51.100.24", subver: "/Satoshi:25.1.0/", inbound: true, ping: 0.081, version: 70016, location: { country: "DE", city: "Frankfurt", ll: [50.11, 8.68] }, bytes_sent: 0, bytes_recv: 0 },
    { id: 3, addr: "192.0.2.58:8333", ip: "192.0.2.58", subver: "/SatoshiKnots:26.0.0/", inbound: false, ping: 0.114, version: 70016, location: { country: "JP", city: "Tokyo", ll: [35.68, 139.76] }, bytes_sent: 0, bytes_recv: 0 },
    { id: 4, addr: "203.0.113.77:8333", ip: "203.0.113.77", subver: "/Satoshi:26.0.0/", inbound: true, ping: 0.097, version: 70016, location: { country: "BR", city: "Sao Paulo", ll: [-23.55, -46.63] }, bytes_sent: 0, bytes_recv: 0 },
    { id: 5, addr: "198.51.100.91:8333", ip: "198.51.100.91", subver: "/Satoshi:25.0.0/", inbound: false, ping: 0.073, version: 70016, location: { country: "GB", city: "London", ll: [51.50, -0.12] }, bytes_sent: 0, bytes_recv: 0 },
];

const ISO3_TO_ISO2: Record<string, string> = {
    ARG: "AR",
    USA: "US",
    GBR: "GB",
    DEU: "DE",
    FRA: "FR",
    ESP: "ES",
    ITA: "IT",
    CAN: "CA",
    BRA: "BR",
    CHL: "CL",
    MEX: "MX",
    ZAF: "ZA",
    AUS: "AU",
    JPN: "JP",
    CHN: "CN",
    IND: "IN",
    NLD: "NL",
    SWE: "SE",
    NOR: "NO",
    CHE: "CH",
    POL: "PL",
    TUR: "TR",
    UKR: "UA",
    RUS: "RU",
};

const normalizeCountryCode = (value?: string | null): string | null => {
    if (!value) return null;
    const raw = String(value).trim().toUpperCase();
    if (raw.length === 2) return raw;
    if (raw.length === 3) return ISO3_TO_ISO2[raw] || raw;
    return null;
};

const normalizeCountryName = (value?: string | null): string | null => {
    if (!value) return null;
    const raw = String(value).trim().toLowerCase();
    return raw || null;
};

const peerMatchesCountry = (node: Peer, countryCode: string, countryName: string) => {
    const selectedCode = normalizeCountryCode(countryCode);
    const selectedName = normalizeCountryName(countryName);

    const nodeCodeA = normalizeCountryCode(node.location?.countryCode);
    const nodeCodeB = normalizeCountryCode(node.location?.country);
    const nodeNameA = normalizeCountryName(node.location?.countryName);
    const nodeNameB = normalizeCountryName(node.location?.country);

    const codeMatch =
        !!selectedCode && (nodeCodeA === selectedCode || nodeCodeB === selectedCode);
    const nameMatch =
        !!selectedName && (nodeNameA === selectedName || nodeNameB === selectedName);

    return codeMatch || nameMatch;
};

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

const sanitizePingMs = (pingSeconds?: number): number | null => {
    if (!Number.isFinite(pingSeconds) || Number(pingSeconds) < 0) return null;
    const ms = Number(pingSeconds) * 1000;
    if (!Number.isFinite(ms) || ms > 10_000) return null;
    return ms;
};

const formatPingValue = (pingSeconds?: number) => {
    const ms = sanitizePingMs(pingSeconds);
    return ms === null ? "N/A" : `${Math.round(ms)} ms`;
};

const formatLocation = (location?: NodeLocation | null) => {
    if (!location) return "Unknown";
    const city = (location.city || "").trim();
    const country = (location.countryName || location.countryCode || location.country || "").trim();
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return "Unknown";
};

const hasCoordinates = <T extends { location?: NodeLocation | null }>(
    node: T
): node is T & { location: NodeLocation & { ll: [number, number] } } => {
    const ll = node?.location?.ll;
    return Array.isArray(ll) && ll.length === 2 && Number.isFinite(ll[0]) && Number.isFinite(ll[1]);
};

function NetworkContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();

    const [peers, setPeers] = useState<Peer[]>([]);
    const [knownPeers, setKnownPeers] = useState<KnownPeer[]>([]);
    const [dataMode, setDataMode] = useState<DataMode>(API_URL ? "live" : "demo");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<{ code: string, name: string } | null>(null);
    const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);

    // Initialize from URL state
    const initialLatency = (searchParams.get("latency") as "all" | "fast" | "medium" | "slow") || "all";
    const [pingFilter, setPingFilter] = useState<"all" | "fast" | "medium" | "slow">(initialLatency);

    // Sync state to URL
    const handlePingFilter = useCallback((filter: "all" | "fast" | "medium" | "slow") => {
        setPingFilter(filter);
        const params = new URLSearchParams(searchParams.toString());
        if (filter === "all") {
            params.delete("latency");
        } else {
            params.set("latency", filter);
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);
    const filteredPeers = useMemo(() => {
        return peers.filter(p => {
            if (pingFilter === "all") return true;
            const ms = sanitizePingMs(p.ping);
            if (ms === null) return false;
            if (pingFilter === "fast") return ms < 50;
            if (pingFilter === "medium") return ms >= 50 && ms <= 150;
            if (pingFilter === "slow") return ms > 150;
            return true;
        });
    }, [peers, pingFilter]);
    const fetchPeers = useCallback(() => {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(new Error("Timeout")), 8_000);

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
                if (err.name !== 'AbortError' && err.message !== 'Timeout') {
                    console.error("Failed to fetch peers:", err);
                }
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
    }, []);

    useEffect(() => {
        if (loading || dataMode !== "live") {
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);

        fetch(`${API_URL}/api/known-nodes`, { cache: "no-store", signal: controller.signal })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                const safeNodes = Array.isArray(data) ? (data as KnownPeer[]) : [];
                setKnownPeers(safeNodes);
                void focusNearestNode(safeNodes);
            })
            .catch(() => {
                setKnownPeers([]);
            })
            .finally(() => {
                clearTimeout(timeout);
            });

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [dataMode, focusNearestNode, loading]);

    const selectedCountryNodes = useMemo(() => {
        if (!selectedCountry) return [];
        const knownMatches = knownPeers.filter((node) => {
            const selectedCode = normalizeCountryCode(selectedCountry.code);
            const selectedName = normalizeCountryName(selectedCountry.name);
            const nodeCodeA = normalizeCountryCode(node.location?.countryCode);
            const nodeCodeB = normalizeCountryCode(node.location?.country);
            const nodeNameA = normalizeCountryName(node.location?.countryName);
            const nodeNameB = normalizeCountryName(node.location?.country);

            const codeMatch =
                !!selectedCode && (nodeCodeA === selectedCode || nodeCodeB === selectedCode);
            const nameMatch =
                !!selectedName && (nodeNameA === selectedName || nodeNameB === selectedName);

            return codeMatch || nameMatch;
        });
        if (knownMatches.length > 0) return knownMatches;
        return peers.filter((node) => peerMatchesCountry(node, selectedCountry.code, selectedCountry.name));
    }, [knownPeers, peers, selectedCountry]);

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

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <PageHeader
                        title={t.network.title}
                        subtitle={
                            dataMode === "live"
                                ? t.network.subtitleLive
                                : t.network.subtitleDemo
                        }
                        icon="🌐"
                        gradient="from-emerald-400 to-cyan-400"
                    />
                    {!loading && !error && (
                        <ProvenanceBadge
                            source={dataMode === 'live' ? 'Live Node' : 'Public API Fallback'}
                            timestamp={new Date().toISOString().split('T')[0]}
                            className="self-start md:self-auto"
                        />
                    )}
                </div>

                {!loading && !error && peers.length > 0 && (
                    <NetworkAnalyticsPanel
                        peers={peers}
                        onPingFilter={handlePingFilter}
                        currentPingFilter={pingFilter}
                    />
                )}

                {dataMode === "demo" && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                        {t.network.demoNotice}
                    </div>
                )}

                {loading && <LoadingState message={t.network.connectingTelemetry} />}

                {!loading && error && <ErrorState message={error} onRetry={fetchPeers} />}

                {!loading && !error && peers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-6xl mb-4">🌍</div>
                        <h3 className="text-xl font-bold text-white mb-2">{t.network.noPeersFound}</h3>
                        <p className="text-slate-400 max-w-md mx-auto mb-8">
                            {t.network.noPeersDescription}
                        </p>
                        <button
                            onClick={fetchPeers}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-200 transition-colors"
                        >
                            {t.network.retry}
                        </button>
                    </div>
                )}

                {!loading && !error && peers.length > 0 && (
                    <>
                        <div className="relative" id="network-map-export-target">
                            <PeerMap
                                peers={filteredPeers}
                                knownPeers={knownPeers}
                                onCountrySelect={(code, name) => {
                                    setMapFocus(null);
                                    const hasKnownNodes = knownPeers.some((node) => {
                                        const selectedCode = normalizeCountryCode(code);
                                        const selectedName = normalizeCountryName(name);
                                        const nodeCodeA = normalizeCountryCode(node.location?.countryCode);
                                        const nodeCodeB = normalizeCountryCode(node.location?.country);
                                        const nodeNameA = normalizeCountryName(node.location?.countryName);
                                        const nodeNameB = normalizeCountryName(node.location?.country);
                                        const codeMatch =
                                            !!selectedCode && (nodeCodeA === selectedCode || nodeCodeB === selectedCode);
                                        const nameMatch =
                                            !!selectedName && (nodeNameA === selectedName || nodeNameB === selectedName);
                                        return codeMatch || nameMatch;
                                    });
                                    const hasActiveNodes = peers.some((node) => peerMatchesCountry(node, code, name));
                                    setSelectedCountry(hasKnownNodes || hasActiveNodes ? { code, name } : null);
                                }}
                                selectedCountryCode={selectedCountry?.code}
                                focusCoordinates={mapFocus}
                            />

                            <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2">
                                <ScreenshotExport targetId="network-map-export-target" filename="network-map" buttonText="Export PNG" />
                            </div>
                        </div>

                        {/* Peer Section */}
                        <Card variant="panel" className="p-0 overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.network.activeConnections}</h3>
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">{filteredPeers.length} {t.network.peers}</span>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden p-4 space-y-3">
                                {filteredPeers.slice(0, 20).map((peer) => (
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
                                            label={t.network.location}
                                            value={formatLocation(peer.location)}
                                        />
                                        <CardRow
                                            label={t.network.client}
                                            value={peer.subver.replace(/\//g, '').substring(0, 20)}
                                        />
                                        <CardRow
                                            label={t.network.ping}
                                            value={formatPingValue(peer.ping)}
                                            mono
                                        />
                                    </Card>
                                ))}
                                {filteredPeers.length > 20 && (
                                    <p className="text-center text-xs text-slate-500 py-2">
                                        Showing 20 of {filteredPeers.length} peers
                                    </p>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">{t.network.ipAddress}</th>
                                            <th className="px-6 py-3 font-medium">{t.network.location}</th>
                                            <th className="px-6 py-3 font-medium">{t.network.client}</th>
                                            <th className="px-6 py-3 font-medium text-right">{t.network.direction}</th>
                                            <th className="px-6 py-3 font-medium text-right">{t.network.ping}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredPeers.slice(0, 20).map((peer) => (
                                            <tr key={peer.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-cyan-300/80 max-w-40 truncate" title={peer.addr}>
                                                    {peer.addr}
                                                </td>
                                                <td className="px-6 py-4 max-w-[60vw] md:max-w-44 truncate">
                                                    {peer.location ? (
                                                        <span title={formatLocation(peer.location)}>
                                                            {formatLocation(peer.location)}
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
                                                    {formatPingValue(peer.ping)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredPeers.length > 20 && (
                                <div className="hidden md:block px-6 py-3 bg-slate-900/30 text-center text-xs text-slate-500 border-t border-slate-800">
                                    showing top 20 of {filteredPeers.length} peers
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </main>
    );
}

export default function NetworkPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>}>
            <NetworkContent />
        </Suspense>
    );
}
