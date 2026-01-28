export interface DIndexMetrics {
    miningResilience: number; // 0-100 (Based on Nakamoto Coefficient)
    nodeDiversity: number;   // 0-100 (Based on Gini of Country Dist)
    economicBreadth: number; // 0-100 (Based on Whale Dominance)
    protocolModernity: number; // 0-100 (Based on SegWit/Taproot Adoption)
}

export interface DIndexResult {
    score: number;
    grade: string;
    metrics: DIndexMetrics;
    analysis: string[];
}

export function calculateDIndex(
    nakamotoCoeff: number, 
    topCountryShare: number, 
    whaledominance: number, 
    segwitAdoption: number
): DIndexResult {
    
    // 1. Mining Resilience (30%)
    // Ideal Nakamoto > 10. Current reality often ~2-3 pools.
    // Score = (Nakamoto / 5) * 100, capped at 100.
    const miningScore = Math.min((nakamotoCoeff / 5) * 100, 100);

    // 2. Node Diversity (25%)
    // If top country (US) has > 50%, score drops. 
    // Ideal: Top country < 20%.
    // Score = 100 - ((Share - 20) * 2). 
    const nodeScore = Math.max(0, Math.min(100, 100 - (Math.max(0, topCountryShare - 20) * 2.5)));

    // 3. Economic Breadth (25%)
    // If top 1% hold 90%, score is low.
    // Whale Dominance input is "Percent of supply held by top 1%".
    // 2024 reality: ~90%? No, actually distribution is improving.
    // Let's say input is "Richest 100 addresses %".
    // Score = 100 - (WhaleDominance * 2)
    const ecoScore = Math.max(0, 100 - (whaledominance * 3));

    // 4. Protocol Modernity (20%)
    // Simple % of SegWit+Taproot adoption.
    const protoScore = segwitAdoption;

    // Weighted Average
    const weightedScore = (
        (miningScore * 0.30) +
        (nodeScore * 0.25) +
        (ecoScore * 0.25) +
        (protoScore * 0.20)
    );

    const grade = 
        weightedScore >= 90 ? 'AAA' :
        weightedScore >= 80 ? 'A' :
        weightedScore >= 70 ? 'B' :
        weightedScore >= 60 ? 'C' :
        'D';

    const analysis = [];
    if (miningScore < 50) analysis.push("CRITICAL: Mining pools are highly centralized. High risk of censorship.");
    if (nodeScore < 50) analysis.push("WARNING: Network nodes are geographically concentrated.");
    if (ecoScore < 40) analysis.push("NOTICE: Wealth distribution remains top-heavy.");
    if (protoScore > 80) analysis.push("POSITIVE: Network is rapidly adopting modern protocol standards.");

    return {
        score: Math.round(weightedScore),
        grade,
        metrics: {
            miningResilience: Math.round(miningScore),
            nodeDiversity: Math.round(nodeScore),
            economicBreadth: Math.round(ecoScore),
            protocolModernity: Math.round(protoScore)
        },
        analysis
    };
}
