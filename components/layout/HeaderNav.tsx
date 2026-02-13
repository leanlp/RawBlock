"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MENU_CLOSE_DELAY_MS = 140;

const researchItems = [
  { label: "Overview", href: "/research" },
  { label: "Vulnerabilities", href: "/research/vulnerabilities" },
  { label: "Attack Models", href: "/research/attacks" },
  { label: "Assumptions", href: "/research/assumptions" },
  { label: "Policy vs Consensus", href: "/research/policy" },
];

const topLevelItems = [
  { label: "Explorer", href: "/explorer/blocks" },
  { label: "Academy", href: "/academy" },
  { label: "Knowledge Graph", href: "/graph" },
];

function isResearchPath(pathname: string): boolean {
  return pathname === "/research" || pathname.startsWith("/research/");
}

export default function HeaderNav() {
  const pathname = usePathname();
  const [researchMenuOpen, setResearchMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLAnchorElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current === null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const openResearchMenu = () => {
    clearCloseTimer();
    setResearchMenuOpen(true);
  };

  const scheduleCloseResearchMenu = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setResearchMenuOpen(false);
      closeTimerRef.current = null;
    }, MENU_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (!researchMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRootRef.current?.contains(event.target as Node)) {
        setResearchMenuOpen(false);
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!menuRootRef.current?.contains(event.target as Node)) {
        setResearchMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setResearchMenuOpen(false);
        menuTriggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
      clearCloseTimer();
    };
  }, [researchMenuOpen]);

  return (
    <header className="sticky top-0 z-40 hidden md:block border-b border-slate-800/60 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <div />
        <nav className="flex items-center gap-2">
          {topLevelItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setResearchMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="relative"
            ref={menuRootRef}
            onMouseEnter={openResearchMenu}
            onMouseLeave={scheduleCloseResearchMenu}
          >
            <Link
              ref={menuTriggerRef}
              href="/research"
              aria-haspopup="menu"
              aria-expanded={researchMenuOpen}
              aria-controls="research-menu"
              onFocus={openResearchMenu}
              onClick={() => setResearchMenuOpen(false)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === " ") {
                  event.preventDefault();
                  openResearchMenu();
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
                isResearchPath(pathname)
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
            >
              <span>Research</span>
              <span
                aria-hidden="true"
                className={`text-[11px] leading-none transition-transform ${researchMenuOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </Link>
            {researchMenuOpen ? (
              <div
                id="research-menu"
                className="absolute right-0 top-full z-50 origin-top-right translate-x-1 w-[min(12rem,calc(100vw-2rem))] min-w-[9.75rem] max-w-[12rem] rounded-lg border border-slate-800 bg-slate-900/95 p-1 shadow-xl shadow-black/35 backdrop-blur-sm"
                onMouseEnter={openResearchMenu}
                onMouseLeave={scheduleCloseResearchMenu}
                role="menu"
              >
                {researchItems.map((item) => {
                  const isActive =
                    item.href === "/research"
                      ? pathname === "/research"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setResearchMenuOpen(false)}
                      className={`block rounded-md px-2 py-1.5 text-sm leading-tight hover:bg-slate-800 hover:text-slate-100 ${
                        isActive
                          ? "text-cyan-300"
                          : "text-slate-300"
                      }`}
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>

        <div />
      </div>
    </header>
  );
}
