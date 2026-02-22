import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "../components/layout/AppShell";
import { validateContentSchemas } from "@/lib/content/validate";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Raw Block | Bitcoin Explorer",
  description: "Advanced visualization for Bitcoin Core nodes: Blocks, Mempool, P2P Network, and Script debugging.",
};

const uiFont = localFont({
  src: [{ path: "./fonts/SpaceGrotesk-Variable.ttf", weight: "300 700", style: "normal" }],
  variable: "--font-ui",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const codeFont = localFont({
  src: [{ path: "./fonts/JetBrainsMono-Variable.ttf", weight: "300 800", style: "normal" }],
  variable: "--font-code",
  display: "swap",
  preload: false,
  fallback: ["SFMono-Regular", "Consolas", "Liberation Mono", "monospace"],
});

const displayFont = localFont({
  src: [
    { path: "./fonts/Oxanium-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Oxanium-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  preload: false,
  fallback: ["Eurostile", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

validateContentSchemas();
const enableVercelAnalytics =
  process.env.VERCEL === "1" ||
  process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Plausible Analytics - Privacy-respecting, no cookies */}
        {/* Uncomment and replace 'your-domain.com' with your actual domain */}
        {/* <Script 
          defer 
          data-domain="your-domain.com" 
          src="https://plausible.io/js/script.js"
        /> */}
      </head>
      <body
        className={`${uiFont.variable} ${codeFont.variable} ${displayFont.variable} antialiased`}
        suppressHydrationWarning
      >
        <AppShell>
          {children}
          {enableVercelAnalytics ? <Analytics /> : null}
        </AppShell>
      </body>
    </html>
  );
}
