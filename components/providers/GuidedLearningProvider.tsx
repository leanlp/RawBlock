"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  getLessonIndexForNodeId,
  GUIDED_LEARNING_UPDATED_EVENT,
  type GuidedLesson,
} from "@/data/guided-learning";
import { useTranslation } from "@/lib/i18n";
import {
  LEARNING_PROGRESS_KEY,
  computeLessonUnlockIndex,
  createPathProgressRecord,
  getPathProgressRecord,
  learningProgressReducer,
  parseLearningProgressState,
  type LearningProgressState,
} from "@/lib/learning/progress";

type GuidedLearningContextValue = LearningProgressState & {
  currentLesson: GuidedLesson;
  maxUnlockedLesson: number;
  progressPercent: number;
  resumedFromSession: boolean;
  isRestored: boolean;
  setCurrentLessonIndex: (index: number) => void;
  goToLesson: (index: number) => void;
  markLessonComplete: (index: number) => void;
  completeAndAdvanceFrom: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  syncNodeProgress: (nodeId: string) => void;
  markNodeComplete: (nodeId: string) => void;
  isNodeComplete: (nodeId: string) => boolean;
  getPathStepIndex: (pathId: string) => number;
  setPathStepIndex: (pathId: string, stepIndex: number) => void;
  markPathStepComplete: (pathId: string, stepIndex: number, nodeId: string) => void;
  getCompletedPathStepIndexes: (pathId: string) => number[];
  getCompletedPathNodeIds: (pathId: string) => string[];
};

const GuidedLearningContext = createContext<GuidedLearningContextValue | null>(null);

export function GuidedLearningProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const localizedLessons = t.guidedLearning as unknown as GuidedLesson[];

  // Keep first render deterministic to avoid SSR/client text mismatches.
  const [state, dispatch] = useReducer(learningProgressReducer, parseLearningProgressState(null));
  const [isRestored, setIsRestored] = useState(false);

  const currentLessonIndex = state.currentLessonIndex;
  const completedLessons = state.completedLessons;
  const resumedFromSession =
    currentLessonIndex > 0 || completedLessons.length > 0 || Object.keys(state.nodeCompletion).length > 0;

  useEffect(() => {
    dispatch({
      type: "REPLACE_STATE",
      state: parseLearningProgressState(localStorage.getItem(LEARNING_PROGRESS_KEY)),
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRestored(true);
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(GUIDED_LEARNING_UPDATED_EVENT, { detail: state }));
  }, [isRestored, state]);

  useEffect(() => {
    if (!isRestored) return;

    const refreshFromStorage = () => {
      dispatch({
        type: "REPLACE_STATE",
        state: parseLearningProgressState(localStorage.getItem(LEARNING_PROGRESS_KEY)),
      });
    };

    window.addEventListener("storage", refreshFromStorage);

    return () => {
      window.removeEventListener("storage", refreshFromStorage);
    };
  }, [isRestored]);

  const setCurrentLessonIndex = useCallback((index: number) => {
    dispatch({ type: "SET_LESSON_INDEX", index });
  }, []);

  const markLessonComplete = useCallback((index: number) => {
    dispatch({ type: "MARK_LESSON_COMPLETE", index });
  }, []);

  const completeAndAdvanceFrom = useCallback((index: number) => {
    dispatch({ type: "COMPLETE_AND_ADVANCE_FROM", index });
  }, []);

  const maxUnlockedLesson = useMemo(
    () => computeLessonUnlockIndex(completedLessons),
    [completedLessons],
  );

  const goToLesson = useCallback(
    (index: number) => {
      if (index > maxUnlockedLesson) {
        return;
      }
      dispatch({ type: "SET_LESSON_INDEX", index });
    },
    [maxUnlockedLesson],
  );

  const goToNext = useCallback(() => {
    dispatch({ type: "MARK_LESSON_COMPLETE", index: currentLessonIndex });
    dispatch({ type: "SET_LESSON_INDEX", index: currentLessonIndex + 1 });
  }, [currentLessonIndex]);

  const goToPrevious = useCallback(() => {
    dispatch({ type: "SET_LESSON_INDEX", index: currentLessonIndex - 1 });
  }, [currentLessonIndex]);

  const syncNodeProgress = useCallback(
    (nodeId: string) => {
      const mappedIndex = getLessonIndexForNodeId(nodeId);
      if (mappedIndex === null) return;
      if (mappedIndex <= maxUnlockedLesson) {
        dispatch({ type: "SYNC_NODE_LESSON", index: mappedIndex });
      }
    },
    [maxUnlockedLesson],
  );

  const markNodeComplete = useCallback((nodeId: string) => {
    dispatch({ type: "MARK_NODE_COMPLETE", nodeId });
  }, []);

  const isNodeComplete = useCallback(
    (nodeId: string) => Boolean(state.nodeCompletion[nodeId]),
    [state.nodeCompletion],
  );

  const setPathStepIndex = useCallback((pathId: string, stepIndex: number) => {
    dispatch({ type: "SET_PATH_STEP", pathId, stepIndex });
  }, []);

  const markPathStepComplete = useCallback((pathId: string, stepIndex: number, nodeId: string) => {
    dispatch({ type: "MARK_PATH_STEP_COMPLETE", pathId, stepIndex, nodeId });
  }, []);

  const getPathStepIndex = useCallback(
    (pathId: string) => getPathProgressRecord(state, pathId).currentStepIndex,
    [state],
  );

  const getCompletedPathStepIndexes = useCallback(
    (pathId: string) => getPathProgressRecord(state, pathId).completedStepIndexes,
    [state],
  );

  const getCompletedPathNodeIds = useCallback(
    (pathId: string) => getPathProgressRecord(state, pathId).completedNodeIds,
    [state],
  );

  const progressPercent = useMemo(
    () => Math.round((completedLessons.length / localizedLessons.length) * 100),
    [completedLessons.length, localizedLessons.length],
  );

  const value = useMemo<GuidedLearningContextValue>(
    () => ({
      ...state,
      currentLesson: localizedLessons[currentLessonIndex],
      maxUnlockedLesson,
      progressPercent,
      resumedFromSession,
      isRestored,
      setCurrentLessonIndex,
      goToLesson,
      markLessonComplete,
      completeAndAdvanceFrom,
      goToNext,
      goToPrevious,
      syncNodeProgress,
      markNodeComplete,
      isNodeComplete,
      getPathStepIndex,
      setPathStepIndex,
      markPathStepComplete,
      getCompletedPathStepIndexes,
      getCompletedPathNodeIds,
    }),
    [
      state,
      currentLessonIndex,
      maxUnlockedLesson,
      progressPercent,
      resumedFromSession,
      isRestored,
      localizedLessons,
      setCurrentLessonIndex,
      goToLesson,
      markLessonComplete,
      completeAndAdvanceFrom,
      goToNext,
      goToPrevious,
      syncNodeProgress,
      markNodeComplete,
      isNodeComplete,
      getPathStepIndex,
      setPathStepIndex,
      markPathStepComplete,
      getCompletedPathStepIndexes,
      getCompletedPathNodeIds,
    ],
  );

  return <GuidedLearningContext.Provider value={value}>{children}</GuidedLearningContext.Provider>;
}

export function useGuidedLearning(): GuidedLearningContextValue {
  const context = useContext(GuidedLearningContext);
  if (!context) {
    throw new Error("useGuidedLearning must be used within GuidedLearningProvider");
  }
  return context;
}

export function getDefaultPathRecord() {
  return createPathProgressRecord();
}
