import { NextResponse } from 'next/server';

const ELECTRS_URL = process.env.ELECTRS_API_URL || 'http://127.0.0.1:3002'; // Default to local Electrs

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query } = body;

        if (!query) {
            return NextResponse.json({ error: "TXID required" }, { status: 400 });
        }

        const txid = query.trim();

        // Validate TXID format
        if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
             return NextResponse.json({ error: "Invalid TXID format" }, { status: 400 });
        }

        console.log(`[Decoder] Fetching TX from Electrs: ${txid}`);

        // Query Electrs: GET /tx/:txid
        // This returns the full transaction object, including inputs with prevout (address/value)!
        const res = await fetch(`${ELECTRS_URL}/tx/${txid}`);

        if (!res.ok) {
            if (res.status === 404) {
                 return NextResponse.json({ error: "Transaction not found in Indexer." }, { status: 404 });
            }
            throw new Error(`Electrs Error: ${res.status} ${res.statusText}`);
        }

        const txData = await res.json();

        // Optional: Fetch Block Status / Confirmation depth if not present
        // Esplora API usually includes 'status' object in the /tx response.
        // If it sends 'status.block_height', we can calculate confirmations roughly.
        
        return NextResponse.json({
            ...txData,
            type: 'transaction' // Tag for frontend 
        });

    } catch (error: any) {
        console.error("Decoder API Error:", error.message);
        return NextResponse.json({ 
            error: error.message || "Failed to decode transaction." 
        }, { status: 500 });
    }
}
