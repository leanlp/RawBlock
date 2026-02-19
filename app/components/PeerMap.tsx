"use client";

import { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Tooltip } from 'react-tooltip';
import { MotionConfig } from "framer-motion";
import Card from '../../components/Card';

// Use a reliable TopoJSON source for the world map
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface PeerLocation {
    country?: string;
    city?: string;
    ll?: [number, number]; // [lat, lon]
}

interface Peer {
    id: number;
    addr: string;
    ip: string;
    subver: string;
    inbound: boolean;
    version: number;
    ping: number;
    location: PeerLocation | null;
}

interface KnownPeer {
    id?: number | string;
    location?: PeerLocation | null;
}

interface PeerMapProps {
    peers: Peer[];
    knownPeers?: KnownPeer[];
    onCountrySelect?: (countryCode: string, countryName: string) => void;
    selectedCountryCode?: string | null;
    focusCoordinates?: [number, number] | null; // [lat, lon]
}

// Simple centroid lookup for demo (replace with d3-geo or full list later)
const COUNTRY_CENTERS: Record<string, [number, number]> = {
    'US': [-95.71, 37.09], 'DE': [10.45, 51.16], 'CN': [104.19, 35.86],
    'FR': [2.21, 46.22], 'GB': [-3.43, 55.37], 'BR': [-51.92, -14.23],
    'RU': [105.31, 61.52], 'AU': [133.77, -25.27], 'CA': [-106.34, 56.13],
    'IN': [78.96, 20.59], 'JP': [138.25, 36.20]
};

// Mapping for countries where the map data might not have ISO_A2 or it differs
const NAME_TO_ISO: Record<string, string> = {
    'United States of America': 'US',
    'United States': 'US',
    'Germany': 'DE',
    'France': 'FR',
    'China': 'CN',
    'Russia': 'RU',
    'Brazil': 'BR',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'India': 'IN',
    'Japan': 'JP',
    'South Korea': 'KR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Netherlands': 'NL',
    'Argentina': 'AR',
    'Mexico': 'MX',
    'South Africa': 'ZA',
    'Switzerland': 'CH',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Poland': 'PL',
    'Ukraine': 'UA',
    'Turkey': 'TR',
    'Iran': 'IR',
    'Venezuela': 'VE',
    'Colombia': 'CO',
    'Chile': 'CL',
    'Peru': 'PE'
};

interface GeoFeature {
    rsmKey: string;
    properties: Record<string, string>;
}

type LocatedPeer = Peer & { location: PeerLocation & { ll: [number, number] } };
type LocatedKnownPeer = KnownPeer & { location: PeerLocation & { ll: [number, number] } };

const hasCoordinates = (location?: PeerLocation | null): location is PeerLocation & { ll: [number, number] } =>
    Array.isArray(location?.ll) &&
    location.ll.length === 2 &&
    Number.isFinite(location.ll[0]) &&
    Number.isFinite(location.ll[1]);

const hasPeerCoordinates = (peer: Peer): peer is LocatedPeer => hasCoordinates(peer.location);
const hasKnownPeerCoordinates = (node: KnownPeer): node is LocatedKnownPeer => hasCoordinates(node.location);

