import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Mempool', path: '/explorer/mempool' },
    { name: 'Fees', path: '/explorer/fees' },
    { name: 'Blocks', path: '/explorer/blocks' },
    { name: 'Forensics', path: '/analysis/forensics', highlight: true },
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;

        // 1. Check if Block Height (Number)
        if (/^\d+$/.test(q)) {
            router.push(`/explorer/block/${q}`);
        }
        // 2. Check if Block Hash (likely starts with 00000)
        else if (q.startsWith('00000') && q.length === 64) {
            router.push(`/explorer/block/${q}`);
        }
        // 3. Default to Decoder (Tx, Address, or Raw Hex)
        else {
            router.push(`/explorer/decoder?query=${encodeURIComponent(q)}`);
        }
    };

    return (
        <header className="py-6 border-b border-slate-800/50 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 relative">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden absolute left-0 top-6 p-2 bg-slate-900/80 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors z-50"
                aria-label="Toggle menu"
            >
                {menuOpen ? (
                    <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

            {/* Mobile Drawer */}
            {menuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
                    <nav className="flex flex-col items-center justify-center h-full gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setMenuOpen(false)}
                                className={`
                                    px-6 py-3 rounded-full text-lg font-semibold transition-all
                                    ${pathname === item.path
                                        ? 'bg-slate-800 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }
                                    ${item.highlight && pathname !== item.path ? 'text-cyan-400 hover:text-cyan-300' : ''}
                                `}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}

            <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 group-hover:border-slate-700 transition-colors shadow-xl shadow-black/20">
                    <span className="text-xl">⚡</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-200 tracking-tight group-hover:text-white transition-colors">
                        Raw <span className="text-cyan-400">Block</span>
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Local Node</span>
                    </div>
                </div>
            </Link>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-slate-800">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`
                            px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                            ${pathname === item.path
                                ? 'bg-slate-800 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }
                            ${item.highlight && pathname !== item.path ? 'text-cyan-400 hover:text-cyan-300' : ''}
                        `}
                    >
                        {item.name}
                    </Link>
                ))}
            </nav>

            {/* Omni-Search */}
            <form onSubmit={handleSearch} className="relative w-full md:w-64 group">
                <input
                    type="text"
                    placeholder="Search TXID, Address, or Block..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </form>
        </header>
    );
}
