export interface OpcodeDef {
    word: string;
    desc: string;
    stack?: string; // e.g. "x -> x x"
    category: 'stack' | 'splice' | 'logic' | 'crypto' | 'flow' | 'push' | 'other';
}

export const OPCODES: Record<string, OpcodeDef> = {
    // --- Constants / Push ---
    'OP_0': { word: 'OP_0', desc: 'Pushes an empty array (0) onto the stack.', stack: '-> 0', category: 'push' },
    'OP_FALSE': { word: 'OP_FALSE', desc: 'Same as OP_0.', stack: '-> 0', category: 'push' },
    'OP_1': { word: 'OP_1', desc: 'Pushes the number 1 onto the stack.', stack: '-> 1', category: 'push' },
    'OP_TRUE': { word: 'OP_TRUE', desc: 'Same as OP_1.', stack: '-> 1', category: 'push' },
    'OP_RETURN': { word: 'OP_RETURN', desc: 'Marks output as invalid. Used for data embedding.', category: 'flow' },

    // --- Stack Operations ---
    'OP_DUP': { word: 'OP_DUP', desc: 'Duplicates the top stack item.', stack: 'x -> x x', category: 'stack' },
    'OP_DROP': { word: 'OP_DROP', desc: 'Removes the top stack item.', stack: 'x ->', category: 'stack' },
    'OP_SWAP': { word: 'OP_SWAP', desc: 'Swaps the top two stack items.', stack: 'x1 x2 -> x2 x1', category: 'stack' },
    'OP_OVER': { word: 'OP_OVER', desc: 'Copies the second-to-top item to the top.', stack: 'x1 x2 -> x1 x2 x1', category: 'stack' },
    'OP_IFDUP': { word: 'OP_IFDUP', desc: 'Duplicates the top item if it is not 0.', stack: 'x -> x x (if x!=0)', category: 'stack' },
    
    // --- Logic / Flow ---
    'OP_EQUAL': { word: 'OP_EQUAL', desc: 'Returns 1 if inputs are equal, 0 otherwise.', stack: 'x1 x2 -> bool', category: 'logic' },
    'OP_EQUALVERIFY': { word: 'OP_EQUALVERIFY', desc: 'Runs OP_EQUAL, then OP_VERIFY (fails if not equal).', stack: 'x1 x2 ->', category: 'logic' },
    'OP_VERIFY': { word: 'OP_VERIFY', desc: 'Marks transaction as invalid if top item is 0.', stack: 'bool ->', category: 'flow' },
    'OP_SIZE': { word: 'OP_SIZE', desc: 'Pushes byte length of top item.', stack: 'x -> x len', category: 'logic' },

    // --- Crypto ---
    'OP_HASH160': { word: 'OP_HASH160', desc: 'SHA-256 then RIPEMD-160.', stack: 'x -> hash', category: 'crypto' },
    'OP_SHA256': { word: 'OP_SHA256', desc: 'SHA-256 hash.', stack: 'x -> hash', category: 'crypto' },
    'OP_CHECKSIG': { word: 'OP_CHECKSIG', desc: 'Checks ECDSA or Schnorr signature against pubkey.', stack: 'sig pubkey -> bool', category: 'crypto' },
    'OP_CHECKSIGVERIFY': { word: 'OP_CHECKSIGVERIFY', desc: 'Same as OP_CHECKSIG but fails immediately if false.', stack: 'sig pubkey ->', category: 'crypto' },
    'OP_CHECKMULTISIG': { word: 'OP_CHECKMULTISIG', desc: 'Checks m-of-n signatures.', stack: '... sigs ... pubkeys -> bool', category: 'crypto' },
    'OP_CHECKMULTISIGVERIFY': { word: 'OP_CHECKMULTISIGVERIFY', desc: 'Same as CHECKSIG but for multisig.', stack: '...', category: 'crypto' },
};

export function identifyOpcode(token: string): OpcodeDef | null {
    if (OPCODES[token]) return OPCODES[token];
    if (token.startsWith('OP_')) return { word: token, desc: 'Unknown Opcode', category: 'other' };
    return null; // Likely data push (hex)
}
