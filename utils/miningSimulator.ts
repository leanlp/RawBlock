/**
 * Bitcoin Mining & Difficulty Adjustment Simulator Core Logic
 * 
 * This module deterministically simulates the relationship between
 * Network Hashrate, Difficulty, and Block Verification Times across epochs.
 */

// Base constants representing a "normalized" starting state
export const TARGET_BLOCK_TIME_SECONDS = 600; // 10 minutes
export const BLOCKS_PER_EPOCH = 2016;
export const MAX_RETARGET_FACTOR = 4; // Difficulty can only change by a factor of 4x per epoch

export interface SimulatorState {
    currentBlockHeight: number;
    blocksInCurrentEpoch: number;
    
    // Core Metrics
    currentHashrateEH: number; // Exahashes per second
    currentDifficulty: number; // Normalized to 1.0 for the baseline
    
    // Time tracking
    simulatedEpochElapsedSeconds: number;
    lastBlockTimeSeconds: number;
    
    // History for charts
    history: EpochHistory[];
}

export interface EpochHistory {
    epochNumber: number;
    startingDifficulty: number;
    averageHashrateEH: number;
    timeToCompleteSeconds: number;
    blocksCount: number; // usually 2016
}

/**
 * Initializes a clean simulator state starting at Block 0
 */
export const createInitialState = (startingHashrate: number = 600): SimulatorState => {
    return {
        currentBlockHeight: 0,
        blocksInCurrentEpoch: 0,
        currentHashrateEH: startingHashrate,
        currentDifficulty: 1.0, // Baseline difficulty
        simulatedEpochElapsedSeconds: 0,
        lastBlockTimeSeconds: TARGET_BLOCK_TIME_SECONDS,
        history: []
    };
};

/**
 * Simulates finding exactly one block under the current network conditions.
 * Returns the new state.
 */
export const mineNextBlock = (state: SimulatorState, activeHashrateEH: number): SimulatorState => {
    const newState = { ...state };
    newState.currentHashrateEH = activeHashrateEH;
    
    // The fundamental rule: Time = TargetTime * (Difficulty / HashrateRatio)
    // If hashrate drops by 50% (ratio = 0.5), completion time doubles.
    // Assuming our baseline difficulty of 1.0 was perfectly tuned for the initial hashrate.
    const baselineHashrate = 600; // Reference point for Difficulty = 1.0
    const hashrateRatio = activeHashrateEH / baselineHashrate;
    
    // Prevent divide by zero if user turns off hashrate completely
    const effectiveRatio = Math.max(0.0001, hashrateRatio);
    
    // Calculate how long this specific block took to find
    const simulatedSecondsToFindBlock = TARGET_BLOCK_TIME_SECONDS * (newState.currentDifficulty / effectiveRatio);
    
    // Update state progression
    newState.lastBlockTimeSeconds = simulatedSecondsToFindBlock;
    newState.simulatedEpochElapsedSeconds += simulatedSecondsToFindBlock;
    newState.currentBlockHeight += 1;
    newState.blocksInCurrentEpoch += 1;

    // Check for Difficulty Retargeting (Every 2016 Blocks)
    if (newState.blocksInCurrentEpoch >= BLOCKS_PER_EPOCH) {
        // Epoch is complete. Calculate new difficulty.
        const targetEpochSeconds = BLOCKS_PER_EPOCH * TARGET_BLOCK_TIME_SECONDS; // 1,209,600 seconds (2 weeks)
        const actualEpochSeconds = newState.simulatedEpochElapsedSeconds;
        
        // Calculate adjustment ratio
        let adjustmentRatio = targetEpochSeconds / actualEpochSeconds;
        
        // Apply protocol limits (Max 4x increase or 75% decrease)
        if (adjustmentRatio > MAX_RETARGET_FACTOR) {
            adjustmentRatio = MAX_RETARGET_FACTOR;
        } else if (adjustmentRatio < (1 / MAX_RETARGET_FACTOR)) {
            adjustmentRatio = (1 / MAX_RETARGET_FACTOR);
        }
        
        const oldDifficulty = newState.currentDifficulty;
        const newDifficulty = oldDifficulty * adjustmentRatio;
        
        // Record History
        newState.history.push({
            epochNumber: Math.floor(newState.currentBlockHeight / BLOCKS_PER_EPOCH),
            startingDifficulty: oldDifficulty,
            averageHashrateEH: activeHashrateEH, // Simplified for this simulator
            timeToCompleteSeconds: actualEpochSeconds,
            blocksCount: BLOCKS_PER_EPOCH
        });
        
        // Reset for next epoch
        newState.currentDifficulty = newDifficulty;
        newState.simulatedEpochElapsedSeconds = 0;
        newState.blocksInCurrentEpoch = 0;
    }

    return newState;
};
