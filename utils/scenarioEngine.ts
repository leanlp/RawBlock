/**
 * Transaction Scenario Simulation Engine
 * 
 * Simulates a local Mempool, UTXO Set, and Block Template to teach
 * mechanics of transaction validation, fee selection, and RBF (Double Spending).
 */

export interface UTXO {
    txid: string;
    vout: number;
    amount: number; // satoshis
    scriptPubKey: string; // "P2PKH", "P2TR", etc.
    isSpent: boolean;
}

export interface MockTransaction {
    id: string; // Internal UUID for the UI
    txid: string;
    inputs: { utxoTxid: string; vout: number; amount: number; sequence: number }[];
    outputs: { address: string; amount: number }[];
    fee: number;
    vbytes: number;
    feeRate: number; // satoshis per vbyte
    status: 'pending' | 'mined' | 'rejected' | 'evicted';
    rejectionReason?: string;
    isRBF: boolean;
    timestamp: number;
}

// ---------------------------------------------------------
// Global Simulation State
// ---------------------------------------------------------

export interface NetworkState {
    utxoSet: UTXO[];
    mempool: MockTransaction[];
    minRelayFee: number; // e.g., 1.0 sat/vB
    blockTemplateLimitVbytes: number; // e.g., 1,000,000 vB
}

export const DUST_LIMIT = 546; // satoshis

/**
 * Creates the starting state for the Scenario Labs with a few funded UTXOs
 */
export const createInitialNetworkState = (): NetworkState => ({
    utxoSet: [
        { txid: "fund_01", vout: 0, amount: 50000, scriptPubKey: "P2WPKH", isSpent: false },
        { txid: "fund_02", vout: 1, amount: 15000, scriptPubKey: "P2TR", isSpent: false },
        { txid: "fund_03", vout: 0, amount: 1000000, scriptPubKey: "P2SH", isSpent: false } // 0.01 BTC
    ],
    mempool: [],
    minRelayFee: 1.0,
    blockTemplateLimitVbytes: 1000000,
});

/**
 * Estimates transaction VBytes roughly based on I/O count.
 * Base tx overhead ~10. Inputs ~68 vB (Segwit), Outputs ~31 vB.
 */
export const estimateVBytes = (numInputs: number, numOutputs: number): number => {
    return 10 + (numInputs * 68) + (numOutputs * 31);
};

/**
 * Validates and broadcasts a transaction to the mock mempool.
 * Applies RBF eviction rules if conflicting inputs are found.
 */
export const broadcastTransaction = (
    state: NetworkState, 
    builderInputs: UTXO[], 
    builderOutputs: {address: string, amount: number}[]
): { newState: NetworkState, success: boolean, tx?: MockTransaction, error?: string } => {
    
    // 1. Basic Structure Validation
    if (builderInputs.length === 0) return { newState: state, success: false, error: "Transaction must have at least 1 input." };
    if (builderOutputs.length === 0) return { newState: state, success: false, error: "Transaction must have at least 1 output." };

    // 2. Calculate Values
    const sumInputs = builderInputs.reduce((acc, curr) => acc + curr.amount, 0);
    const sumOutputs = builderOutputs.reduce((acc, curr) => acc + curr.amount, 0);
    const fee = sumInputs - sumOutputs;

    if (fee < 0) return { newState: state, success: false, error: "Outputs must be less than or equal to Inputs." };

    const estimatedVBytes = estimateVBytes(builderInputs.length, builderOutputs.length);
    const feeRate = fee / estimatedVBytes;

    // 3. Script / Dust Validation
    if (feeRate < state.minRelayFee) {
        return { newState: state, success: false, error: `Insufficient feerate: ${feeRate.toFixed(2)} sat/vB. Minimum relay fee is ${state.minRelayFee} sat/vB.` };
    }

    for (const out of builderOutputs) {
        if (out.amount < DUST_LIMIT) {
            return { newState: state, success: false, error: `Output to ${out.address} is below dust limit (${DUST_LIMIT} sats).` };
        }
    }

    // 4. Double Spend / RBF Logic
    let isRBF = false;
    // Check if any selected input signals RBF (Sequence < 0xffffffff - 1)
    // We'll just hardcode standard RBF signaling sequence 0xfffffffd (4294967293) for all inputs for the lab
    const signaledSequence = 4294967293; 

    // Find if any input is already spent in the mempool
    const newTxInputs = builderInputs.map(i => `${i.txid}:${i.vout}`);
    
    // We need to check against existing mempool transactions
    const conflictingTxs: MockTransaction[] = [];
    
    for (const memTx of state.mempool) {
        const memTxInputs = memTx.inputs.map(i => `${i.utxoTxid}:${i.vout}`);
        const hasOverlap = newTxInputs.some(ni => memTxInputs.includes(ni));
        
        if (hasOverlap) {
            conflictingTxs.push(memTx);
        }
    }

    // If there are conflicts, see if we can RBF
    let nextMempool = [...state.mempool];
    
    if (conflictingTxs.length > 0) {
        // Find the highest fee rate among conflicting txs
        const maxConflictFeeRate = Math.max(...conflictingTxs.map(t => t.feeRate));
        const maxConflictAbsoluteFee = Math.max(...conflictingTxs.map(t => t.fee));

        if (feeRate <= maxConflictFeeRate || fee <= maxConflictAbsoluteFee) {
            return { 
                newState: state, 
                success: false, 
                error: `BIP125 RBF Rejected: Replacement fee (${fee} sats, ${feeRate.toFixed(1)} sat/vB) must be higher than conflicting transaction (${maxConflictAbsoluteFee} sats, ${maxConflictFeeRate.toFixed(1)} sat/vB).` 
            };
        }

        // Evict the conflicted transactions
        const conflictIds = conflictingTxs.map(t => t.id);
        nextMempool = nextMempool.map(t => {
            if (conflictIds.includes(t.id)) {
                return { ...t, status: 'evicted', rejectionReason: 'Evicted by higher-fee RBF replacement' };
            }
            return t;
        });

        isRBF = true;
    }

    // 5. Build and Accept
    const newTx: MockTransaction = {
        id: `local_${Date.now()}`,
        txid: `mocktx_${Math.random().toString(16).slice(2, 8)}`,
        inputs: builderInputs.map(utxo => ({ utxoTxid: utxo.txid, vout: utxo.vout, amount: utxo.amount, sequence: signaledSequence })),
        outputs: builderOutputs,
        fee,
        vbytes: estimatedVBytes,
        feeRate,
        status: 'pending',
        isRBF: isRBF || conflictingTxs.length > 0,
        timestamp: Date.now()
    };

    nextMempool.push(newTx);

    return {
        newState: {
            ...state,
            mempool: nextMempool
        },
        success: true,
        tx: newTx
    };
};
