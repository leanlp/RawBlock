/**
 * Core engine for detecting and parsing transaction privacy heuristics.
 */

export interface TxInput {
    value: number; // in Satoshis (int64 from Go)
    address: string;
}

export interface TxOutput {
    value: number; // in Satoshis (int64 from Go)
    address: string;
    isChange?: boolean; // Heuristically identified as change
}

export interface MockTransaction {
    txid: string;
    inputs: TxInput[];
    outputs: TxOutput[];
}

export interface EvidenceEdge {
    edgeId: string;
    createdHeight: number;
    srcNodeId: string;
    dstNodeId: string;
    edgeType: number;        // 1=CIOH, 2=Change, 3=NegativeGating
    llrScore: number;        // Log-Likelihood Ratio
    dependencyGroup: number; 
    snapshotId: number;      
}

export interface PrivacyAnalysisResult {
    txid: string;
    privacyScore: number;
    anonSet: number;
    heuristicFlags: number; // 64-bit Bitmask encoding binary flags
    edges: EvidenceEdge[];
}

/**
 * Parses the raw PostgreSQL-optimized bitmask back into human-readable flags
 * for the Next.js UI layer.
 */
export const parseHeuristicBitmask = (bitmask: number): string[] => {
    const flags: string[] = [];
    if ((bitmask & (1 << 0)) !== 0) flags.push("Equal-Output Coinjoin");
    if ((bitmask & (1 << 1)) !== 0) flags.push("Whirlpool Topology (5x5)");
    if ((bitmask & (1 << 2)) !== 0) flags.push("Wasabi Mix");
    if ((bitmask & (1 << 3)) !== 0) flags.push("Address Reuse Detected");
    if ((bitmask & (1 << 4)) !== 0) flags.push("PayJoin Suspected");
    
    // Reverse dummy checks for the UI standard cases based on the score structure
    if (bitmask === 0) {
        flags.push("Standard 1-in-2-out Payment");
    }
    
    
    return flags;
};

/**
 * Converts raw int64 Satoshis from the Go engine to decimal BTC UI representation
 */
export const satsToBtc = (sats: number): number => {
    return sats / 100000000;
};

