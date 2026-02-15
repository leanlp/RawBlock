"use client";

import Header from "../../../components/Header";
import RPCExplorer from "../../../components/rpc-explorer/RPCExplorer";

export const dynamic = "force-dynamic";

export default function RPCExplorerPage() {
    return (
        <div className="space-y-6">
            <Header />
            <div className="pb-6 border-b border-slate-800">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400">
                    Node Console 💻
                </h1>
                <p className="mt-2 text-slate-400 text-sm">
                    Read-only JSON-RPC access to the connected Bitcoin Core backend (self-hosted or Rawblock API).
                </p>
            </div>
            <RPCExplorer />
        </div>
    );
}
