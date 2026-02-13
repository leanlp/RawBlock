"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  GUIDED_LESSONS,
  getLessonIndexForNodeId,
  GUIDED_LEARNING_UPDATED_EVENT,
  type GuidedLesson,
} from "@/data/guided-learning";
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

function readInitialState(): LearningProgressState {
  if (typeof window === "undefined") {
    return parseLearningProgressState(null);
  }

  return parseLearningProgressState(localStorage.getItem(LEARNING_PROGRESS_KEY));
}

export function GuidedLearningProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(learningProgressReducer, undefined, readInitialState);

  const currentLessonIndex = state.currentLessonIndex;
  const completedLessons = state.completedLessons;
  const resumedFromSession =
    currentLessonIndex > 0 || completedLessons.length > 0 || Object.keys(state.nodeCompletion).length > 0;
  const isRestored = true;

  useEffect(() => {
    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(GUIDED_LEARNING_UPDATED_EVENT, { detail: state }));
  }, [state]);

  useEffect(() => {
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
  }, []);

  const setCurrentLessonIndex = useCallback((index: number) => {
    dispatch({ type: "SET_LESSON_INDEX", index });
  }, []);

  const markLessonComplete = useCallback((index: number) => {
    dispatch({ type: "MARK_LESSON_COMPLETE", index });
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
    () => Math.round((completedLessons.length / GUIDED_LESSONS.length) * 100),
    [completedLessons.length],
  );

  const value = useMemo<GuidedLearningContextValue>(
    () => ({
      ...state,
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
      setCurrentLessonIndex,
      goToLesson,
      markLessonComplete,
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
