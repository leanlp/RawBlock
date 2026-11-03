"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { getSearchDestination } from "./searchRouting";

type GlobalSearchProps = {
    variant?: "sidebar" | "hero";
};

export default function GlobalSearch({ variant = "sidebar" }: GlobalSearchProps) {
    const [query, setQuery] = useState("");
    const router = useRouter();
    const { t } = useTranslation();
    const isHero = variant === "hero";

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const destination = getSearchDestination(query);
        if (!destination) return;

        router.push(destination);
        setQuery("");
    };

    if (isHero) {
        return (
            <form onSubmit={handleSearch} className="relative group glow-border rounded-xl">
                <div className="flex w-full items-stretch rounded-xl h-16 glass-panel relative z-10 overflow-hidden">
                    <div className="flex items-center justify-center pl-6 text-slate-400 group-focus-within:text-primary transition-colors">
                        <span className="text-2xl">🔍</span>
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t.dashboard.heroSearchPlaceholder}
                        className="form-input flex w-full min-w-0 flex-1 bg-transparent border-none text-white focus:ring-0 h-full placeholder:text-slate-500 px-4 text-lg"
                    />
                    <div className="flex items-center justify-center pr-2 py-2">
                        <button
                            type="submit"
                            className="flex items-center justify-center rounded-lg h-full px-6 bg-primary text-background-dark text-base font-bold hover:bg-primary/90 transition-colors"
                        >
                            {t.dashboard.heroSearchAction}
                        </button>
                    </div>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSearch} className="relative w-full">
            <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.common.searchPlaceholder}
                    className="w-full h-10 bg-slate-900/50 border border-slate-800 text-slate-200 text-sm rounded-lg pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-slate-500"
                />
            </div>
        </form>
    );
}
