import { NextResponse } from 'next/server';

// Configuration
const RPC_USER = process.env.BITCOIN_RPC_USER;
const RPC_PASS = process.env.BITCOIN_RPC_PASSWORD;
const RPC_HOST = process.env.BITCOIN_RPC_HOST || 'localhost';
const RPC_PORT = process.env.BITCOIN_RPC_PORT || 8332;

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
            const tx = await rpcCall('getrawtransaction', [cleanQuery, true]);
            result = {
                type: 'transaction',
                ...tx
            };
        } else if (isAddress) {
            console.log(`[Proxy] Scanning UTXO set for address: ${cleanQuery}`);
             // IMPORTANT: scantxoutset is blocking. Next.js serverless functions have timeouts (usually 10s-60s).
             // If local node, it should be fast for single address.
             // 'start' action, [ { desc: addr(X) } ]
             const scan = await rpcCall('scantxoutset', ['start', [{ desc: `addr(${cleanQuery})` }]]);
             
             // Transform to match frontend expectations
             result = {
                 type: 'address',
                 address: cleanQuery,
                 balance: scan.total_amount,
                 utxoCount: scan.txouts,
                 scanHeight: scan.height,
                 utxos: scan.unspents.map((u: any) => ({
                    txid: u.txid,
                    vout: u.vout,
                    amount: u.amount,
                    height: u.height,
                    scriptPubKey: u.scriptPubKey
                 }))
             };
        } else {
             // Fallback: Try decoding raw hex? Or just error.
             console.log(`[Proxy] Validation failed for: '${cleanQuery}' (Length: ${cleanQuery.length})`);
             return NextResponse.json({ error: `Invalid format. Expected TxID or Address. Received: '${cleanQuery}'` }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("RPC Proxy Error:", error.message);
        return NextResponse.json({ 
            error: error.message || "Failed to process request via local RPC." 
        }, { status: 500 });
    }
}
