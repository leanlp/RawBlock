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

export const GUIDED_LESSONS: GuidedLesson[] = [
    {
        id: "what-is-bitcoin",
        title: "What is Bitcoin?",
        summary: "Understand Bitcoin as a decentralized ledger, monetary network, and peer-to-peer protocol.",
        modules: [
            { label: "Protocol Vitals", href: "/explorer/vitals" },
            { label: "Chain Evolution", href: "/analysis/evolution" },
        ],
    },
    {
        id: "transactions",
        title: "Transactions",
        summary: "Learn how transactions move value, use scripts, and get propagated in the mempool.",
        modules: [
            { label: "Transaction Decoder", href: "/explorer/decoder" },
            { label: "Live Mempool", href: "/explorer/mempool" },
        ],
    },
    {
        id: "utxo-model",
        title: "UTXO Model",
        summary: "Understand unspent transaction outputs, coin selection, and spend conditions.",
        modules: [{ label: "UTXO Set Explorer", href: "/analysis/utxo" }],
    },
    {
        id: "blocks",
        title: "Blocks",
        summary: "Explore block structure, ordering, included transactions, and coinbase outputs.",
        modules: [{ label: "Block Explorer", href: "/explorer/blocks" }],
    },
    {
        id: "mining",
        title: "Mining",
        summary: "Study hashrate competition, block production incentives, and miner behavior.",
        modules: [
            { label: "Mining Simulator", href: "/game/mining" },
            { label: "Miner Forensics", href: "/explorer/miners" },
        ],
    },
    {
        id: "difficulty",
        title: "Difficulty",
        summary: "See how the network retargets mining difficulty to keep block intervals stable.",
        modules: [
            { label: "Protocol Vitals", href: "/explorer/vitals" },
            { label: "Mining Simulator", href: "/game/mining" },
        ],
    },
    {
        id: "consensus",
        title: "Consensus",
        summary: "Understand validation rules, block acceptance, and why nodes converge on one chain.",
        modules: [
            { label: "Consensus Debugger", href: "/lab/consensus" },
            { label: "Node Terminal", href: "/explorer/rpc" },
        ],
    },
    {
        id: "security-and-attacks",
        title: "Security & Attacks",
        summary: "Review attack surfaces, forensic patterns, and practical defenses in the Bitcoin ecosystem.",
        modules: [
            { label: "Forensics", href: "/analysis/forensics" },
            { label: "Decentralization Index", href: "/analysis/d-index" },
        ],
    },
];

export function parseGuidedLearningState(raw: string | null): GuidedLearningState {
    if (!raw) {
        return { currentLessonIndex: 0, completedLessons: [] };
    }

    try {
        const parsed = JSON.parse(raw) as {
            currentLessonIndex?: number;
            completedLessons?: number[];
        };

        const currentLessonIndex = Math.min(
            Math.max(parsed.currentLessonIndex ?? 0, 0),
            GUIDED_LESSONS.length - 1
        );
        const completedLessons = (parsed.completedLessons ?? [])
            .filter((item) => Number.isInteger(item))
            .map((item) => Math.min(Math.max(item, 0), GUIDED_LESSONS.length - 1))
            .filter((item, idx, arr) => arr.indexOf(item) === idx)
            .sort((a, b) => a - b);

        return { currentLessonIndex, completedLessons };
    } catch {
        return { currentLessonIndex: 0, completedLessons: [] };
    }
}
