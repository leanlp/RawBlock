
"use client";

import Header from "../../components/Header";
import KeyAggregator from "../../components/taproot/KeyAggregator";

export default function TaprootPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="pb-6 border-b border-slate-800">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                        Taproot Playground 🌱
                    </h1>
                    <p className="mt-2 text-slate-400 text-sm">
                        Visualize <strong>Schnorr Signatures</strong> and <strong>Key Aggregation (MuSig)</strong>.
                    </p>
                </div>

                <KeyAggregator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <h3 className="font-bold text-white mb-2">Linearity</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Schnorr signatures are linear. <br />
                            <code className="text-emerald-400">Sig(A) + Sig(B) = Sig(A+B)</code>.<br />
                            This allows multiple parties to combine keys and signatures into one, saving space and privacy.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <h3 className="font-bold text-white mb-2">Efficiency</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Aggregated signatures look like a single signature on-chain. This makes multisig transactions cheaper and indistinguishable from regular ones.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <h3 className="font-bold text-white mb-2">Simplicity</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Unlike ECDSA, Schnorr signatures are provably secure and non-malleable by default, making them the gold standard for modern Bitcoin.
                        </p>
                    </div>
                </div>

            </div>
        </main>
    );
}
