export type GuidedLesson = {
    id: string;
    title: string;
    summary: string;
    modules: Array<{
        label: string;
        href: string;
    }>;
};

export type GuidedLearningState = {
    currentLessonIndex: number;
    completedLessons: number[];
};

export const LESSON_STATE_KEY = "rawblock-guided-learning-v1";
export const GUIDED_LEARNING_UPDATED_EVENT = "rawblock-guided-learning-updated";
export const DEFAULT_GUIDED_LEARNING_STATE: GuidedLearningState = {
    currentLessonIndex: 0,
    completedLessons: [],
};

// Use i18n dictionaries for the actual text content now.

export function parseGuidedLearningState(raw: string | null): GuidedLearningState {
    if (!raw) {
        return DEFAULT_GUIDED_LEARNING_STATE;
    }

    try {
        const parsed = JSON.parse(raw) as {
            currentLessonIndex?: number;
            completedLessons?: number[];
        };

        const currentLessonIndex = Math.min(
            Math.max(parsed.currentLessonIndex ?? 0, 0),
            7 // 8 max lessons
        );
        const completedLessons = (parsed.completedLessons ?? [])
            .filter((item) => Number.isInteger(item))
            .map((item) => Math.min(Math.max(item, 0), 7))
            .filter((item, idx, arr) => arr.indexOf(item) === idx)
            .sort((a, b) => a - b);

        return { currentLessonIndex, completedLessons };
    } catch {
        return DEFAULT_GUIDED_LEARNING_STATE;
    }
}

const NODE_TO_LESSON_ID: Record<string, string> = {
    "what-is-bitcoin": "what-is-bitcoin",
    "transactions-lifecycle": "transactions",
    "utxo-model": "utxo-model",
    "blocks-and-headers": "blocks",
    "mining-and-subsidy": "mining",
    "difficulty-adjustment-2016": "difficulty",
    "consensus-rules-vs-policy": "consensus",
    "pseudonymity-not-anonymity": "security-and-attacks",
    "wallets-hold-keys-not-coins": "security-and-attacks",
    "address-vs-public-key": "security-and-attacks",
    "lightning-network-maturity": "security-and-attacks",
    "segwit-and-taproot-upgrades": "security-and-attacks",
};

// We still need index extraction logic, but without the hardcoded texts.
// We use the English base array strictly for mapping IDs to indexes globally.
import en from "@/lib/i18n/en";
const BASE_LESSONS = en.guidedLearning;

const LESSON_INDEX_BY_ID = new Map(
    BASE_LESSONS.map((lesson: Record<string, unknown>, index: number) => [lesson.id as string, index] as const),
);

export function getLessonIndexForNodeId(nodeId: string): number | null {
    const lessonId = NODE_TO_LESSON_ID[nodeId];
    if (!lessonId) {
        return null;
    }

    const index = LESSON_INDEX_BY_ID.get(lessonId);
    return index === undefined ? null : index;
}
