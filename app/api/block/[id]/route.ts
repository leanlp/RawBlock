import { NextResponse } from 'next/server';

const ELECTRS_URL = process.env.ELECTRS_API_URL || 'http://127.0.0.1:3002';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    
    try {
        let hash = id;

        // 1. Resolve Height to Hash if needed
        if (/^\d+$/.test(id)) {
            const heightRes = await fetch(`${ELECTRS_URL}/blocks/tip/height/${id}`);
            if (!heightRes.ok) throw new Error("Block height not found");
            hash = await heightRes.text(); // Returns raw hash string
        }

        // 2. Fetch Block Header
        const headerRes = await fetch(`${ELECTRS_URL}/block/${hash}`);
        if (!headerRes.ok) throw new Error("Block not found");
        const header = await headerRes.json();

        // 3. Fetch Transactions (First 25 or so)
        // Electrs: GET /block/:hash/txs
        const txsRes = await fetch(`${ELECTRS_URL}/block/${hash}/txs`);
        const txs = await txsRes.json();

        // 4. Fetch additional Indexer stats (Reward, etc) is tricky with basic Electrs.
        // We can calc reward from subsidy + fees.
        // Subsidy: 50 >> (height / 210000).
        const subsidy = 50 * 100000000 / Math.pow(2, Math.floor(header.height / 210000));
        // Fees: Not directly in header? 
        // Electrs header has `merkle_root`, `nonce`, `bits`, `difficulty`, `version`, `timestamp`, `tx_count`, `size`, `weight`.
        // It DOES NOT have fee total usually. 
        // However, the first TX is coinbase. We can look at its output value.
        
        let reward = 0;
        if (txs.length > 0 && txs[0].vin[0].is_coinbase) {
             reward = txs[0].vout.reduce((acc: number, out: any) => acc + out.value, 0) / 100000000;
        }

        // 5. Map to Frontend Format
        const blockData = {
            hash: header.id,
            height: header.height,
            time: header.timestamp,
            size: header.size,
            weight: header.weight,
            miner: "Unknown", // Needs coinbase text decode, tricky but maybe doable
            txCount: header.tx_count,
            reward: reward || (subsidy / 100000000), // Fallback
            transactions: txs.map((tx: any) => ({
                txid: tx.txid,
                fee: tx.fee, // Electrs gives fee in sats
                weight: tx.weight,
                isSegwit: tx.status.block_height >= 481824 // Simple heuristic or check witness
            }))
        };
        
        // Attempt to decode miner from coinbase hex
        if (txs.length > 0) {
             const coinbaseInit = txs[0].vin[0].scriptsig; // Hex
             // Convert hex to ascii (simplified)
             // Real miner logic is complex, but let's try basic ascii extraction
             // ...
        }

        return NextResponse.json(blockData);

    } catch (error: any) {
        console.error("Block API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
