import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/layout/AppShell";
import { validateContentSchemas } from "@/lib/content/validate";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

export const metadata: Metadata = {
  title: "Raw Block | Bitcoin Explorer",
  description: "Advanced visualization for Bitcoin Core nodes: Blocks, Mempool, P2P Network, and Script debugging.",
};

import { Analytics } from "@vercel/analytics/react";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const codeFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

validateContentSchemas();

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
        className={`${uiFont.variable} ${codeFont.variable} antialiased`}
        suppressHydrationWarning
      >
        <AppShell>
          {children}
          <Analytics />
        </AppShell>
      </body>
    </html>
  );
}
