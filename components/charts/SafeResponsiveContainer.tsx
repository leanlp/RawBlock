"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

type SafeResponsiveContainerProps = {
  children: ReactNode;
  className?: string;
  minHeight?: number;
  width?: string | number;
  height?: string | number;
};

export default function SafeResponsiveContainer({
  children,
  className,
  minHeight = 200,
  width,
  height,
}: SafeResponsiveContainerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setReady(width > 0 && height > 0);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ minHeight, width: width ?? "100%", height: height ?? "100%" }}
    >
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={minHeight}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-lg bg-slate-900/40" />
      )}
    </div>
  );
}
