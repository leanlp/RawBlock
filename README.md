# Raw Block 🔷

**A Professional Bitcoin Explorer & Educational Playground**

Raw Block is a next-generation Bitcoin blockchain explorer and learning platform that connects directly to your local Bitcoin Core node. Built with Next.js and designed for developers, educators, and Bitcoin enthusiasts who want to understand Bitcoin's inner workings.

---

## ✨ Features

### 🌊 Explorer Suite

**Live Mempool Feed**
- Real-time unconfirmed transaction stream via WebSocket
- RBF (Replace-By-Fee) conflict detection with visual alerts
- Candidate block visualization with fee heatmap
- Transaction priority analysis

**🌍 Global Network Map**
- Interactive P2P peer visualization
- Geolocation mapping of connected nodes
- Deep network scan for known nodes
- Connection direction indicators (inbound/outbound)

**🔍 Transaction Decoder & Address Inspector**
- Decode any transaction by TXID or raw hex
- Full UTXO scanner for address balance verification
- Interactive script disassembly (scriptSig & scriptPubKey)
- Privacy analysis (change detection, address reuse alerts)
- Balance evolution charts

**💸 Fee Market Intelligence**
- Real-time fee estimation (fast, medium, slow)
- 24-hour fee trend visualization
- Historical fee rate analysis

**🐳 Whale Watch (Rich List)**
- Global Bitcoin rich list
- One-click address inspection
- Live balance verification

**⛏️ Miner Forensics**
- Coinbase signature extraction
- Mining pool identification
- Hashrate distribution charts

**🩺 Protocol Vital Signs**
- Halving countdown clock
- Network difficulty & hashrate
- Node health monitoring (uptime, bandwidth, version)

**💻 RPC Console**
- Direct RPC access to your Bitcoin Core node
- Safe command whitelist
- Real-time response viewer

---

### ⚗️ Learning Lab

**Script Debugger**
- Step-by-step Bitcoin Script execution
- Visual stack inspector
- Opcode library with examples
- Support for P2PKH, P2SH, TimeLocks, and more

**🌱 Taproot Playground**
- Schnorr signature visualization
- MuSig key aggregation demo
- Interactive multi-party signing

**🗝️ Key Forge**
- Cryptographic key derivation pipeline
- Private key → Public key → Address
- ECC visualization
- Multi-format address generation (Legacy, SegWit, Taproot)

**⚡ Lightning Network Simulator**
- Payment channel state machine
- Multi-hop routing with HTLC visualization
- Stratum V2 protocol comparison

**🔨 The Foundry (Hashing Lab)**
- Manual Proof-of-Work simulator
- Real-time SHA-256 hashing
- Difficulty target visualization
- Nonce mining demonstration

---

### 📊 Network Analysis

**📈 Chain Evolution**
- Protocol adoption metrics (Legacy vs SegWit vs Taproot)
- Block space efficiency analysis
- "Fat Finger" detector for fee overpayments

**⚖️ D-Index (Decentralization Index)**
- Multi-metric health scoring system
- Mining resilience, node diversity, economic breadth
- Radar chart visualization

**🎨 Graffiti Wall**
- Live OP_RETURN message feed
- Matrix-style terminal aesthetic
- Historical archive of blockchain messages

---

### 🎮 Arcade

**🧱 Mempool Tetris**
- Interactive block-building game
- Fee optimization challenge
- Weight limit management

**⚡ Mining Simulator**
- Hashrate shock simulation (e.g., China ban, ASIC boom)
- Difficulty adjustment visualization
- Epoch retargeting demonstration

---

## 🚀 Quick Start

### Prerequisites

- **Bitcoin Core** node running with `-txindex` (optional but recommended)
- **Node.js** 18+ and **npm**
- Backend middleware server (see `/middleware` directory)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Bitcoin Core RPC credentials and API URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Make sure your middleware server is configured with Bitcoin Core RPC access.

### Hero snapshot fallback

The homepage normally reads the Go gateway. If the gateway is slow or returns
incomplete data, it can read the last verified height, hashrate, fees, and mempool
count from a private Cloudflare R2 object. The cards keep the node's observation
times and label those readings **Cached Snapshot** for up to five minutes.

1. Use a private R2 Standard bucket per environment. Create an Object Read &
   Write credential restricted to the bucket for the node and a separate Object
   Read Only credential for Vercel.
2. On the node and in Vercel, set the following values using the credential for
   that runtime. The URL is the same for both within one environment.

   ```dotenv
   RAWBLOCK_HERO_SNAPSHOT_URL=https://<account-id>.r2.cloudflarestorage.com/<bucket>/hero/v1/latest.json
   RAWBLOCK_HERO_SNAPSHOT_ACCESS_KEY_ID=<access-key-id>
   RAWBLOCK_HERO_SNAPSHOT_SECRET_ACCESS_KEY=<secret-access-key>
   ```

3. Run the publisher on the node with Node.js 22. From this repository, run the
   commands below. For a standalone installation, copy `infra/hero-snapshot`,
   run `npm install --no-save aws4fetch@1.0.20` in the copied directory, and use
   `node publish.mjs` there. Set `RAWBLOCK_HERO_PUBLISHER_ORIGIN` if the Go API
   listens on a different loopback port. Its default is `http://127.0.0.1:8080`.

   ```bash
   node infra/hero-snapshot/publish.mjs --once
   node infra/hero-snapshot/publish.mjs
   ```

   Use the one-shot command to seed the object. Run the continuous command under
   the node's process supervisor. It refreshes on `block:new` and every 15 seconds
   between blocks. The publisher skips duplicate observations and keeps the last
   valid R2 object if the Go API returns stale, partial, or unverified data.

Run `npm run build` and `npm run qa:hero-snapshot` for local verification. In
preview, issue two consecutive GETs to `/api/bitcoin/metrics?view=hero` within
five seconds and inspect `x-vercel-cache`. Confirm a cache hit serves complete,
fresh readings. During a gateway outage, confirm the page renders the cached
values with their original timestamps. Backup, partial, and unavailable
responses are served with `Cache-Control: no-store`.

---

## 🏗️ Architecture

**Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion  
**Charts:** Recharts  
**Real-time:** Socket.io  
**Backend:** Node.js + Express (see `/middleware`)

---

## 🎯 Use Cases

- **Developers:** Debug transactions, test scripts, analyze network behavior
- **Educators:** Teach Bitcoin concepts with interactive visualizations
- **Researchers:** Analyze mempool dynamics, fee markets, and miner behavior
- **Node Operators:** Monitor your node's health and peer connections

---

## 🔒 Security

- RPC commands are whitelisted to prevent abuse
- No private keys are ever transmitted or stored
- All address scanning is performed locally via your node
- Educational key generation uses browser crypto APIs (not production-safe)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

## 📜 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Bitcoin Core developers
- The open-source Bitcoin community
- Mempool.space, Blockstream, and other explorer pioneers for inspiration

---

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the Bitcoin community**
