"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rawblock-performance-mode";

/**
 * Hook for managing Performance Mode state.
 * When enabled, reduces animations, disables blur, and caps heavy elements.
 */
export function usePerformanceMode(): [boolean, () => void] {
    const [isPerformanceMode, setIsPerformanceMode] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "true") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsPerformanceMode(true);
            document.body.classList.add("perf-mode");
        }
    }, []);

    // Toggle function
    const togglePerformanceMode = useCallback(() => {
        setIsPerformanceMode((prev) => {
            const newValue = !prev;
            localStorage.setItem(STORAGE_KEY, String(newValue));

            if (newValue) {
                document.body.classList.add("perf-mode");
            } else {
                document.body.classList.remove("perf-mode");
            }

            return newValue;
        });
    }, []);

    return [isPerformanceMode, togglePerformanceMode];
}

/**
 * Toggle component for Performance Mode
 */
export function PerformanceModeToggle() {
    const [isPerformanceMode, togglePerformanceMode] = usePerformanceMode();

    return (
        <button
            onClick={togglePerformanceMode}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 border
                ${isPerformanceMode
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300"
                }
            `}
            title={isPerformanceMode ? "Performance Mode ON" : "Enable Performance Mode"}
        >
            <span className="text-sm">⚡</span>
            <span className="hidden sm:inline">
                {isPerformanceMode ? "Perf ON" : "Perf Mode"}
            </span>
        </button>
    );
}

export default usePerformanceMode;
