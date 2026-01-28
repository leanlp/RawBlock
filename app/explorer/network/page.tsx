"use client";

import { useEffect, useState, useMemo } from 'react';
import Header from '../../../components/Header';
import PeerMap from '../../components/PeerMap';
import CountryDetailPanel from '../../components/CountryDetailPanel';

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
    const [scanning, setScanning] = useState(false);

    // Country Selection State
    const [selectedCountry, setSelectedCountry] = useState<{ code: string, name: string } | null>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/peers`)
            .then(res => res.json())
            .then(data => {
                setPeers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch peers:", err);
                setLoading(false);
            });
    }, []);

    const handleDeepScan = async () => {
        if (knownPeers.length > 0) return; // Already scanned
        setScanning(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/known-nodes`);
            const data = await res.json();
            setKnownPeers(data);
        } catch (e) {
            console.error("Deep Scan failed", e);
        } finally {
            setScanning(false);
        }
    };

    // Filter nodes for the selected country
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

                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                Global Network
                            </h1>
                            <p className="text-slate-500 mt-2 font-mono text-sm max-w-2xl">
                                Visualizing the decentralized P2P connections of your local Bitcoin node.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-[500px] w-full bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-500">
                            <div className="relative mb-4">
                                <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                            <span className="font-mono text-xs tracking-widest animate-pulse">LOCATING GLOBAL PEERS...</span>
                        </div>
                    ) : (
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
                                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase border transition-all ${knownPeers.length > 0
                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 cursor-default'
                                        : scanning
                                            ? 'bg-cyan-900/50 border-cyan-800 text-cyan-400 cursor-wait'
                                            : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400'
                                        }`}
                                >
                                    {scanning ? 'Scanning Network...' : knownPeers.length > 0 ? `Scan Complete (${knownPeers.length} Nodes)` : 'Start Deep Scan'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Peer Table */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Connections</h3>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">{peers.length} Peers</span>
                        </div>
                        <div className="overflow-x-auto">
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
                                            <td className="px-6 py-4 font-mono text-cyan-300/80">{peer.addr}</td>
                                            <td className="px-6 py-4">
                                                {peer.location ? (
                                                    <span className="flex items-center gap-2">
                                                        <span>{peer.location.city}, {peer.location.country}</span>
                                                    </span>
                                                ) : <span className="text-slate-600 italic">Unknown</span>}
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 whitespace-nowrap">
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
                            <div className="px-6 py-3 bg-slate-900/30 text-center text-xs text-slate-500 border-t border-slate-800">
                                showing top 20 of {peers.length} peers
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
