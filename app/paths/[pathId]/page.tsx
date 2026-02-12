"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useGuidedLearning } from "@/components/providers/GuidedLearningProvider";
import { graphStore } from "@/lib/graph/store";
import {
  getMissingPrerequisites,
  getPathById,
  validatePathPrerequisites,
} from "@/lib/graph/pathEngine";

export default function PathPage() {
  const params = useParams<{ pathId: string }>();
  const path = getPathById(params.pathId);
  const {
    getPathStepIndex,
    setPathStepIndex,
    markPathStepComplete,
    getCompletedPathStepIndexes,
    getCompletedPathNodeIds,
  } = useGuidedLearning();

  if (!path) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 md:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h1 className="text-2xl font-semibold">Path not found</h1>
          <p className="mt-2 text-sm text-slate-400">The requested learning path does not exist.</p>
        </div>
      </main>
    );
  }

  const pathValidation = validatePathPrerequisites(path);
  if (!pathValidation.valid) {
    throw new Error(
      `Path "${path.id}" references missing nodes: ${pathValidation.missingNodeIds.join(", ")}`,
    );
  }

  const total = path.orderedNodes.length;
  const stepIndex = Math.max(0, Math.min(getPathStepIndex(path.id), total - 1));
  const completedStepIndexes = getCompletedPathStepIndexes(path.id);
  const completedNodeIds = getCompletedPathNodeIds(path.id);
  const completed = completedStepIndexes.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const currentNodeId = path.orderedNodes[stepIndex] ?? null;
  if (!currentNodeId) {
    return null;
  }

  const currentNode = graphStore.getNode(currentNodeId);
  if (!currentNode) {
    return null;
  }

  const currentMissingPrereqs = getMissingPrerequisites(currentNode.id, completedNodeIds);
  const nextNodeId = path.orderedNodes[stepIndex + 1] ?? null;
  const nextNode = nextNodeId ? graphStore.getNode(nextNodeId) : null;
  const nextMissingPrereqs = nextNode
    ? getMissingPrerequisites(nextNode.id, [...completedNodeIds, currentNode.id])
    : [];
  const canAdvance = Boolean(nextNode) && nextMissingPrereqs.length === 0;

  const linkedPrereqTitles = useMemo(
    () =>
      currentMissingPrereqs.map((id) => graphStore.getNode(id)?.title ?? id),
    [currentMissingPrereqs],
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Learning Path</p>
          <h1 className="text-3xl font-semibold md:text-4xl">{path.title}</h1>
          <p className="text-sm text-slate-400">
            Path ID: <span className="font-mono">{path.id}</span>
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Progress</h2>
            <p className="text-sm text-slate-300">
              {completed}/{total} completed ({percent}%)
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-cyan-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Current concept: <span className="text-slate-200">{currentNode.title}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Completion only updates when you click <span className="text-emerald-300">Mark Complete</span>.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Current Concept</h2>
          <p className="mb-3 text-sm text-slate-300">{currentNode.summary}</p>
          <Link
            href={`/academy/${currentNode.id}`}
            className="inline-flex rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-cyan-300 hover:border-cyan-500"
          >
            Open node in Academy
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Prerequisite Validation</h2>
          {linkedPrereqTitles.length === 0 ? (
            <p className="text-sm text-emerald-300">Current concept prerequisites satisfied.</p>
          ) : (
            <div className="space-y-2 text-sm text-amber-300">
              <p>Current concept is blocked by missing prerequisites:</p>
              <ul className="list-disc pl-5">
                {linkedPrereqTitles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Path Concepts</h2>
          <ol className="space-y-2">
            {path.orderedNodes.map((nodeId, index) => {
              const node = graphStore.getNode(nodeId);
              const status = completedStepIndexes.includes(index)
                ? "Completed"
                : index === stepIndex
                  ? "Current"
                  : "Upcoming";
              return (
                <li
                  key={nodeId}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm"
                >
                  <span>
                    {index + 1}. {node?.title ?? nodeId}
                  </span>
                  <span className="text-xs text-slate-400">{status}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Next Concept</h2>
          {!nextNode ? (
            <p className="text-sm text-emerald-300">Path complete. No next concept.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                Next: <span className="text-slate-100">{nextNode.title}</span>
              </p>
              {nextMissingPrereqs.length > 0 && (
                <div className="text-sm text-amber-300">
                  <p>Cannot advance yet. Missing prerequisites for next concept:</p>
                  <ul className="list-disc pl-5">
                    {nextMissingPrereqs.map((id) => (
                      <li key={id}>{graphStore.getNode(id)?.title ?? id}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPathStepIndex(path.id, Math.max(stepIndex - 1, 0))}
            disabled={stepIndex === 0}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => markPathStepComplete(path.id, stepIndex, currentNode.id)}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300"
          >
            Mark Complete
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canAdvance) return;
              setPathStepIndex(path.id, stepIndex + 1);
            }}
            disabled={!canAdvance}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next Concept
          </button>
        </section>
      </div>
    </main>
  );
}
