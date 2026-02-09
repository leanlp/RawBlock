"use client";

import Sidebar from "./Sidebar";

import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
            {/* The Permanent Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            {/* md:ml-64 matches the width of the expanded sidebar (w-64) */}
            <main className="transition-all duration-300 ease-in-out md:ml-64 min-h-screen relative flex flex-col">
                {/* Background Noise/Gradient Effects (Global) */}
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-80 pointer-events-none -z-10" />
                <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none -z-10"></div>


                <div className="p-4 md:p-8 flex-1">
                    {children}
                </div>

                <Footer />
            </main>
        </div>
    );
}
