"use client";

import MempoolPressureSimulator from "../../../components/mempool-game/MempoolPressureSimulator";
import Header from "../../../components/Header";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

export default function MempoolSimulatorPage() {
    return (
        <>
            <div className="md:hidden">
                <Header />
            </div>
            <PageHeader
                title="Mempool Eviction + CPFP/RBF Simulator"
                subtitle="Raise mempool pressure, observe fee floor movement, then rescue a stuck transaction with replacement or package fee bumping."
            />

            <MempoolPressureSimulator />

            <div className="mt-6 text-center">
                <Link
                    href="/explorer/mempool"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors min-h-11"
                >
                    ← View Live Mempool Feed
                </Link>
            </div>
        </>
    );
}
