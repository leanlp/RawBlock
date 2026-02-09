import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AppShell from "../components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raw Block | Bitcoin Explorer",
  description: "Advanced visualization for Bitcoin Core nodes: Blocks, Mempool, P2P Network, and Script debugging.",
};

import { Analytics } from "@vercel/analytics/react";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
