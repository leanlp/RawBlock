import { identifyOpcode, OpcodeDef } from "../utils/opcodes";

interface InteractiveScriptProps {
    asm: string;
}

export default function InteractiveScript({ asm }: InteractiveScriptProps) {
    if (!asm) return <span className="text-slate-500 italic">Empty Script</span>;

    const tokens = asm.split(' ');

    const getChipColor = (def: OpcodeDef | null, token: string) => {
        if (!def) return 'bg-slate-800 text-slate-400 border-slate-700'; // Data Push
        switch (def.category) {
            case 'crypto': return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'stack': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
            case 'flow': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'logic': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'push': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    return (
        <div className="flex flex-wrap gap-2 font-mono text-xs">
            {tokens.map((token, i) => {
                const def = identifyOpcode(token);
                const colorClass = getChipColor(def, token);
                const isData = !def; // Hex data

                return (
                    <div
                        key={i}
                        className={`
                            relative group cursor-help border rounded px-2 py-1 transition-all duration-300 hover:scale-105 hover:z-10
                            ${colorClass}
                        `}
                    >
                        {/* Token Text */}
                        <span className="break-all">{token.length > 20 ? token.substring(0, 8) + '...' + token.substring(token.length - 8) : token}</span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-900 border border-slate-700 p-3 rounded shadow-2xl z-50">
                            <div className="font-bold text-white mb-1 border-b border-slate-800 pb-1">
                                {def ? def.word : 'DATA PUSH'}
                            </div>
                            <div className="text-slate-400 leading-tight">
                                {def ? def.desc : `Pushes ${token.length / 2} bytes onto the stack.`}
                            </div>
                            {def && def.stack && (
                                <div className="mt-2 text-[10px] text-slate-500 bg-slate-950 p-1 rounded font-mono">
                                    Stack: {def.stack}
                                </div>
                            )}
                            {isData && (
                                <div className="mt-2 text-[10px] text-slate-500 bg-slate-950 p-1 rounded font-mono break-all">
                                    Full: {token}
                                </div>
                            )}
                        </div>

                        {/* Connecting Line (Visual Flair) */}
                        {i < tokens.length - 1 && (
                            <div className="absolute top-1/2 -right-2 w-2 h-[1px] bg-slate-800"></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
