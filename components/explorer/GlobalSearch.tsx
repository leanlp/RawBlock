"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;

        // Routing Logic
        if (/^\d+$/.test(trimmed)) {
            // Block Height
            router.push(`/explorer/block/${trimmed}`);
        } else if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
            // If it starts with several zeros, assume Block Hash, otherwise TXID
            // Mainnet blocks typically have at least 8 leading zeros.
            if (trimmed.startsWith("00000000") || trimmed.startsWith("0000000")) {
                router.push(`/explorer/block/${trimmed}`);
            } else {
                router.push(`/explorer/decoder?query=${trimmed}`);
            }
        } else if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]+$/.test(trimmed)) {
            // Address
            router.push(`/explorer/address/${trimmed}`);
        } else {
            // Fallback (assume tx if unknown format, or let the specific pages handle errors)
            router.push(`/explorer/decoder?query=${trimmed}`);
        }

        setQuery("");
    };

    const { t } = useTranslation();

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
