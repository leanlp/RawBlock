import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "../components/layout/AppShell";
import { validateContentSchemas } from "@/lib/content/validate";
import { Analytics } from "@vercel/analytics/react";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} | Bitcoin Explorer & Labs`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  keywords: [
    "Bitcoin explorer",
    "Bitcoin mempool",
    "Bitcoin Script debugger",
    "Taproot playground",
    "UTXO explorer",
    "Bitcoin research",
    "Bitcoin education",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Bitcoin Explorer & Labs`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/icon.png", width: 1200, height: 630, alt: `${SITE_NAME} preview` }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@rawblocknet",
    title: `${SITE_NAME} | Bitcoin Explorer & Labs`,
    description: SITE_DESCRIPTION,
    images: ["/icon.png"],
  },
  category: "technology",
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
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
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
