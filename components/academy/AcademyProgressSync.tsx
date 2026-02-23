"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
    getLessonIndexForNodeId,
} from "@/data/guided-learning";
import { useGuidedLearning } from "@/components/providers/GuidedLearningProvider";
import { useTranslation } from "@/lib/i18n";

export default function AcademyProgressSync({ nodeId }: { nodeId: string }) {
    const {
        currentLessonIndex,
        progressPercent,
        completedLessons,
        currentLesson,
        goToPrevious,
        goToNext,
        markLessonComplete,
        syncNodeProgress,
        markNodeComplete,
        isNodeComplete,
    } = useGuidedLearning();

    useEffect(() => {
        syncNodeProgress(nodeId);
    }, [nodeId, syncNodeProgress]);

    const mappedLessonIndex = getLessonIndexForNodeId(nodeId);
    const nodeCompleted = isNodeComplete(nodeId);
    const { t, locale } = useTranslation();
    const GUIDED_LESSONS = t.guidedLearning;
    const copy = locale === "es"
        ? {
            title: "Progreso del Recorrido",
            subtitle: "Sincronizacion compartida entre Inicio, Sidebar y Academia.",
            lesson: "Leccion",
            completePct: "completado",
            nodeMaps: "Este nodo corresponde a la leccion",
            nodeNotInSequence: "Este nodo no forma parte de la secuencia guiada.",
            nodeStatus: "Estado del nodo",
            completed: "Completado",
            notCompleted: "No completado",
            currentGuidedLesson: "Leccion Guiada Actual",
            lessonsCompleted: "lecciones completadas.",
            previous: "Anterior",
            markComplete: "Marcar Completo",
            markNodeComplete: "Marcar Nodo Completo",
            next: "Siguiente",
            openHomeJourney: "Abrir Recorrido de Inicio",
            of: "de",
          }
        : {
            title: "Journey Progress",
            subtitle: "Shared progress sync across Home, Sidebar, and Academy.",
            lesson: "Lesson",
            completePct: "complete",
            nodeMaps: "This node maps to lesson",
            nodeNotInSequence: "This node is not part of the guided sequence.",
            nodeStatus: "Node status",
            completed: "Completed",
            notCompleted: "Not completed",
            currentGuidedLesson: "Current Guided Lesson",
            lessonsCompleted: "lessons completed.",
            previous: "Previous",
            markComplete: "Mark Complete",
            markNodeComplete: "Mark Node Complete",
            next: "Next",
            openHomeJourney: "Open Home Journey",
            of: "of",
          };
    const homeHref = locale === "es" ? "/es/academy" : "/";

    return (
        <section className="rounded-2xl border border-cyan-800/50 bg-cyan-950/20 p-5">
            <h2 className="mb-1 text-lg font-semibold text-cyan-200">{copy.title}</h2>
            <p className="text-xs text-slate-300">
                {copy.subtitle}
            </p>

            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                <span>
                    {copy.lesson} {currentLessonIndex + 1}/{GUIDED_LESSONS.length}
                </span>
                <span className="text-cyan-300">{progressPercent}% {copy.completePct}</span>
            </div>

            {mappedLessonIndex !== null ? (
                <p className="mt-2 text-xs text-slate-400">
                    {copy.nodeMaps} {mappedLessonIndex + 1}: {GUIDED_LESSONS[mappedLessonIndex].title}
                </p>
            ) : (
                <p className="mt-2 text-xs text-slate-500">{copy.nodeNotInSequence}</p>
            )}
            <p className={`mt-1 text-xs ${nodeCompleted ? "text-emerald-300" : "text-slate-500"}`}>
                {copy.nodeStatus}: {nodeCompleted ? copy.completed : copy.notCompleted}
            </p>

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{copy.currentGuidedLesson}</p>
                <p className="mt-1 text-sm font-medium text-slate-100">{currentLesson.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                    {completedLessons.length} {copy.of} {GUIDED_LESSONS.length} {copy.lessonsCompleted}
                </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={goToPrevious}
                    disabled={currentLessonIndex === 0}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {copy.previous}
                </button>
                <button
                    type="button"
                    onClick={() => markLessonComplete(currentLessonIndex)}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
                >
                    {copy.markComplete}
                </button>
                <button
                    type="button"
                    onClick={() => markNodeComplete(nodeId)}
                    className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs text-violet-300"
                >
                    {copy.markNodeComplete}
                </button>
                <button
                    type="button"
                    onClick={goToNext}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300"
                >
                    {copy.next}
                </button>
                <Link
                    href={homeHref}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500"
                >
                    {copy.openHomeJourney}
                </Link>
            </div>
        </section>
    );
}
