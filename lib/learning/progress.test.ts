import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LEARNING_PROGRESS_STATE,
  learningProgressReducer,
  parseLearningProgressState,
} from "@/lib/learning/progress";

test("mark path step complete only updates explicit step", () => {
  const state = learningProgressReducer(DEFAULT_LEARNING_PROGRESS_STATE, {
    type: "MARK_PATH_STEP_COMPLETE",
    pathId: "bitcoin-foundations",
    stepIndex: 2,
    nodeId: "utxo-model",
  });

  assert.deepEqual(state.pathProgress["bitcoin-foundations"]?.completedStepIndexes, [2]);
  assert.equal(state.pathProgress["bitcoin-foundations"]?.currentStepIndex, 0);
});

test("set path step does not auto-complete previous steps", () => {
  const next = learningProgressReducer(DEFAULT_LEARNING_PROGRESS_STATE, {
    type: "SET_PATH_STEP",
    pathId: "bitcoin-foundations",
    stepIndex: 5,
  });

  assert.equal(next.pathProgress["bitcoin-foundations"]?.currentStepIndex, 5);
  assert.deepEqual(next.pathProgress["bitcoin-foundations"]?.completedStepIndexes, []);
});

test("parseLearningProgressState sanitizes malformed input", () => {
  const parsed = parseLearningProgressState(
    JSON.stringify({ currentLessonIndex: 999, completedLessons: [0, 0, -1, 2], pathProgress: { x: { completedStepIndexes: [1, 1] } } }),
  );

  assert.equal(parsed.currentLessonIndex >= 0, true);
  assert.deepEqual(parsed.completedLessons, [0, 2]);
  assert.deepEqual(parsed.pathProgress.x.completedStepIndexes, [1]);
});
