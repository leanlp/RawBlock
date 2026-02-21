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
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.max(0, Math.floor(entry.contentRect.width));
      const nextHeight = Math.max(minHeight, Math.floor(entry.contentRect.height));

      setSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [minHeight]);

  const ready = size.width > 0 && size.height > 0;

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ minHeight, width: width ?? "100%", height: height ?? "100%" }}
    >
      {ready ? (
        <ResponsiveContainer width={size.width} height={size.height} minWidth={1} minHeight={minHeight}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-lg bg-slate-900/40" />
      )}
    </div>
  );
}
