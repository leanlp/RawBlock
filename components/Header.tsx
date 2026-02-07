import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Mempool', path: '/explorer/mempool' },
    { name: 'Fees', path: '/explorer/fees' },
    { name: 'Blocks', path: '/explorer/blocks' },
    { name: 'Forensics', path: '/analysis/forensics', highlight: true },
];

const RECENT_SEARCHES_KEY = "rawblock-recent-searches";
const MAX_RECENT_SEARCHES = 5;

// Quick suggestions based on input patterns
function getQuickSuggestions(query: string): { label: string; type: string; href: string }[] {
    const q = query.trim();
    if (!q) return [];

    const suggestions: { label: string; type: string; href: string }[] = [];

    // Block height suggestion
    if (/^\d+$/.test(q)) {
        suggestions.push({
            label: `Block #${q}`,
            type: "Block Height",
            href: `/explorer/block/${q}`,
        });
    }

    // Block hash (starts with 00000)
    if (q.startsWith('00000') && q.length >= 10) {
        suggestions.push({
            label: `${q.slice(0, 16)}...`,
            type: "Block Hash",
            href: `/explorer/block/${q}`,
        });
    }

    // Transaction ID pattern (64 hex chars)
    if (/^[a-fA-F0-9]{10,64}$/.test(q) && !q.startsWith('00000')) {
        suggestions.push({
            label: `${q.slice(0, 16)}...`,
            type: "Transaction",
            href: `/explorer/decoder?query=${encodeURIComponent(q)}`,
        });
    }

    // Bitcoin address patterns
    if (/^(1|3|bc1|tb1)[a-zA-Z0-9]{20,}$/.test(q)) {
        suggestions.push({
            label: `${q.slice(0, 16)}...`,
            type: "Address",
            href: `/explorer/decoder?query=${encodeURIComponent(q)}`,
        });
    }

    return suggestions;
}

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch { }
        }
    }, []);

    // Save search to recent
    const saveRecentSearch = useCallback((query: string) => {
        const q = query.trim();
        if (!q) return;

        setRecentSearches((prev) => {
            const filtered = prev.filter((s) => s !== q);
            const updated = [q, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Get all suggestions (quick + recent)
    const quickSuggestions = getQuickSuggestions(searchQuery);
    const filteredRecent = recentSearches
        .filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3);
    const allSuggestions = [
        ...quickSuggestions.map((s) => ({ ...s, isRecent: false })),
        ...filteredRecent.map((s) => ({
            label: s,
            type: "Recent",
            href: `/explorer/decoder?query=${encodeURIComponent(s)}`,
            isRecent: true,
        })),
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;

        saveRecentSearch(q);
        setShowDropdown(false);

        // Route based on input type
        if (/^\d+$/.test(q)) {
            router.push(`/explorer/block/${q}`);
        } else if (q.startsWith('00000') && q.length === 64) {
            router.push(`/explorer/block/${q}`);
        } else {
            router.push(`/explorer/decoder?query=${encodeURIComponent(q)}`);
        }
    };

    const handleSelectSuggestion = (href: string, label: string) => {
        saveRecentSearch(label);
        setShowDropdown(false);
        setSearchQuery("");
        router.push(href);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || allSuggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) =>
                prev < allSuggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) =>
                prev > 0 ? prev - 1 : allSuggestions.length - 1
            );
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            const selected = allSuggestions[selectedIndex];
            handleSelectSuggestion(selected.href, selected.label);
        } else if (e.key === "Escape") {
            setShowDropdown(false);
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

            {/* Enhanced Omni-Search with Autocomplete */}
            <div className="relative w-full md:w-72">
                <form onSubmit={handleSearch} className="relative group">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search TXID, Address, or Block..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowDropdown(true);
                            setSelectedIndex(-1);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </form>

                {/* Autocomplete Dropdown */}
                {showDropdown && (
                    <div
                        ref={dropdownRef}
                        className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                    >
                        {/* Search Type Chips - Show when no query */}
                        {searchQuery.trim() === "" && (
                            <div className="px-4 py-3 border-b border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Search for</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSearchQuery("800000")}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-full text-xs text-slate-300 transition-all flex items-center gap-1.5"
                                    >
                                        <span>📦</span> Block Height
                                    </button>
                                    <button
                                        onClick={() => setSearchQuery("bc1q")}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-full text-xs text-slate-300 transition-all flex items-center gap-1.5"
                                    >
                                        <span>🏠</span> Address
                                    </button>
                                    <button
                                        onClick={() => setSearchQuery("00000000")}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-full text-xs text-slate-300 transition-all flex items-center gap-1.5"
                                    >
                                        <span>📄</span> TxID / Hash
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Suggestions */}
                        {allSuggestions.length > 0 && allSuggestions.map((suggestion, index) => (
                            <button
                                key={`${suggestion.type}-${suggestion.label}`}
                                onClick={() => handleSelectSuggestion(suggestion.href, suggestion.label)}
                                className={`
                                    w-full px-4 py-3 flex items-center justify-between text-left transition-colors
                                    ${index === selectedIndex ? 'bg-slate-800' : 'hover:bg-slate-800/50'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-500">
                                        {suggestion.isRecent ? '🕐' : suggestion.type === 'Block Height' ? '📦' : suggestion.type === 'Transaction' ? '📄' : '🏠'}
                                    </span>
                                    <span className="text-sm text-slate-200 font-mono truncate max-w-[180px]">
                                        {suggestion.label}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                    {suggestion.type}
                                </span>
                            </button>
                        ))}

                        {/* Keyboard hints */}
                        {allSuggestions.length > 0 && (
                            <div className="px-4 py-2 border-t border-slate-800 text-[10px] text-slate-600 flex items-center gap-2">
                                <span className="text-slate-500">↑↓</span> Navigate
                                <span className="mx-1">•</span>
                                <span className="text-slate-500">↵</span> Select
                                <span className="mx-1">•</span>
                                <span className="text-slate-500">esc</span> Close
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