export default function PeerMap({ peers, knownPeers = [], onCountrySelect, selectedCountryCode, focusCoordinates = null }: PeerMapProps) {
    const locatedPeers = useMemo(() => peers.filter(hasPeerCoordinates), [peers]);
    const locatedKnownPeers = useMemo(() => knownPeers.filter(hasKnownPeerCoordinates), [knownPeers]);

    const position = useMemo(() => {
        if (focusCoordinates && focusCoordinates.length === 2) {
            return { coordinates: [focusCoordinates[1], focusCoordinates[0]], zoom: 6 };
        }
        if (selectedCountryCode && COUNTRY_CENTERS[selectedCountryCode]) {
            return { coordinates: COUNTRY_CENTERS[selectedCountryCode], zoom: 4 };
        }
        return { coordinates: [0, 20], zoom: 1 };
    }, [focusCoordinates, selectedCountryCode]);

    return (
        <Card className="w-full h-[500px] p-0 overflow-hidden relative" variant="panel" accent="cyan">
            <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-auto z-10 pointer-events-none">
                <h2 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    Global Nodes
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] sm:text-xs font-mono">
                    <span className="rounded bg-slate-950/75 border border-slate-700/80 px-2 py-1 text-slate-300">
                        Connected: <span className="text-cyan-400 font-bold">{peers.length}</span>
                    </span>
                    <span className="rounded bg-slate-950/75 border border-slate-700/80 px-2 py-1 text-slate-300">
                        Known: <span className="text-sky-400 font-bold">{knownPeers.length}</span>
                    </span>
                    <span className="rounded bg-slate-950/75 border border-slate-700/80 px-2 py-1 text-slate-300">
                        Located: <span className="text-emerald-400 font-bold">{locatedPeers.length + locatedKnownPeers.length}</span>
                    </span>
                </div>
            </div>

            <MotionConfig transition={{ duration: 1 }}>
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 100 * position.zoom,
                        center: position.coordinates as [number, number]
                    }}
                    style={{ width: "100%", height: "100%", transition: "all 1s ease-in-out" }}
                >
                    <Geographies geography={GEO_URL}>
                        {({ geographies }: { geographies: GeoFeature[] }) =>
                            geographies.map((geo) => {
                                // Robust code resolution
                                const geoName = geo.properties.NAME || geo.properties.name;
                                const code = geo.properties.ISO_A2 || NAME_TO_ISO[geoName] || geo.properties.ISO_A3;
                                const isSelected = selectedCountryCode === code;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => {
                                            if (onCountrySelect && code) {
                                                onCountrySelect(code, geoName);
                                            }
                                        }}
                                        fill={isSelected ? "rgba(34, 211, 238, 0.2)" : "#1e293b"}
                                        stroke={isSelected ? "#22d3ee" : "#0f172a"}
                                        strokeWidth={isSelected ? 1 : 0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: "#334155", outline: "none", cursor: "pointer" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                )
                            })
                        }
                    </Geographies>

                    {/* Known Node Markers (Outer Rim) */}
                    {locatedKnownPeers.map((node, i) => (
                        <Marker
                            key={`known-${node.id ?? i}`}
                            coordinates={[node.location.ll[1], node.location.ll[0]]}
                            data-tooltip-id="peer-tooltip"
                            data-tooltip-content={`Known Node (${node.location.city || "Unknown"}, ${node.location.country || "Unknown"})`}
                        >
                            <circle r={1.5} fill="#475569" fillOpacity={0.6} />
                        </Marker>
                    ))}

                    {/* Peer Markers */}
                    {locatedPeers.map((peer) => (
                        <Marker
                            key={peer.id}
                            coordinates={[peer.location.ll[1], peer.location.ll[0]]} // [lon, lat] - GeoJSON uses Lon,Lat order!
                            data-tooltip-id="peer-tooltip"
                            data-tooltip-content={`${peer.subver} (${peer.location.city || "Unknown"}, ${peer.location.country || "Unknown"}) - Ping: ${(peer.ping * 1000).toFixed(0)}ms`}
                        >
                            <circle r={4} fill={peer.inbound ? "#f43f5e" : "#22d3ee"} stroke="#fff" strokeWidth={1} className="animate-pulse" />
                        </Marker>
                    ))}
                </ComposableMap>
            </MotionConfig>

            <Tooltip
                id="peer-tooltip"
                border="1px solid #1e293b"
                style={{ backgroundColor: "#0f172a", color: "#f1f5f9", borderRadius: "8px" }}
            />

            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex gap-3 sm:gap-4 text-[10px] text-slate-500 font-mono pointer-events-none">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400"></div> OUTBOUND</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> INBOUND</div>
            </div>
        </Card>
    );
}
