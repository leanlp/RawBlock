"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { useGuidedLearning } from "@/components/providers/GuidedLearningProvider";
import { getAcademyNodeContent } from "@/lib/content/academy";
import { graphStore } from "@/lib/graph/store";
import {
  getMissingPrerequisites,
  getPathById,
  validatePathPrerequisites,
} from "@/lib/graph/pathEngine";
import { useTranslation } from "@/lib/i18n";

export default function PathPage() {
  const { locale } = useTranslation();
  const routePrefix = locale === "es" ? "/es" : "";
  const copy = locale === "es"
    ? {
        pathNotFound: "Ruta no encontrada",
        pathNotFoundSubtitle: "La ruta de aprendizaje solicitada no existe.",
        kicker: "Ruta de Aprendizaje",
        pathId: "ID de Ruta",
        progress: "Progreso",
        completed: "completado",
        currentConcept: "Concepto actual",
        completionHint: "El progreso solo se actualiza cuando haces clic en",
        markComplete: "Marcar Completo",
        currentConceptTitle: "Concepto Actual",
        openNode: "Abrir nodo en Academia",
        prerequisiteValidation: "Validacion de Prerrequisitos",
        prereqsSatisfied: "Los prerrequisitos del concepto actual estan satisfechos.",
        blockedBy: "El concepto actual esta bloqueado por prerrequisitos faltantes:",
        pathConcepts: "Conceptos de la Ruta",
        statusCompleted: "Completado",
        statusCurrent: "Actual",
        statusUpcoming: "Proximo",
        nextConceptTitle: "Siguiente Concepto",
        pathComplete: "Ruta completada. No hay siguiente concepto.",
        nextLabel: "Siguiente",
        cannotAdvance: "Aun no puedes avanzar. Faltan prerrequisitos para el siguiente concepto:",
        previous: "Anterior",
        nextConceptButton: "Siguiente Concepto",
      }
    : {
        pathNotFound: "Path not found",
        pathNotFoundSubtitle: "The requested learning path does not exist.",
        kicker: "Learning Path",
        pathId: "Path ID",
        progress: "Progress",
        completed: "completed",
        currentConcept: "Current concept",
        completionHint: "Completion only updates when you click",
        markComplete: "Mark Complete",
        currentConceptTitle: "Current Concept",
        openNode: "Open node in Academy",
        prerequisiteValidation: "Prerequisite Validation",
        prereqsSatisfied: "Current concept prerequisites satisfied.",
        blockedBy: "Current concept is blocked by missing prerequisites:",
        pathConcepts: "Path Concepts",
        statusCompleted: "Completed",
        statusCurrent: "Current",
        statusUpcoming: "Upcoming",
        nextConceptTitle: "Next Concept",
        pathComplete: "Path complete. No next concept.",
        nextLabel: "Next",
        cannotAdvance: "Cannot advance yet. Missing prerequisites for next concept:",
        previous: "Previous",
        nextConceptButton: "Next Concept",
      };
  const params = useParams<{ pathId: string }>();
  const localizedPathTitles: Record<string, string> = {
    "bitcoin-foundations": "Fundamentos de Bitcoin",
    "lightning-primer": "Introduccion a Lightning",
    "transaction-lifecycle": "La Vida de una Transaccion",
  };
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
      <main className="page-shell-lg bg-slate-950">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6 md:hidden">
            <Header />
          </div>
          <h1 className="text-2xl font-semibold">{copy.pathNotFound}</h1>
          <p className="mt-2 text-sm text-slate-400">{copy.pathNotFoundSubtitle}</p>
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
  const localizedPathTitle = locale === "es" ? (localizedPathTitles[path.id] ?? path.title) : path.title;
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
  const currentIsComplete =
    completedStepIndexes.includes(stepIndex) || completedNodeIds.includes(currentNode.id);
  const nextMissingPrereqs = nextNode ? getMissingPrerequisites(nextNode.id, completedNodeIds) : [];
  const canAdvance = Boolean(nextNode) && currentIsComplete && nextMissingPrereqs.length === 0;

  const linkedPrereqTitles = currentMissingPrereqs.map(
    (id) => getAcademyNodeContent(id, locale)?.title ?? graphStore.getNode(id)?.title ?? id,
  );

  return (
    <main className="page-shell-lg bg-slate-950">
      <div className="page-wrap-reading">
        <div className="md:hidden">
          <Header />
        </div>
        <header className="page-header">
          <p className="page-kicker">{copy.kicker}</p>
          <h1 className="page-title">{localizedPathTitle}</h1>
          <p className="page-subtitle">
            {copy.pathId}: <span className="font-mono">{path.id}</span>
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{copy.progress}</h2>
            <p className="text-sm text-slate-300">
              {completed}/{total} {copy.completed} ({percent}%)
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-cyan-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {copy.currentConcept}: <span className="text-slate-200">{getAcademyNodeContent(currentNode.id, locale)?.title ?? currentNode.title}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {copy.completionHint} <span className="text-emerald-300">{copy.markComplete}</span>.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">{copy.currentConceptTitle}</h2>
          <p className="mb-3 text-sm text-slate-300">{getAcademyNodeContent(currentNode.id, locale)?.summary ?? currentNode.summary}</p>
          <Link
            href={`${routePrefix}/academy/${currentNode.id}`}
            className="inline-flex rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-cyan-300 hover:border-cyan-500"
          >
            {copy.openNode}
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">{copy.prerequisiteValidation}</h2>
          {linkedPrereqTitles.length === 0 ? (
            <p className="text-sm text-emerald-300">{copy.prereqsSatisfied}</p>
          ) : (
            <div className="space-y-2 text-sm text-amber-300">
              <p>{copy.blockedBy}</p>
              <ul className="list-disc pl-5">
                {linkedPrereqTitles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">{copy.pathConcepts}</h2>
          <ol className="space-y-2">
            {path.orderedNodes.map((nodeId, index) => {
              const node = graphStore.getNode(nodeId);
              const status = completedStepIndexes.includes(index)
                ? copy.statusCompleted
                : index === stepIndex
                  ? copy.statusCurrent
                  : copy.statusUpcoming;
              const localizedTitle = getAcademyNodeContent(nodeId, locale)?.title ?? node?.title ?? nodeId;
              return (
                <li
                  key={nodeId}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 break-words text-slate-200">
                    <span className="text-slate-500">{index + 1}.</span>{" "}
                    <span className="text-slate-100">{localizedTitle}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{status}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">{copy.nextConceptTitle}</h2>
          {!nextNode ? (
            <p className="text-sm text-emerald-300">{copy.pathComplete}</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                {copy.nextLabel}: <span className="text-slate-100">{getAcademyNodeContent(nextNode.id, locale)?.title ?? nextNode.title}</span>
              </p>
              {nextMissingPrereqs.length > 0 && (
                <div className="text-sm text-amber-300">
                  <p>{copy.cannotAdvance}</p>
                  <ul className="list-disc pl-5">
                    {nextMissingPrereqs.map((id) => (
                      <li key={id}>{getAcademyNodeContent(id, locale)?.title ?? graphStore.getNode(id)?.title ?? id}</li>
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
            {copy.previous}
          </button>
          <button
            type="button"
            onClick={() => markPathStepComplete(path.id, stepIndex, currentNode.id)}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300"
          >
            {copy.markComplete}
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
            {copy.nextConceptButton}
          </button>
        </section>
      </div>
    </main>
  );
}
