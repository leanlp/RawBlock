import { NextResponse } from 'next/server';

// Configuration
const RPC_USER = process.env.BITCOIN_RPC_USER;
const RPC_PASS = process.env.BITCOIN_RPC_PASSWORD;
const RPC_HOST = process.env.BITCOIN_RPC_HOST || 'localhost';
const RPC_PORT = process.env.BITCOIN_RPC_PORT || 8332;
// Check for Electrs URL
const ELECTRS_URL = process.env.ELECTRS_API_URL; // e.g., http://192.168.1.41:3002

async function rpcCall(method: string, params: any[] = []) {
    if (!RPC_USER || !RPC_PASS) {
        throw new Error("Missing BITCOIN_RPC_USER or BITCOIN_RPC_PASSWORD in .env");
    }

    const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64');
    
    // Using native fetch (Node 18+)
    const response = await fetch(`http://${RPC_HOST}:${RPC_PORT}`, {
        method: 'POST',
        body: JSON.stringify({
            jsonrpc: '1.0',
            id: 'proxy-rpc',
            method,
            params
        }),
        headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Basic ${auth}`
        }
    });

    if (!response.ok) {
         try {
             // Try to read error body if possible
             const errText = await response.text();
             throw new Error(`RPC HTTP Error: ${response.status} ${response.statusText} - ${errText}`);
         } catch {
             throw new Error(`RPC HTTP Error: ${response.status} ${response.statusText}`);
         }
    }

    const json = await response.json();
    if (json.error) {
        throw new Error(typeof json.error === 'object' ? json.error.message : json.error);
    }
    return json.result;
}

// Helper to query Electrs
async function electrsCall(endpoint: string) {
    if (!ELECTRS_URL) throw new Error("ELECTRS_API_URL is not configured.");
    
    //console.log(`[Proxy] Querying Electrs: ${ELECTRS_URL}${endpoint}`);
    const res = await fetch(`${ELECTRS_URL}${endpoint}`);
    if (!res.ok) {
        throw new Error(`Electrs Error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query } = body;
        
        if (!query) {
            return NextResponse.json({ error: "Query required" }, { status: 400 });
        }

        const cleanQuery = query.trim();
        let result: any = {};

        // 1. Logic: Is this a Hash (TxID) or Address?
        const isTxID = /^[0-9a-fA-F]{64}$/.test(cleanQuery);
        // Basic regex for legacy/segwit/taproot addresses
        const isAddress = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(cleanQuery);

        if (isTxID) {
            console.log(`[Proxy] Fetching transaction: ${cleanQuery}`);
            
            // HYBRID: Try Electrs for simple metadata, but Core 'getrawtransaction' is robust for full details.
            // For now, let's keep using Core for TX details as it works well, unless user specifically wants Electrs speed.
            // Actually, switching to Electrs for TX allows us to see unconfirmed mempool parents easily without -txindex sometimes.
            // But let's stick to Core for TX to minimize friction, as Core works fine for single TX lookup usually.
            
            const tx = await rpcCall('getrawtransaction', [cleanQuery, true]);
            
            // Fetch Block Data (Time & Confirmations)
            let blockInfo: any = {};
            if (tx.blockhash) {
                try {
                   // console.log(`[Proxy] Fetching block info: ${tx.blockhash}`);
                    blockInfo = await rpcCall('getblock', [tx.blockhash, 1]);
                } catch (err) {
                    console.warn("Failed to fetch block details", err);
                }
            }

            result = {
                type: 'transaction',
                ...tx,
                blocktime: blockInfo.time ? blockInfo.time : undefined,
                blockheight: blockInfo.height ? blockInfo.height : undefined,
                confirmations: tx.confirmations || 0
            };

        } else if (isAddress) {
            console.log(`[Proxy] Searching Address (via Electrs): ${cleanQuery}`);
            
            if (!ELECTRS_URL) {
                 return NextResponse.json({ error: "Electrs Indexer is not configured. Cannot search addresses natively without scanning." }, { status: 501 });
            }

            // 1. Get Address Stats (Balance, Tx Count)
            // Electrs API: GET /address/:address
            const stats = await electrsCall(`/address/${cleanQuery}`);
            
            // 2. Get UTXOs
            // Electrs API: GET /address/:address/utxo
            const utxos = await electrsCall(`/address/${cleanQuery}/utxo`);

            // 3. Map to Frontend Format
            // Electrs UTXO format: { txid, vout, status: { confirmed, block_height, block_hash }, value }
            
            const totalBalanceSat = (stats.chain_stats.funded_txo_sum - stats.chain_stats.spent_txo_sum) + 
                                    (stats.mempool_stats.funded_txo_sum - stats.mempool_stats.spent_txo_sum);
            
            result = {
                 type: 'address',
                 address: cleanQuery,
                 balance: totalBalanceSat / 100000000, // Convert Sats to BTC
                 utxoCount: stats.chain_stats.tx_count + stats.mempool_stats.tx_count, // Total interactions
                 scanHeight: 0, // Not relevant for indexer
                 utxos: utxos.map((u: any) => ({
                    txid: u.txid,
                    vout: u.vout,
                    amount: u.value / 100000000, // Sats to BTC
                    height: u.status.block_height,
                    scriptPubKey: "" // Electrs doesn't return scriptPubKey in UTXO list usually, frontend might need it? 
                    // If frontend needs scriptPubKey, we might need to fetch it or mock it. 
                    // Looking at 'AddressNode', it mostly uses value/txid. 
                    // Let's leave empty for now, or fetch if critical.
                 }))
            };
            
        } else {
             console.log(`[Proxy] Validation failed for: '${cleanQuery}'`);
             return NextResponse.json({ error: `Invalid format. Expected TxID or Address.` }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("RPC Proxy Error:", error.message);
        return NextResponse.json({ 
            error: error.message || "Failed to process request." 
        }, { status: 500 });
    }
}
