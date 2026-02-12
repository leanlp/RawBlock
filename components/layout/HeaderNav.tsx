"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const researchItems = [
  { label: "Vulnerabilities", href: "/research/vulnerabilities" },
  { label: "Attack Models", href: "/research/attacks" },
  { label: "Assumptions", href: "/research/assumptions" },
  { label: "Policy vs Consensus", href: "/research/policy" },
];

const topLevelItems = [
  { label: "Explorer", href: "/explorer/blocks" },
  { label: "Academy", href: "/academy" },
  { label: "Threat Map", href: "/graph" },
];

function isResearchPath(pathname: string): boolean {
  return pathname === "/research" || pathname.startsWith("/research/");
}

export default function HeaderNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [researchMenuOpen, setResearchMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-slate-100">
          RawBlock
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {topLevelItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
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

          <div className="relative flex items-center gap-1">
            <Link
              href="/research"
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isResearchPath(pathname)
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
            >
              Research
            </Link>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={researchMenuOpen}
              onClick={() => setResearchMenuOpen((open) => !open)}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-slate-300 hover:bg-slate-800/80 hover:text-slate-100"
            >
              ▾
            </button>
            {researchMenuOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-800 bg-slate-900 p-1 shadow-xl"
                role="menu"
              >
                {researchItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setResearchMenuOpen(false)}
                    className="block rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                    role="menuitem"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-slate-700 text-slate-200 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="global-mobile-nav"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? "×" : "☰"}
        </button>
      </div>

      {mobileOpen ? (
        <nav
          id="global-mobile-nav"
          className="border-t border-slate-800/70 bg-slate-950 px-4 py-3 md:hidden"
        >
          <div className="space-y-1">
            {topLevelItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded px-3 py-2 text-sm ${
                    active ? "bg-cyan-500/15 text-cyan-300" : "text-slate-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/research"
              onClick={() => setMobileOpen(false)}
              className={`block rounded px-3 py-2 text-sm ${
                pathname === "/research" ? "bg-cyan-500/15 text-cyan-300" : "text-slate-300"
              }`}
            >
              Research Overview
            </Link>
            {researchItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded px-3 py-2 text-sm ${
                  pathname === item.href ? "bg-cyan-500/15 text-cyan-300" : "text-slate-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
