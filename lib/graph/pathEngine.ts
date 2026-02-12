import { transactionLifecycle } from "@/data/paths/transaction-lifecycle";
import { graphStore } from "@/lib/graph/store";

export interface LearningPath {
  id: string;
  title: string;
  orderedNodes: string[];
}

export interface PathProgress {
  total: number;
  completed: number;
  percent: number;
  currentIndex: number;
  currentNodeId: string | null;
  nextNodeId: string | null;
}

const paths: LearningPath[] = [transactionLifecycle];

export function getAllPaths(): LearningPath[] {
  return paths;
}

export function getPathById(pathId: string): LearningPath | undefined {
  return paths.find((path) => path.id === pathId);
}

export function getNodePrerequisites(nodeId: string): string[] {
  return graphStore
    .getIncomingEdges(nodeId)
    .filter((edge) => edge.type === "DEPENDS_ON")
    .map((edge) => edge.from);
}

export function getMissingPrerequisites(
  nodeId: string,
  completedNodeIds: Iterable<string>,
): string[] {
  const completed = new Set(completedNodeIds);
  return getNodePrerequisites(nodeId).filter((prereqId) => !completed.has(prereqId));
}

export function validatePathPrerequisites(path: LearningPath): {
  valid: boolean;
  missingNodeIds: string[];
} {
  const missingNodeIds = path.orderedNodes.filter((nodeId) => !graphStore.hasNode(nodeId));
  return {
    valid: missingNodeIds.length === 0,
    missingNodeIds,
  };
}

export function getPathProgress(path: LearningPath, step: number): PathProgress {
  const total = path.orderedNodes.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      percent: 0,
      currentIndex: 0,
      currentNodeId: null,
      nextNodeId: null,
    };
  }

  const currentIndex = Math.max(0, Math.min(step, total - 1));
  const completed = currentIndex;
  const percent = Math.round((completed / total) * 100);
  const currentNodeId = path.orderedNodes[currentIndex] ?? null;
  const nextNodeId = path.orderedNodes[currentIndex + 1] ?? null;

  return {
    total,
    completed,
    percent,
    currentIndex,
    currentNodeId,
    nextNodeId,
  };
}
