"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    DEFAULT_GUIDED_LEARNING_STATE,
    GUIDED_LESSONS,
    LESSON_STATE_KEY,
    getLessonIndexForNodeId,
    parseGuidedLearningState,
    type GuidedLesson,
    type GuidedLearningState,
} from "@/data/guided-learning";

type GuidedLearningContextValue = GuidedLearningState & {
    currentLesson: GuidedLesson;
    maxUnlockedLesson: number;
    progressPercent: number;
    resumedFromSession: boolean;
    isRestored: boolean;
    setCurrentLessonIndex: (index: number) => void;
    goToLesson: (index: number) => void;
    markLessonComplete: (index: number) => void;
    goToNext: () => void;
    goToPrevious: () => void;
    syncNodeProgress: (nodeId: string) => void;
};

const GuidedLearningContext = createContext<GuidedLearningContextValue | null>(null);

function clampLessonIndex(index: number): number {
    return Math.min(Math.max(index, 0), GUIDED_LESSONS.length - 1);
}

export function GuidedLearningProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GuidedLearningState>(() => {
        if (typeof window === "undefined") {
            return DEFAULT_GUIDED_LEARNING_STATE;
        }

        return parseGuidedLearningState(localStorage.getItem(LESSON_STATE_KEY));
    });
    const currentLessonIndex = state.currentLessonIndex;
    const completedLessons = state.completedLessons;
    const resumedFromSession = currentLessonIndex > 0 || completedLessons.length > 0;
    const isRestored = true;

    useEffect(() => {
        localStorage.setItem(LESSON_STATE_KEY, JSON.stringify(state));
    }, [state]);

    useEffect(() => {
        const refreshFromStorage = () => {
            const stored = parseGuidedLearningState(localStorage.getItem(LESSON_STATE_KEY));
            setState(stored);
        };

        window.addEventListener("storage", refreshFromStorage);

        return () => {
            window.removeEventListener("storage", refreshFromStorage);
        };
    }, []);

    const setCurrentLessonIndex = useCallback((index: number) => {
        setState((prev) => ({
            ...prev,
            currentLessonIndex: clampLessonIndex(index),
        }));
    }, []);

    const markLessonComplete = useCallback((index: number) => {
        setState((prev) => {
            const safeIndex = clampLessonIndex(index);
            if (prev.completedLessons.includes(safeIndex)) {
                return prev;
            }
            return {
                ...prev,
                completedLessons: [...prev.completedLessons, safeIndex].sort((a, b) => a - b),
            };
        });
    }, []);

    const maxUnlockedLesson = useMemo(
        () => Math.min(completedLessons.length, GUIDED_LESSONS.length - 1),
        [completedLessons.length],
    );

    const goToLesson = useCallback(
        (index: number) => {
            const safeIndex = clampLessonIndex(index);
            if (safeIndex > maxUnlockedLesson) {
                return;
            }
            setState((prev) => ({
                ...prev,
                currentLessonIndex: safeIndex,
            }));
        },
        [maxUnlockedLesson],
    );

    const goToNext = useCallback(() => {
        markLessonComplete(currentLessonIndex);
        setState((prev) => ({
            ...prev,
            currentLessonIndex: clampLessonIndex(prev.currentLessonIndex + 1),
        }));
    }, [currentLessonIndex, markLessonComplete]);

    const goToPrevious = useCallback(() => {
        setState((prev) => ({
            ...prev,
            currentLessonIndex: clampLessonIndex(prev.currentLessonIndex - 1),
        }));
    }, []);

    const syncNodeProgress = useCallback(
        (nodeId: string) => {
            const mappedIndex = getLessonIndexForNodeId(nodeId);
            if (mappedIndex === null) {
                return;
            }
            if (mappedIndex <= maxUnlockedLesson) {
                setState((prev) => ({
                    ...prev,
                    currentLessonIndex: mappedIndex,
                }));
            }
        },
        [maxUnlockedLesson],
    );

    const progressPercent = useMemo(
        () => Math.round((completedLessons.length / GUIDED_LESSONS.length) * 100),
        [completedLessons.length],
    );

    const value = useMemo<GuidedLearningContextValue>(
        () => ({
            currentLessonIndex,
            completedLessons,
            currentLesson: GUIDED_LESSONS[currentLessonIndex],
            maxUnlockedLesson,
            progressPercent,
            resumedFromSession,
            isRestored,
            setCurrentLessonIndex,
            goToLesson,
            markLessonComplete,
            goToNext,
            goToPrevious,
            syncNodeProgress,
        }),
        [
            currentLessonIndex,
            completedLessons,
            maxUnlockedLesson,
            progressPercent,
            resumedFromSession,
            isRestored,
            setCurrentLessonIndex,
            goToLesson,
            markLessonComplete,
            goToNext,
            goToPrevious,
            syncNodeProgress,
        ],
    );

    return (
        <GuidedLearningContext.Provider value={value}>
            {children}
        </GuidedLearningContext.Provider>
    );
}

export function useGuidedLearning(): GuidedLearningContextValue {
    const context = useContext(GuidedLearningContext);
    if (!context) {
        throw new Error("useGuidedLearning must be used within GuidedLearningProvider");
    }
    return context;
}
