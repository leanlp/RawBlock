import { NextResponse } from 'next/server';

const ELECTRS_URL = process.env.ELECTRS_API_URL || 'http://127.0.0.1:3002';
const CORE_RPC_HOST = process.env.BITCOIN_RPC_HOST || '192.168.1.41';
const CORE_RPC_PORT = process.env.BITCOIN_RPC_PORT || 8332;
const CORE_RPC_USER = process.env.BITCOIN_RPC_USER;
const CORE_RPC_PASS = process.env.BITCOIN_RPC_PASSWORD;

// We need a helper to call Core because basic Electrs /blocks endpoint might not have size/weight in the list
async function coreRpc(method: string, params: any[] = []) {
    const auth = Buffer.from(`${CORE_RPC_USER}:${CORE_RPC_PASS}`).toString('base64');
    const res = await fetch(`http://${CORE_RPC_HOST}:${CORE_RPC_PORT}`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}` },
        body: JSON.stringify({ jsonrpc: '1.0', id: 'miners', method, params })
    });
    const json = await res.json();
    return json.result;
}

export async function GET() {
    try {
        console.log("Fetching blocks for visualizer...");
        
        // 1. Get recent blocks from Electrs (it's often faster for lists)
        // Electrs: GET /blocks
        const res = await fetch(`${ELECTRS_URL}/blocks`);
        if (!res.ok) throw new Error("Electrs fetch failed");
        
        const basicBlocks = await res.json();
        // Take top 8 blocks for the train
        const recent = basicBlocks.slice(0, 8);

        // 2. Enhance with Weights/Size (Parallel)
        const detailedBlocks = await Promise.all(recent.map(async (b: any) => {
            // Electrs doesn't always give full stats in list.
            // Let's use Core 'getblockheader' or 'getblock' (verbosity 1) to get size/weight/nTx
            // Optimization: If we trust Electrs /block/:hash endpoint, use that.
            
            const detailRes = await fetch(`${ELECTRS_URL}/block/${b.id}`);
            const details = await detailRes.json();
            
            // Calculate pseudo-'fullness'
            // Max Weight = 4,000,000 wu
            const fullness = details.weight / 4000000;
            
            return {
                height: details.height,
                hash: details.id,
                time: details.timestamp,
                tx_count: details.tx_count,
                size: details.size,
                weight: details.weight,
                fullness: fullness,
                // Simulate fee density color for now (or fetch 1st tx fee?)
                // Real implementation would need block stats.
                median_fee: Math.random() * 10 + 5 // Mock for MVP visual
            };
        }));
        
        return NextResponse.json(detailedBlocks);

    } catch (error: any) {
        console.error("Visual Blocks API Error:", error);
         return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
