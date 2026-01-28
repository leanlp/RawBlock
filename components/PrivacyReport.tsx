import { PrivacyAnalysisResult } from "../utils/privacy";

interface PrivacyReportProps {
    report: PrivacyAnalysisResult;
}

export default function PrivacyReport({ report }: PrivacyReportProps) {
    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'text-emerald-400 border-emerald-500/50 from-emerald-500/20';
            case 'B': return 'text-cyan-400 border-cyan-500/50 from-cyan-500/20';
            case 'C': return 'text-yellow-400 border-yellow-500/50 from-yellow-500/20';
            case 'D': return 'text-orange-400 border-orange-500/50 from-orange-500/20';
            case 'F': return 'text-red-500 border-red-500/50 from-red-500/20';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-xl">🕵️‍♂️</span>
                        Privacy Sentinel Analysis
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">
                        Heuristic audit of transaction hygiene and linkability.
                    </p>
                </div>

                <div className={`
                    w-16 h-16 rounded-xl border-2 flex items-center justify-center bg-gradient-to-br to-transparent
                    ${getGradeColor(report.grade)}
                `}>
                    <span className="text-3xl font-black">{report.grade}</span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {report.leaks.length === 0 && report.warnings.length === 0 && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-300 text-sm flex gap-2">
                        <span>✅</span>
                        <span>No obvious privacy leaks detected. Standard hygiene observed.</span>
                    </div>
                )}

                {report.leaks.map((leak, i) => (
                    <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-300 text-xs flex gap-2 items-start">
                        <span className="mt-0.5">🚨</span>
                        <span><b>LEAK DETECTED:</b> {leak}</span>
                    </div>
                ))}

                {report.warnings.map((warn, i) => (
                    <div key={i} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-300 text-xs flex gap-2 items-start">
                        <span className="mt-0.5">⚠️</span>
                        <span>{warn}</span>
                    </div>
                ))}
            </div>

            {/* Change Output Identification */}
            {report.changeOutputIndex !== undefined && (
                <div className="mt-6 pt-4 border-t border-slate-800/50">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">Change Detection</div>
                    <div className="font-mono text-sm text-slate-300">
                        Based on round-payment heuristic, <span className="text-yellow-400 font-bold">Output #{report.changeOutputIndex}</span> is likely the change output.
                    </div>
                </div>
            )}

        </div>
    );
}
