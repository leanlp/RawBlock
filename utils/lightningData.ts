import { Node, Edge } from '@xyflow/react';

// Custom Node Types for the Lightning Graph
export type LightningNodeType = 'hub' | 'exchange' | 'user';

export interface LightningNodeData extends Record<string, unknown> {
    label: string;
    type: LightningNodeType;
    capacity: number; // in BTC
    alias: string;
    color: string;
}

export interface LightningEdgeData extends Record<string, unknown> {
    capacity: number;
    baseFee: number;
    feeRate: number; // ppm
    isAnomalous?: boolean;
}

// Mock Data representing a subset of the Lightning Network
export const initialNodes: Node<LightningNodeData>[] = [
    {
        id: 'node-kraken',
        type: 'lightningNode',
        position: { x: 400, y: 150 },
        data: { label: 'Kraken', alias: 'Kraken_LN', type: 'exchange', capacity: 1250, color: '#8b5cf6' },
    },
    {
        id: 'node-bitfinex',
        type: 'lightningNode',
        position: { x: 150, y: 300 },
        data: { label: 'Bitfinex', alias: 'BFX_LND', type: 'exchange', capacity: 2800, color: '#10b981' },
    },
    {
        id: 'node-river',
        type: 'lightningNode',
        position: { x: 650, y: 350 },
        data: { label: 'River', alias: 'River Financial', type: 'hub', capacity: 850, color: '#3b82f6' },
    },
    {
        id: 'node-wallet-ofs',
        type: 'lightningNode',
        position: { x: 400, y: 550 },
        data: { label: 'WalletOfSatoshi', alias: 'WoS', type: 'hub', capacity: 1100, color: '#f59e0b' },
    },
     {
        id: 'node-acinq',
        type: 'lightningNode',
        position: { x: 200, y: 600 },
        data: { label: 'ACINQ', alias: 'ACINQ', type: 'hub', capacity: 3100, color: '#ec4899' },
    },
    // some smaller peripheral nodes
    {
         id: 'node-user-1',
         type: 'lightningNode',
         position: { x: 800, y: 200 },
         data: { label: 'Alice', alias: 'alice_node', type: 'user', capacity: 0.5, color: '#64748b' },
    },
    {
         id: 'node-user-2',
         type: 'lightningNode',
         position: { x: 100, y: 100 },
         data: { label: 'Bob', alias: 'bob_routing', type: 'user', capacity: 2.1, color: '#64748b' },
    }
];

export const initialEdges: Edge<LightningEdgeData>[] = [
    // Exchanges to Hubs
    { id: 'e-bfx-acinq', source: 'node-bitfinex', target: 'node-acinq', type: 'lightningEdge', data: { capacity: 500, baseFee: 1000, feeRate: 50 } },
    { id: 'e-kraken-river', source: 'node-kraken', target: 'node-river', type: 'lightningEdge', data: { capacity: 150, baseFee: 1000, feeRate: 10 } },
    { id: 'e-kraken-wos', source: 'node-kraken', target: 'node-wallet-ofs', type: 'lightningEdge', data: { capacity: 300, baseFee: 0, feeRate: 0 } },
    { id: 'e-bfx-wos', source: 'node-bitfinex', target: 'node-wallet-ofs', type: 'lightningEdge', data: { capacity: 250, baseFee: 1000, feeRate: 100 } },
    
    // Hubs to Hubs (Thick channels)
    { id: 'e-acinq-wos', source: 'node-acinq', target: 'node-wallet-ofs', type: 'lightningEdge', data: { capacity: 800, baseFee: 1000, feeRate: 250 } },
    { id: 'e-river-wos', source: 'node-river', target: 'node-wallet-ofs', type: 'lightningEdge', data: { capacity: 450, baseFee: 1000, feeRate: 100 } },
    
    // Peripheral routing
    { id: 'e-alice-river', source: 'node-user-1', target: 'node-river', type: 'lightningEdge', data: { capacity: 0.5, baseFee: 1000, feeRate: 1 } },
    { id: 'e-bob-bfx', source: 'node-user-2', target: 'node-bitfinex', type: 'lightningEdge', data: { capacity: 2.1, baseFee: 500, feeRate: 5 } },
    { id: 'e-bob-kraken', source: 'node-user-2', target: 'node-kraken', type: 'lightningEdge', data: { capacity: 1.0, baseFee: 500, feeRate: 50, isAnomalous: true } }, // Flagged for high fee
];
