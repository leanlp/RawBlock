"use client";

import { useCallback, useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import * as htmlToImage from "html-to-image";

interface ScreenshotExportProps {
    targetId: string;
    filename: string;
    className?: string;
    buttonText?: string;
}

export default function ScreenshotExport({ targetId, filename, className = "", buttonText = "Export" }: ScreenshotExportProps) {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const captureImage = useCallback(async () => {
        const targetNode = document.getElementById(targetId);
        if (!targetNode) {
            console.error(`DOM node with id ${targetId} not found.`);
            setStatus("error");
            return;
        }

        setStatus("loading");
        try {
            const dataUrl = await htmlToImage.toPng(targetNode, {
                quality: 1,
                pixelRatio: window.devicePixelRatio || 2,
                backgroundColor: "#020617", // Optional: slate-950 for theme consistency
            });
            const link = document.createElement("a");
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
            setStatus("success");
            setTimeout(() => setStatus("idle"), 2000);
        } catch (error) {
            console.error("Screenshot failed:", error);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    }, [targetId, filename]);

    return (
        <button
            onClick={captureImage}
            disabled={status === "loading" || status === "success"}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700 hover:text-cyan-300 disabled:opacity-50 disabled:pointer-events-none ${className}`}
            title="Export as PNG"
        >
            {status === "idle" && <Camera size={14} />}
            {status === "loading" && <Loader2 size={14} className="animate-spin text-cyan-500" />}
            {status === "success" && <Check size={14} className="text-emerald-500" />}
            {status === "error" && <span className="text-rose-500">Error</span>}
            {status !== "error" && buttonText}
        </button>
    );
}
