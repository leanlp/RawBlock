"use client";

import Header from "../../../components/Header";
import RPCExplorer from "../../../components/rpc-explorer/RPCExplorer";
import { useTranslation } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function RPCExplorerPage() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="md:hidden">
                <Header />
            </div>
            <div className="pb-6 border-b border-slate-800">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                    {t.rpc.title}
                </h1>
                <p className="mt-2 text-slate-400 text-sm">
                    {t.rpc.subtitle}
                </p>
            </div>
            <RPCExplorer />
        </div>
    );
}
