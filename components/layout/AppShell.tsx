"use client";

import Sidebar from "./Sidebar";

import Footer from "./Footer";
import { PostHogAnalyticsBridge } from "@/components/analytics/PostHogAnalyticsBridge";
import { GuidedLearningProvider } from "@/components/providers/GuidedLearningProvider";
import { LanguageProvider, type Locale } from "@/lib/i18n";

export default function AppShell({
    children,
    initialLocale = "en",
}: {
    children: React.ReactNode;
    initialLocale?: Locale;
}) {
    return (
        <LanguageProvider initialLocale={initialLocale}>
            <PostHogAnalyticsBridge>
            <GuidedLearningProvider>
                <div className="min-h-screen w-full overflow-x-clip bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
                    {/* The Permanent Sidebar */}
                    <Sidebar />

                    {/* Main Content Area */}
                    {/* md:ml-64 matches the width of the expanded sidebar (w-64) */}
                    <main className="min-h-screen min-w-0 transition-all duration-300 ease-in-out md:ml-64 relative flex flex-col">
                        {/* Premium Stitch Background Effects (Global) */}
                        <div className="ambient-bg pointer-events-none" />
                        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 mix-blend-overlay pointer-events-none -z-10"></div>

                        <div className="flex-1 px-4 pb-4 pt-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
                            <div className="mx-auto w-full max-w-screen-2xl min-w-0">
                                {children}
                            </div>
                        </div>

                        <Footer />
                    </main>
                </div>
            </GuidedLearningProvider>
            </PostHogAnalyticsBridge>
        </LanguageProvider>
    );
}
