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
  src: [
    { path: "./fonts/SpaceGrotesk-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/SpaceGrotesk-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/SpaceGrotesk-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/SpaceGrotesk-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-ui",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const codeFont = localFont({
  src: [
    { path: "./fonts/JetBrainsMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/JetBrainsMono-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/JetBrainsMono-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-code",
  display: "swap",
  preload: true,
  fallback: ["SFMono-Regular", "Consolas", "Liberation Mono", "monospace"],
});

const displayFont = localFont({
  src: [
    { path: "./fonts/Oxanium-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Oxanium-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  preload: true,
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
