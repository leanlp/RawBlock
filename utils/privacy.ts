import { DecodedTx } from "../app/explorer/decoder/page";

export interface PrivacyAnalysisResult {
    score: number; // 0-100
    grade: string; // A, B, C, D, F
    leaks: string[];
    warnings: string[];
    changeOutputIndex?: number; // Inferred change output
}

export function analyzePrivacy(tx: DecodedTx): PrivacyAnalysisResult {
    let score = 100;
    const leaks: string[] = [];
    const warnings: string[] = [];

    // 1. Round Number Heuristic (Payment vs Change)
    // If one output is a "round" number and the other isn't, the round one is likely the payment.
    // Change is usually the "dusty" remainder.
    let roundOutputIndex = -1;
    let changeOutputIndex = -1;

    if (tx.vout.length === 2) {
        tx.vout.forEach((out, index) => {
            // Check significant digits. If value is like 0.1, 0.5, 1.0, 10.0
            // We convert to string and check trailing zeros?
            // Better: Check modulo.
            const sats = Math.round(out.value * 100000000);
            
            // Heuristic: Multiples of 1,000,000 sats (0.01 BTC) or 100,000 (0.001) are "round".
            if (sats % 100000 === 0) {
                roundOutputIndex = index;
            }
        });

        if (roundOutputIndex !== -1) {
            changeOutputIndex = roundOutputIndex === 0 ? 1 : 0;
            const changeVal = tx.vout[changeOutputIndex].value;
            // warnings.push(`Output #${roundOutputIndex} is a round number. Output #${changeOutputIndex} is likely the change.`);
            // score -= 10; 
            
            // Only penalize if it makes change obvious
            leaks.push(`Round amount payment detected on Output #${roundOutputIndex}. Change output (#${changeOutputIndex}) is easily identifiable.`);
            score -= 15;
        }
    }

    // 2. Output Count Analysis
    if (tx.vout.length === 1) {
        // Sweep or specific payment. No change?
        // Not necessarily bad, but distinct.
        warnings.push("Single output transaction. No change address used (or sweeping).");
    } else if (tx.vout.length > 2) {
        // Batching?
        warnings.push("Multiple outputs detected (Batching). Good for efficiency, but links all payees together.");
    }

    // 3. Address Reuse (Within Transaction)
    // Check if duplicate addresses in outputs
    const addresses = tx.vout.map(v => v.scriptPubKey.address).filter((a): a is string => !!a);
    const uniqueAddresses = new Set(addresses);
    if (uniqueAddresses.size < addresses.length) {
        leaks.push("Address Reuse Detected: Multiple outputs send to the same address.");
        score -= 20;
    }

    // 4. Script Type Consistency (Fingerprinting)
    // We can check if output address types are different (e.g. 1 P2PKH and 1 Bech32)
    // This often reveals which wallet software created the change output.
    if (addresses.length > 1) {
        let hasLegacy = false;
        let hasNative = false;
        let hasNested = false;

        addresses.forEach(addr => {
            if (addr.startsWith('1')) hasLegacy = true;
            if (addr.startsWith('bc1')) hasNative = true;
            if (addr.startsWith('3')) hasNested = true;
        });

        if ((hasLegacy && hasNative) || (hasLegacy && hasNested) || (hasNative && hasNested)) {
            warnings.push("Mixed Output Types: Transaction combines Legacy and SegWit outputs. May usage fingerprinting to identify change.");
            score -= 10;
        }
    }

    // 5. Version Fingerprinting
    if (tx.version === 1 && tx.locktime !== 0) {
        // Standard is version 2 usually? Or Locktime 0.
        // This is weak, but non-standard metadata can fingerprint wallets.
    }

    // Calculate Grade
    score = Math.max(0, score);
    let grade = 'A';
    if (score < 90) grade = 'B';
    if (score < 75) grade = 'C';
    if (score < 60) grade = 'D';
    if (score < 40) grade = 'F';

    return { score, grade, leaks, warnings, changeOutputIndex: changeOutputIndex !== -1 ? changeOutputIndex : undefined };
}
