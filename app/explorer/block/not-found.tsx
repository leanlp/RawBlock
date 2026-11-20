import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Block Not Found",
  robots: { index: false, follow: false },
};

/**
 * Rendered for every `/explorer/block/<id>` 404 — malformed ids, future
 * heights (tip pre-check), and hashes the node reports absent.
 */
export default function BlockNotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <Header />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-red-400">Block Not Found</h1>
          <p className="mt-2 text-slate-500 max-w-xl mx-auto">
            The local node has no block for this identifier. The id may be mistyped, the
            height may be in the future, or the hash may belong to a different chain.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/explorer/blocks"
              className="px-4 py-2 min-h-11 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition-colors border border-slate-700"
            >
              Browse Blocks
            </Link>
            <Link
              href="/"
              className="px-4 py-2 min-h-11 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition-colors border border-slate-700"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
