import Link from "next/link";
import { notFound } from "next/navigation";
import { graphStore } from "@/lib/graph/store";
import {
  getMissingPrerequisites,
  getPathById,
  getPathProgress,
  validatePathPrerequisites,
} from "@/lib/graph/pathEngine";

type PathPageProps = {
  params: Promise<{
    pathId: string;
  }>;
  searchParams: Promise<{
    step?: string;
  }>;
};

function parseStep(rawStep: string | undefined): number {
  if (!rawStep) return 0;
  const parsed = Number.parseInt(rawStep, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default async function PathPage({ params, searchParams }: PathPageProps) {
  const { pathId } = await params;
  const { step } = await searchParams;
  const path = getPathById(pathId);

  if (!path) {
    notFound();
  }

  const pathValidation = validatePathPrerequisites(path);
  if (!pathValidation.valid) {
    throw new Error(
      `Path "${path.id}" references missing nodes: ${pathValidation.missingNodeIds.join(", ")}`,
    );
  }

  const progress = getPathProgress(path, parseStep(step));
  const currentNodeId = progress.currentNodeId;

  if (!currentNodeId) {
    notFound();
  }

  const currentNode = graphStore.getNode(currentNodeId);
  if (!currentNode) {
    notFound();
  }

  const completedNodeIds = path.orderedNodes.slice(0, progress.currentIndex);
  const currentMissingPrereqs = getMissingPrerequisites(currentNode.id, completedNodeIds);
  const nextNodeId = progress.nextNodeId;
  const nextNode = nextNodeId ? graphStore.getNode(nextNodeId) : null;
  const completedPlusCurrent = [...completedNodeIds, currentNode.id];
  const nextMissingPrereqs = nextNode ? getMissingPrerequisites(nextNode.id, completedPlusCurrent) : [];
  const canAdvance = Boolean(nextNode) && nextMissingPrereqs.length === 0;
  const nextStepHref = canAdvance ? `/paths/${path.id}?step=${progress.currentIndex + 1}` : null;

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
              {progress.completed}/{progress.total} completed ({progress.percent}%)
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-cyan-500" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Current concept: <span className="text-slate-200">{currentNode.title}</span>
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
          {currentMissingPrereqs.length === 0 ? (
            <p className="text-sm text-emerald-300">Current concept prerequisites satisfied.</p>
          ) : (
            <div className="space-y-2 text-sm text-amber-300">
              <p>Current concept is blocked by missing prerequisites:</p>
              <ul className="list-disc pl-5">
                {currentMissingPrereqs.map((id) => (
                  <li key={id}>{graphStore.getNode(id)?.title ?? id}</li>
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
              const status =
                index < progress.currentIndex ? "Completed" : index === progress.currentIndex ? "Current" : "Upcoming";
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
              {nextStepHref ? (
                <Link
                  href={nextStepHref}
                  className="inline-flex rounded-lg border border-cyan-600 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20"
                >
                  Next concept
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-500"
                >
                  Next concept
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
