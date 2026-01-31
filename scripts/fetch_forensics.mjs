
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.join(__dirname, '../.env.local');

// Load Env
if (fs.existsSync(ENV_FILE)) {
    const envConfig = fs.readFileSync(ENV_FILE, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const RPC_USER = process.env.BITCOIN_RPC_USER;
const RPC_PASS = process.env.BITCOIN_RPC_PASSWORD;
const RPC_HOST = process.env.BITCOIN_RPC_HOST || 'localhost';
const RPC_PORT = process.env.BITCOIN_RPC_PORT || 8332;

if (!RPC_USER || !RPC_PASS) {
    console.error("❌ Error: Missing RPC credentials. Check .env.local");
    process.exit(1);
}

// --- Case Studies Definition ---
const CASES = [
    { id: 'pizza', type: 'tx', value: 'cca7507897abc89628f450e8b1e0c6fca4ec3f7b34cccf55f3f531c659ff4d79', label: 'Pizza Transaction' },
    { id: 'genesis', type: 'address', value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', label: 'Satoshi Genesis' },
    { id: 'mtgox', type: 'address', value: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF', label: 'Mt Gox Hack' },
    { id: 'wikileaks', type: 'address', value: '1HB5XMLmzFVj8ALj6mfBsbifRoD4miY36v', label: 'Wikileaks Donation' }
];

// --- RPC Helper ---
async function rpcCall(method, params = []) {
    const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64');
    const response = await fetch(`http://${RPC_HOST}:${RPC_PORT}`, {
        method: 'POST',
        body: JSON.stringify({ jsonrpc: '1.0', id: 'fetch-script', method, params }),
        headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Basic ${auth}`
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const { result, error } = await response.json();
    if (error) throw new Error(typeof error === 'object' ? error.message : error);
    return result;
}

// --- Fetch Logic ---
async function fetchData() {
    console.log(`🚀 Starting Forensics Data Fetch...`);
    console.log(`🔌 Connected to Node: http://${RPC_HOST}:${RPC_PORT}`);

    // Ensure directory exists
    const dir = path.join(__dirname, '../public/data/forensics');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    for (const caseStudy of CASES) {
        console.log(`\nProcessing: ${caseStudy.label} (${caseStudy.id})`);
        try {
            let resultData = null;

            if (caseStudy.type === 'tx') {
                const tx = await rpcCall('getrawtransaction', [caseStudy.value, true]);
                let blockInfo = {};
                if (tx.blockhash) {
                    blockInfo = await rpcCall('getblock', [tx.blockhash, 1]);
                }

                resultData = {
                    type: 'transaction',
                    ...tx,
                    blocktime: blockInfo.time,
                    blockheight: blockInfo.height
                };
                console.log(`✅ Fetched Transaction: ${tx.txid.substring(0, 16)}...`);

            } else if (caseStudy.type === 'address') {
                // Check if file already exists to avoid re-scanning heavy addresses if not needed
                // For now, we always re-scan on manual trigger
                console.log(`⏳ Scanning UTXO set (this may take a moment)...`);
                const scan = await rpcCall('scantxoutset', ['start', [{ desc: `addr(${caseStudy.value})` }]]);

                // OPTIMIZATION: Sort by height (history) and limit count
                const MAX_UTXOS = 1000;
                const sortedUtxos = scan.unspents
                    .sort((a, b) => a.height - b.height)
                    .slice(0, MAX_UTXOS);

                resultData = {
                    type: 'address',
                    address: caseStudy.value,
                    balance: scan.total_amount,
                    utxoCount: scan.txouts, // Keep total count for reference
                    visibleUtxos: sortedUtxos.length,
                    scanHeight: scan.height,
                    utxos: sortedUtxos.map(u => ({
                        txid: u.txid,
                        vout: u.vout,
                        amount: u.amount,
                        height: u.height,
                        scriptPubKey: u.scriptPubKey
                    }))
                };
                console.log(`✅ Fetched Address: ${scan.total_amount} BTC accross ${scan.txouts} UTXOs`);
            }

            if (resultData) {
                const filePath = path.join(dir, `${caseStudy.id}.json`);
                fs.writeFileSync(filePath, JSON.stringify(resultData, null, 2));
                console.log(`💾 Saved: ${filePath}`);
            }

        } catch (err) {
            console.error(`❌ Failed to fetch ${caseStudy.id}:`, err.message);
        }
    }
}

fetchData();
