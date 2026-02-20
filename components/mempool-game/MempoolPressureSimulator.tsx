"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface MempoolWeatherResponse {
    current?: {
        condition?: string;
        candidateBlocks?: number;
        txCount?: number;
        policy?: {
            mempoolMinSatVB?: number;
            minRelaySatVB?: number;
        };
        distribution?: {
            p50?: number;
            p75?: number;
            p90?: number;
            p95?: number;
        };
    };
}

interface TxActionPlanResponse {
    current?: {
        satVB?: number;
        vsize?: number;
    };
    recommendation?: {
        primaryAction?: string;
        reason?: string;
        notes?: string[];
    };
    rbf?: {
        available?: boolean;
        targetOptions?: Array<{
            targetBlocks?: number;
            targetSatVB?: number;
            additionalFeeSats?: number;
        }>;
    };
    cpfp?: {
        available?: boolean;
        childVSize?: number;
        childVSizePlan?: number[];
        targetOptions?: Array<{
            targetBlocks?: number;
            targetSatVB?: number;
            requiredChildFeeSats?: number;
        }>;
    };
}

type OutcomeTone = "green" | "amber" | "red";

function readNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function describeInclusion(rate: number, threshold: number): { label: string; tone: OutcomeTone } {
    if (rate >= threshold * 1.2) {
        return { label: "Likely next block", tone: "green" };
    }
    if (rate >= threshold) {
        return { label: "Should survive pressure", tone: "green" };
    }
    if (rate >= threshold * 0.85) {
        return { label: "Borderline / at risk", tone: "amber" };
    }
    return { label: "Likely evicted", tone: "red" };
}

function toneClass(tone: OutcomeTone): string {
    if (tone === "green") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    if (tone === "amber") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    return "border-red-500/40 bg-red-500/10 text-red-200";
}

