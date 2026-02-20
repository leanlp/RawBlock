export interface QuizQuestion {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export const NODE_QUIZZES: Record<string, QuizQuestion[]> = {
    block: [
        {
            id: "q_block_1",
            text: "What is the primary cryptographic data structure that links sequential Bitcoin blocks?",
            options: ["Merkle Trees", "SHA-256 Hashes", "RSA Signatures", "Schnorr Pledges"],
            correctIndex: 1,
            explanation: "Blocks are linked via the SHA-256 'previous block hash' field in the block header, establishing the chronological chain."
        },
        {
            id: "q_block_2",
            text: "Which of the following determines the ordering of transactions within a single block?",
            options: ["Alphabetical order by TxID", "First-seen by the network", "Miner preference, typically ordered by feerate", "Geographical proximity of the broadcaster"],
            correctIndex: 2,
            explanation: "Miners have full discretion over transaction ordering and typically maximize profit by sorting by highest feerate."
        },
        {
            id: "q_block_3",
            text: "Where is the consensus-critical 'version' signaling metric stored?",
            options: ["The Coinbase transaction", "The Merkle Root", "The Block Header", "The Signature Script"],
            correctIndex: 2,
            explanation: "Version bits are part of the 80-byte block header and allow miners to signal readiness for upcoming soft-forks."
        }
    ],
    mempool: [
        {
            id: "q_memp_1",
            text: "What happens to a transaction in the mempool if its fee relies on unconfirmed parents?",
            options: ["It is immediately rejected", "It is evaluated as part of a CPFP (Child Pays For Parent) package", "It is stored but ignored by miners", "It requires a Lightning channel"],
            correctIndex: 1,
            explanation: "Miners evaluate packages of transactions (CPFP) to determine if a high-fee child can sponsor a low-fee parent."
        },
        {
            id: "q_memp_2",
            text: "Is the global Bitcoin mempool identical across all nodes?",
            options: ["Yes, enforced by Nakamoto Consensus", "No, it is a localized node policy structure", "Yes, it synchronization takes exactly 10 minutes", "No, only mining pools have real mempools"],
            correctIndex: 1,
            explanation: "The mempool is purely local policy. Depending on uptime, network peering, and RAM settings, every node's mempool differs slightly."
        },
        {
            id: "q_memp_3",
            text: "What resolves a Replace-By-Fee (RBF) conflict in the mempool?",
            options: ["The first transaction seen", "The transaction with a higher absolute fee rate", "An established arbitration node", "A Multisig quorum"],
            correctIndex: 1,
            explanation: "Under BIP-125 Opt-in RBF, the conflict is resolved by accepting the replacement transaction if it offers a significantly higher absolute fee."
        }
    ]
};
