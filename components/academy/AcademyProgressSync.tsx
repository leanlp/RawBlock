"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
    GUIDED_LESSONS,
    getLessonIndexForNodeId,
} from "@/data/guided-learning";
import { useGuidedLearning } from "@/components/providers/GuidedLearningProvider";

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

    return (
        <section className="rounded-2xl border border-cyan-800/50 bg-cyan-950/20 p-5">
            <h2 className="mb-1 text-lg font-semibold text-cyan-200">Journey Progress</h2>
            <p className="text-xs text-slate-300">
                Shared progress sync across Home, Sidebar, and Academy.
            </p>

            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                <span>
                    Lesson {currentLessonIndex + 1}/{GUIDED_LESSONS.length}
                </span>
                <span className="text-cyan-300">{progressPercent}% complete</span>
            </div>

            {mappedLessonIndex !== null ? (
                <p className="mt-2 text-xs text-slate-400">
                    This node maps to lesson {mappedLessonIndex + 1}: {GUIDED_LESSONS[mappedLessonIndex].title}
                </p>
            ) : (
                <p className="mt-2 text-xs text-slate-500">This node is not part of the guided sequence.</p>
            )}
            <p className={`mt-1 text-xs ${nodeCompleted ? "text-emerald-300" : "text-slate-500"}`}>
                Node status: {nodeCompleted ? "Completed" : "Not completed"}
            </p>

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Current Guided Lesson</p>
                <p className="mt-1 text-sm font-medium text-slate-100">{currentLesson.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                    {completedLessons.length} of {GUIDED_LESSONS.length} lessons completed.
                </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={goToPrevious}
                    disabled={currentLessonIndex === 0}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={() => markLessonComplete(currentLessonIndex)}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
                >
                    Mark Complete
                </button>
                <button
                    type="button"
                    onClick={() => markNodeComplete(nodeId)}
                    className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs text-violet-300"
                >
                    Mark Node Complete
                </button>
                <button
                    type="button"
                    onClick={goToNext}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300"
                >
                    Next
                </button>
                <Link
                    href="/"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500"
                >
                    Open Home Journey
                </Link>
            </div>
        </section>
    );
}