export default function MempoolPressureSimulator() {
    const [weather, setWeather] = useState<MempoolWeatherResponse | null>(null);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [pressure, setPressure] = useState(35);

    const [parentSatVB, setParentSatVB] = useState(3.5);
    const [parentVSize, setParentVSize] = useState(180);
    const [rbfBumpSatVB, setRbfBumpSatVB] = useState(2);
    const [cpfpChildVSize, setCpfpChildVSize] = useState(140);
    const [cpfpChildSatVB, setCpfpChildSatVB] = useState(8);

    const [txidInput, setTxidInput] = useState("");
    const [planLoading, setPlanLoading] = useState(false);
    const [planError, setPlanError] = useState<string | null>(null);
    const [plan, setPlan] = useState<TxActionPlanResponse | null>(null);

    useEffect(() => {
        if (!API_URL) {
            setWeatherError("NEXT_PUBLIC_API_URL is not configured.");
            return;
        }

        let cancelled = false;
        const fetchWeather = async () => {
            try {
                const res = await fetch(`${API_URL}/api/mempool/weather`, { cache: "no-store" });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const payload = (await res.json()) as MempoolWeatherResponse;
                if (cancelled) return;
                setWeather(payload);
                setWeatherError(null);
            } catch (err: unknown) {
                if (cancelled) return;
                setWeatherError(err instanceof Error ? err.message : "Unable to fetch mempool weather.");
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 60_000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    const baseFloor = Math.max(
        readNumber(weather?.current?.policy?.mempoolMinSatVB, 1),
        readNumber(weather?.current?.policy?.minRelaySatVB, 1),
    );
    const p50 = readNumber(weather?.current?.distribution?.p50, 2);
    const p90 = readNumber(weather?.current?.distribution?.p90, Math.max(p50 + 1.5, 4));
    const p95 = readNumber(weather?.current?.distribution?.p95, Math.max(p90 + 1, 6));

    const evictionThreshold = useMemo(() => {
        const pressureFactor = pressure / 100;
        const dynamicBand = Math.max(1, p95 - baseFloor);
        return Number((baseFloor + pressureFactor * dynamicBand).toFixed(2));
    }, [baseFloor, p95, pressure]);

    const parentFeeSats = parentSatVB * parentVSize;
    const rbfSatVB = parentSatVB + rbfBumpSatVB;
    const cpfpChildFeeSats = cpfpChildSatVB * cpfpChildVSize;
    const cpfpPackageSatVB = (parentFeeSats + cpfpChildFeeSats) / (parentVSize + cpfpChildVSize);

    const baseOutcome = describeInclusion(parentSatVB, evictionThreshold);
    const rbfOutcome = describeInclusion(rbfSatVB, evictionThreshold);
    const cpfpOutcome = describeInclusion(cpfpPackageSatVB, evictionThreshold);

    const loadTxActionPlan = async () => {
        setPlanError(null);
        setPlan(null);
        if (!API_URL) {
            setPlanError("NEXT_PUBLIC_API_URL is not configured.");
            return;
        }
        const txid = txidInput.trim();
        if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
            setPlanError("Enter a valid 64-character txid.");
            return;
        }

        setPlanLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/tx/${txid}/action-plan`, { cache: "no-store" });
            if (!res.ok) {
                throw new Error(`Action plan unavailable (HTTP ${res.status})`);
            }
            const payload = (await res.json()) as TxActionPlanResponse;
            setPlan(payload);

            const liveSatVB = Number(payload.current?.satVB);
            const liveVSize = Number(payload.current?.vsize);
            if (Number.isFinite(liveSatVB) && liveSatVB > 0) {
                setParentSatVB(Number(liveSatVB.toFixed(2)));
            }
            if (Number.isFinite(liveVSize) && liveVSize > 0) {
                setParentVSize(Math.round(liveVSize));
            }

            const rbfOption = payload.rbf?.targetOptions?.[0];
            if (rbfOption && Number.isFinite(Number(rbfOption.targetSatVB)) && Number.isFinite(liveSatVB)) {
                setRbfBumpSatVB(Math.max(0.1, Number(rbfOption.targetSatVB) - liveSatVB));
            }

            const suggestedChildVSize = Number(payload.cpfp?.childVSize ?? payload.cpfp?.childVSizePlan?.[0]);
            if (Number.isFinite(suggestedChildVSize) && suggestedChildVSize > 0) {
                setCpfpChildVSize(Math.round(suggestedChildVSize));
            }

            const cpfpOption = payload.cpfp?.targetOptions?.[0];
            if (cpfpOption && Number.isFinite(Number(cpfpOption.requiredChildFeeSats))) {
                const childVSize = Number.isFinite(suggestedChildVSize) && suggestedChildVSize > 0
                    ? suggestedChildVSize
                    : cpfpChildVSize;
                const childSatVB = Number(cpfpOption.requiredChildFeeSats) / childVSize;
                if (Number.isFinite(childSatVB) && childSatVB > 0) {
                    setCpfpChildSatVB(Number(childSatVB.toFixed(2)));
                }
            }
        } catch (err: unknown) {
            setPlanError(err instanceof Error ? err.message : "Failed to fetch tx action plan.");
        } finally {
            setPlanLoading(false);
        }
    };

    return (
        <section className="mb-8 space-y-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-cyan-300">Mempool Eviction + CPFP/RBF Simulator</h2>
                    <p className="text-xs text-slate-400">
                        Raise pressure, observe floor movement, then rescue a stuck transaction with replacement or package fee bumping.
                    </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                    <div>Current condition: <span className="font-semibold text-cyan-200">{weather?.current?.condition ?? "unknown"}</span></div>
                    <div>Candidate blocks: <span className="font-semibold">{readNumber(weather?.current?.candidateBlocks, 0).toFixed(2)}</span></div>
                </div>
            </div>

            {weatherError ? (
                <div className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                    Market feed warning: {weatherError}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                    <div>
                        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-slate-500">Mempool Pressure</label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={pressure}
                            onChange={(event) => setPressure(Number(event.target.value))}
                            className="w-full"
                        />
                        <div className="mt-1 text-xs text-slate-400">
                            Pressure {pressure}% · Eviction floor <span className="font-semibold text-amber-300">{evictionThreshold.toFixed(2)} sat/vB</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="text-xs text-slate-400">
                            Parent fee rate (sat/vB)
                            <input
                                type="number"
                                min={0.1}
                                step={0.1}
                                value={parentSatVB}
                                onChange={(event) => setParentSatVB(Number(event.target.value))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            Parent vsize (vB)
                            <input
                                type="number"
                                min={60}
                                step={1}
                                value={parentVSize}
                                onChange={(event) => setParentVSize(Number(event.target.value))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            RBF bump (sat/vB)
                            <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={rbfBumpSatVB}
                                onChange={(event) => setRbfBumpSatVB(Number(event.target.value))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            CPFP child vsize (vB)
                            <input
                                type="number"
                                min={60}
                                step={1}
                                value={cpfpChildVSize}
                                onChange={(event) => setCpfpChildVSize(Number(event.target.value))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
                            />
                        </label>
                        <label className="text-xs text-slate-400 sm:col-span-2">
                            CPFP child fee rate (sat/vB)
                            <input
                                type="number"
                                min={0.1}
                                step={0.1}
                                value={cpfpChildSatVB}
                                onChange={(event) => setCpfpChildSatVB(Number(event.target.value))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-100"
                            />
                        </label>
                    </div>
                </div>

                <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                    <div className="text-xs uppercase tracking-[0.15em] text-slate-500">Live Backend Primitive (optional)</div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            value={txidInput}
                            onChange={(event) => setTxidInput(event.target.value)}
                            placeholder="Load txid action plan..."
                            className="w-full rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                        />
                        <button
                            type="button"
                            onClick={loadTxActionPlan}
                            disabled={planLoading}
                            className="rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
                        >
                            {planLoading ? "Loading..." : "Load Plan"}
                        </button>
                    </div>
                    {planError ? (
                        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{planError}</div>
                    ) : null}
                    {plan ? (
                        <div className="rounded border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300">
                            <div className="font-semibold text-cyan-200">
                                Recommendation: {plan.recommendation?.primaryAction ?? "unknown"}
                            </div>
                            <div className="mt-1">{plan.recommendation?.reason ?? "No recommendation reason provided."}</div>
                            {plan.recommendation?.notes?.length ? (
                                <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-400">
                                    {plan.recommendation.notes.slice(0, 3).map((note) => (
                                        <li key={note}>{note}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className={`rounded-lg border px-4 py-3 ${toneClass(baseOutcome.tone)}`}>
                    <div className="text-xs uppercase tracking-[0.15em]">Base Transaction</div>
                    <div className="mt-1 text-lg font-bold">{parentSatVB.toFixed(2)} sat/vB</div>
                    <div className="text-xs">{baseOutcome.label}</div>
                </div>
                <div className={`rounded-lg border px-4 py-3 ${toneClass(rbfOutcome.tone)}`}>
                    <div className="text-xs uppercase tracking-[0.15em]">After RBF</div>
                    <div className="mt-1 text-lg font-bold">{rbfSatVB.toFixed(2)} sat/vB</div>
                    <div className="text-xs">{rbfOutcome.label}</div>
                </div>
                <div className={`rounded-lg border px-4 py-3 ${toneClass(cpfpOutcome.tone)}`}>
                    <div className="text-xs uppercase tracking-[0.15em]">After CPFP Package</div>
                    <div className="mt-1 text-lg font-bold">{cpfpPackageSatVB.toFixed(2)} sat/vB</div>
                    <div className="text-xs">{cpfpOutcome.label}</div>
                </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                        Floor model: <span className="text-cyan-200">{baseFloor.toFixed(2)} → {evictionThreshold.toFixed(2)} sat/vB</span>
                    </div>
                    <div>
                        Parent fee: <span className="text-cyan-200">{Math.round(parentFeeSats).toLocaleString()} sats</span>
                    </div>
                    <div>
                        CPFP child fee: <span className="text-cyan-200">{Math.round(cpfpChildFeeSats).toLocaleString()} sats</span>
                    </div>
                </div>
                <div className="mt-2 text-slate-400">
                    Live percentiles: p50 {p50.toFixed(2)} · p90 {p90.toFixed(2)} · p95 {p95.toFixed(2)} sat/vB
                </div>
            </div>
        </section>
    );
}
