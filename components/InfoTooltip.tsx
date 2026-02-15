"use client";

import { useId } from "react";
import { Tooltip } from "react-tooltip";

type InfoTooltipProps = {
  content: string;
  label?: string;
  className?: string;
};

export default function InfoTooltip({
  content,
  label = "More info",
  className = "",
}: InfoTooltipProps) {
  const rawId = useId();
  const tooltipId = `info-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={content}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${className}`}
      >
        <span className="text-sm leading-none">i</span>
      </button>
      <Tooltip
        id={tooltipId}
        style={{
          backgroundColor: "#020617",
          color: "#f1f5f9",
          border: "1px solid #334155",
          borderRadius: "12px",
          maxWidth: "320px",
          zIndex: 50,
        }}
      />
    </>
  );
}

