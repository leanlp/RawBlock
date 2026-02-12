import {
  DEFAULT_GUIDED_LEARNING_STATE,
  GUIDED_LESSONS,
  type GuidedLearningState,
} from "@/data/guided-learning";

export const LEARNING_PROGRESS_KEY = "rawblock-learning-progress-v2";

export type PathProgressRecord = {
  currentStepIndex: number;
  completedStepIndexes: number[];
  completedNodeIds: string[];
};

export type LearningProgressState = GuidedLearningState & {
  nodeCompletion: Record<string, boolean>;
  pathProgress: Record<string, PathProgressRecord>;
};

export const DEFAULT_LEARNING_PROGRESS_STATE: LearningProgressState = {
  ...DEFAULT_GUIDED_LEARNING_STATE,
  nodeCompletion: {},
  pathProgress: {},
};

export type LearningProgressAction =
  | { type: "SET_LESSON_INDEX"; index: number }
  | { type: "MARK_LESSON_COMPLETE"; index: number }
  | { type: "SYNC_NODE_LESSON"; index: number }
  | { type: "MARK_NODE_COMPLETE"; nodeId: string }
  | { type: "SET_PATH_STEP"; pathId: string; stepIndex: number }
  | { type: "MARK_PATH_STEP_COMPLETE"; pathId: string; stepIndex: number; nodeId: string }
  | { type: "REPLACE_STATE"; state: LearningProgressState };

function clampLessonIndex(index: number): number {
  return Math.min(Math.max(index, 0), GUIDED_LESSONS.length - 1);
}

function uniqSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values)];
}

export function createPathProgressRecord(stepIndex = 0): PathProgressRecord {
  return {
    currentStepIndex: Math.max(stepIndex, 0),
    completedStepIndexes: [],
    completedNodeIds: [],
  };
}

export function parseLearningProgressState(raw: string | null): LearningProgressState {
  if (!raw) {
    return DEFAULT_LEARNING_PROGRESS_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LearningProgressState>;

    const currentLessonIndex = clampLessonIndex(parsed.currentLessonIndex ?? 0);
    const completedLessons = uniqSorted(
      (parsed.completedLessons ?? [])
        .filter((value) => Number.isInteger(value))
        .map((value) => clampLessonIndex(value)),
    );

    const nodeCompletion =
      typeof parsed.nodeCompletion === "object" && parsed.nodeCompletion
        ? Object.fromEntries(
            Object.entries(parsed.nodeCompletion).filter(
              ([key, value]) => key.length > 0 && typeof value === "boolean",
            ),
          )
        : {};

    const pathProgress: Record<string, PathProgressRecord> = {};
    if (parsed.pathProgress && typeof parsed.pathProgress === "object") {
      Object.entries(parsed.pathProgress).forEach(([pathId, record]) => {
        if (!record || typeof record !== "object") return;

        const safeRecord = record as Partial<PathProgressRecord>;
        pathProgress[pathId] = {
          currentStepIndex: Math.max(0, safeRecord.currentStepIndex ?? 0),
          completedStepIndexes: uniqSorted(
            (safeRecord.completedStepIndexes ?? []).filter((value) => Number.isInteger(value)),
          ),
          completedNodeIds: uniqStrings((safeRecord.completedNodeIds ?? []).filter((value) => typeof value === "string")),
        };
      });
    }

    return {
      currentLessonIndex,
      completedLessons,
      nodeCompletion,
      pathProgress,
    };
  } catch {
    return DEFAULT_LEARNING_PROGRESS_STATE;
  }
}

export function learningProgressReducer(
  state: LearningProgressState,
  action: LearningProgressAction,
): LearningProgressState {
  switch (action.type) {
    case "SET_LESSON_INDEX": {
      return {
        ...state,
        currentLessonIndex: clampLessonIndex(action.index),
      };
    }
    case "MARK_LESSON_COMPLETE": {
      const safe = clampLessonIndex(action.index);
      return {
        ...state,
        completedLessons: uniqSorted([...state.completedLessons, safe]),
      };
    }
    case "SYNC_NODE_LESSON": {
      return {
        ...state,
        currentLessonIndex: clampLessonIndex(action.index),
      };
    }
    case "MARK_NODE_COMPLETE": {
      return {
        ...state,
        nodeCompletion: {
          ...state.nodeCompletion,
          [action.nodeId]: true,
        },
      };
    }
    case "SET_PATH_STEP": {
      const prev = state.pathProgress[action.pathId] ?? createPathProgressRecord();
      return {
        ...state,
        pathProgress: {
          ...state.pathProgress,
          [action.pathId]: {
            ...prev,
            currentStepIndex: Math.max(0, action.stepIndex),
          },
        },
      };
    }
    case "MARK_PATH_STEP_COMPLETE": {
      const prev = state.pathProgress[action.pathId] ?? createPathProgressRecord();
      return {
        ...state,
        pathProgress: {
          ...state.pathProgress,
          [action.pathId]: {
            ...prev,
            completedStepIndexes: uniqSorted([...prev.completedStepIndexes, Math.max(0, action.stepIndex)]),
            completedNodeIds: uniqStrings([...prev.completedNodeIds, action.nodeId]),
          },
        },
      };
    }
    case "REPLACE_STATE": {
      return action.state;
    }
    default:
      return state;
  }
}

export function computeLessonUnlockIndex(completedLessons: number[]): number {
  return Math.min(completedLessons.length, GUIDED_LESSONS.length - 1);
}

export function getPathProgressRecord(
  state: LearningProgressState,
  pathId: string,
): PathProgressRecord {
  return state.pathProgress[pathId] ?? createPathProgressRecord();
}
