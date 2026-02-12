"use client";

import Link from "next/link";
import { graphStore } from "@/lib/graph/store";

type EducationPageType = "transaction" | "block" | "address";

type TransactionShape = {
  size?: number;
  weight?: number;
  vin?: Array<{
    coinbase?: string;
  }>;
};

type EducationPanelProps = {
  pageType: EducationPageType;
  tx?: TransactionShape;
  nodeIds?: string[];
};

function isCoinbaseTransaction(tx?: TransactionShape): boolean {
  if (!tx?.vin || tx.vin.length === 0) return false;
  return tx.vin.some((input) => Boolean(input.coinbase));
}

function isSegwitTransaction(tx?: TransactionShape): boolean {
  if (!tx?.size || !tx?.weight) return false;
  return tx.weight < tx.size * 4;
}

function detectNodeIds(pageType: EducationPageType, tx?: TransactionShape): string[] {
  const detected = new Set<string>();

  if (pageType === "transaction") {
    detected.add("transaction");

    if (isSegwitTransaction(tx)) {
      detected.add("segwit");
    }

    if (isCoinbaseTransaction(tx)) {
      detected.add("coinbase-transaction");
    }
  }

  if (pageType === "block") {
    detected.add("block");
  }

  if (pageType === "address") {
    detected.add("utxo");
  }

  return [...detected];
}

export default function EducationPanel({ pageType, tx, nodeIds }: EducationPanelProps) {
  const detectedNodeIds = nodeIds && nodeIds.length > 0 ? nodeIds : detectNodeIds(pageType, tx);
  const nodes = detectedNodeIds
    .map((nodeId) => graphStore.getNode(nodeId))
    .filter((node) => Boolean(node));

  if (nodes.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="mb-1 text-sm font-semibold text-cyan-300">Contextual Education</h3>
      <p className="mb-4 text-xs text-slate-400">Concepts related to what you are viewing now.</p>
      <div className="space-y-3">
        {nodes.map((node) => (
          <div key={node.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-sm font-medium text-slate-100">{node.title}</p>
            <p className="mt-1 text-xs text-slate-400">{node.summary}</p>
            <Link
              href={`/academy/${node.id}`}
              className="mt-3 inline-flex text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
            >
              Learn More
            </Link>
          </div>
        ))}
      </div>
    </aside>
  );
}
