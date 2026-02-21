"use client";

import Header from "../../../components/Header";
import RPCExplorer from "../../../components/rpc-explorer/RPCExplorer";

export const dynamic = "force-dynamic";

export default function RPCExplorerPage() {
    return (
        <div className="space-y-6">
            <div className="md:hidden">
                <Header />
            </div>
            <div className="pb-6 border-b border-slate-800">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                    Bitcoin Node Terminal
                </h1>
                <p className="mt-2 text-slate-400 text-sm">
                    Interactive read-only JSON-RPC console. Click any command from the library or type your own to query the live Bitcoin Core node.
                </p>
            </div>
            <RPCExplorer />
        </div>
    );
}
