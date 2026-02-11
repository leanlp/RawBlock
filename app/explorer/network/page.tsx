"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
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
    } | null;
    bytes_sent: number;
    bytes_recv: number;
}

export default function NetworkPage() {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [knownPeers, setKnownPeers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<{ code: string, name: string } | null>(null);

    const fetchPeers = useCallback(() => {
        setLoading(true);
        setError(null);

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/peers`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                setPeers(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch peers:", err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchPeers();
    }, [fetchPeers]);

    const handleDeepScan = async () => {
        if (knownPeers.length > 0) return;
        setScanning(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/known-nodes`);
            const data = await res.json();
            setKnownPeers(data);
        } catch (e) {
            console.error("Deep Scan failed", e);
        } finally {
            setScanning(false);
        }
    };

    const selectedCountryNodes = useMemo(() => {
        if (!selectedCountry) return [];
        const allNodes = [...peers, ...knownPeers];
        return allNodes.filter(n => n.location?.country === selectedCountry.code);
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
                        subtitle="Visualizing the decentralized P2P connections of your local Bitcoin node."
                        icon="🌐"
                        gradient="from-emerald-400 to-cyan-400"
                    />

                    {loading && <LoadingState message="Locating global peers..." />}

                    {!loading && error && <ErrorState message={error} onRetry={fetchPeers} />}

                    {!loading && !error && peers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="text-6xl mb-4">🌍</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Peers Found</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-8">
                                Your node doesn't seem to be connected to any peers. Check your network connection.
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
                                    onCountrySelect={(code, name) => setSelectedCountry({ code, name })}
                                    selectedCountryCode={selectedCountry?.code}
                                />

                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={handleDeepScan}
                                        disabled={scanning || knownPeers.length > 0}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase border transition-all ${knownPeers.length > 0
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 cursor-default'
                                            : scanning
                                                ? 'bg-cyan-900/50 border-cyan-800 text-cyan-400 cursor-wait'
                                                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400'
                                            }`}
                                    >
                                        {scanning ? 'Scanning...' : knownPeers.length > 0 ? `${knownPeers.length} Nodes` : 'Deep Scan'}
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
                                                <span className="font-mono text-sm text-cyan-300 truncate max-w-[180px]">
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
                                                    <td className="px-6 py-4 font-mono text-cyan-300/80 max-w-[160px] truncate" title={peer.addr}>
                                                        {peer.addr}
                                                    </td>
                                                    <td className="px-6 py-4 max-w-[180px] truncate">
                                                        {peer.location ? (
                                                            <span title={`${peer.location.city}, ${peer.location.country}`}>
                                                                {peer.location.city}, {peer.location.country}
                                                            </span>
                                                        ) : <span className="text-slate-600 italic">Unknown</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 whitespace-nowrap inline-block max-w-[160px] truncate align-middle" title={peer.subver}>
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
