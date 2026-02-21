"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

interface TooltipStep {
    target: string; // CSS selector for the target element
    title: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTooltipProps {
    tourId: string; // Unique ID for localStorage persistence
    steps: TooltipStep[];
    onComplete?: () => void;
}

const STORAGE_PREFIX = "rawblock-tour-";

/**
 * Onboarding tooltip component with step-by-step tour functionality.
 * Persists dismissed state in localStorage.
 */
export default function OnboardingTooltip({ tourId, steps, onComplete }: OnboardingTooltipProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const storageKey = STORAGE_PREFIX + tourId;

    // Check if tour was already completed
    useEffect(() => {
        const completed = localStorage.getItem(storageKey);
        if (!completed) {
            // Delay to let page render
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [storageKey]);

    // Find and track target element position
    useEffect(() => {
        if (!isVisible || currentStep >= steps.length) return;

        const updatePosition = () => {
            const target = document.querySelector(steps[currentStep].target);
            if (target) {
                setTargetRect(target.getBoundingClientRect());
            }
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition);
        };
    }, [isVisible, currentStep, steps]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            handleComplete();
        }
    }, [currentStep, steps.length]);

    const handleComplete = useCallback(() => {
        localStorage.setItem(storageKey, "true");
        setIsVisible(false);
        onComplete?.();
    }, [storageKey, onComplete]);

    const handleSkip = useCallback(() => {
        localStorage.setItem(storageKey, "true");
        setIsVisible(false);
    }, [storageKey]);

    if (!isVisible || currentStep >= steps.length || !targetRect) {
        return null;
    }

    const step = steps[currentStep];
    const position = step.position || "bottom";
    const { t } = useTranslation();

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        const offset = 12;
        switch (position) {
            case "top":
                return {
                    left: targetRect.left + targetRect.width / 2,
                    top: targetRect.top - offset,
                    transform: "translate(-50%, -100%)",
                };
            case "bottom":
                return {
                    left: targetRect.left + targetRect.width / 2,
                    top: targetRect.bottom + offset,
                    transform: "translateX(-50%)",
                };
            case "left":
                return {
                    left: targetRect.left - offset,
                    top: targetRect.top + targetRect.height / 2,
                    transform: "translate(-100%, -50%)",
                };
            case "right":
                return {
                    left: targetRect.right + offset,
                    top: targetRect.top + targetRect.height / 2,
                    transform: "translateY(-50%)",
                };
        }
    };

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className="fixed inset-0 bg-slate-950/60 z-[9998] backdrop-blur-sm"
                onClick={handleSkip}
            />

            {/* Highlight ring around target */}
            <div
                className="fixed z-[9999] pointer-events-none rounded-lg ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-950"
                style={{
                    left: targetRect.left - 4,
                    top: targetRect.top - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                }}
            />

            {/* Tooltip */}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed z-[10000] w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-cyan-500/10 p-4"
                    style={getTooltipStyle()}
                >
                    {/* Step indicator */}
                    <div className="text-[10px] text-cyan-500 uppercase tracking-widest mb-2">
                        {t.common.stepOf.replace("{0}", String(currentStep + 1)).replace("{1}", String(steps.length))}
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-bold mb-2">{step.title}</h3>

                    {/* Content */}
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        {step.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleSkip}
                            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                        >
                            {t.common.skipTour}
                        </button>

                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={() => setCurrentStep((prev) => prev - 1)}
                                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                                >
                                    {t.common.back}
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="btn-accent-sm"
                            >
                                {currentStep === steps.length - 1 ? t.common.finish : t.common.next}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </>
    );
}

/**
 * Button to restart a tour
 */
export function RestartTourButton({ tourId, label }: { tourId: string; label?: string }) {
    const { t } = useTranslation();
    const handleRestart = () => {
        localStorage.removeItem(STORAGE_PREFIX + tourId);
        window.location.reload();
    };

    return (
        <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-11 text-xs text-slate-400 hover:text-cyan-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all"
        >
            <span>❓</span>
            <span>{label ?? t.common.howToUse}</span>
        </button>
    );
}
