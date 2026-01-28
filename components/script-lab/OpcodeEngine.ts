
export type StackItem = string; // Representing data as hex strings for simplicity
export type Stack = StackItem[];

export interface ScriptState {
    stack: Stack;
    altStack: Stack;
    pointer: number;
    script: string[]; // Tokenized script
    completed: boolean;
    error: string | null;
    history: { stack: Stack; altStack: Stack; opcode: string }[];
}

export const OPCODES = {
    // Constants
    'OP_0': 0, 'OP_1': 1, 'OP_2': 2, 'OP_3': 3, 'OP_4': 4, 'OP_5': 5, 'OP_6': 6, 'OP_7': 7, 
    'OP_8': 8, 'OP_9': 9, 'OP_10': 10, 'OP_11': 11, 'OP_12': 12, 'OP_13': 13, 'OP_14': 14, 'OP_15': 15, 'OP_16': 16,
    
    // Stack
    'OP_DUP': 'Duplicate top stack item',
    'OP_DROP': 'Remove top stack item',
    'OP_2DUP': 'Duplicate top 2 stack items',
    'OP_SWAP': 'Swap top 2 stack items',
    'OP_OVER': 'Copy second item to top',
    'OP_ROT': 'Rotate top 3 items',
    'OP_DEPTH': 'Push stack depth',
    
    // Alt Stack
    'OP_TOALTSTACK': 'Move top item to Alt Stack',
    'OP_FROMALTSTACK': 'Move top Alt item to Main Stack',

    // Splice
    'OP_CAT': 'Concatenate two strings',

    // Logic/Flow
    'OP_VERIFY': 'Fail if top is not true',
    'OP_EQUAL': 'True if top two equal',
    'OP_EQUALVERIFY': 'Equal + Verify',

    // Arithmetic
    'OP_ADD': 'Add top two numbers',
    'OP_SUB': 'Subtract top two numbers',
    'OP_1ADD': 'Increment top',
    'OP_1SUB': 'Decrement top',

    // Crypto
    'OP_SHA256': 'SHA256 hash of top item',
    'OP_HASH160': 'RIPEMD160(SHA256(top))',
    'OP_CHECKSIG': 'Verify signature (Mock)',
} as const;

export class OpcodeEngine {
    
    static initialState(scriptStr: string): ScriptState {
        return {
            stack: [],
            altStack: [],
            pointer: 0,
            script: scriptStr.trim().split(/\s+/).filter(s => s.length > 0),
            completed: false,
            error: null,
            history: []
        };
    }

    static async step(state: ScriptState): Promise<ScriptState> {
        if (state.completed || state.error) return state;
        if (state.pointer >= state.script.length) {
            return { ...state, completed: true };
        }

        const op = state.script[state.pointer];
        const newStack = [...state.stack];
        const newAltStack = [...state.altStack];
        let newError: string | null = null;
        let jumped = false; // logic for flow control if implemented

        // Helper: Pop
        const pop = () => {
            if (newStack.length === 0) throw new Error("Stack underflow");
            return newStack.pop()!;
        };
        
        // Helper: Push
        const push = (val: string) => newStack.push(val);

        try {
            // --- CONSTANTS ---
            if (op.startsWith('OP_') && !isNaN(parseInt(op.replace('OP_', '')))) {
                push(op.replace('OP_', ''));
            }
            // --- DATA PUSHES (Hex strings not starting with OP_) ---
            else if (!op.startsWith('OP_')) {
                push(op);
            }
            // --- STACK OPS ---
            else if (op === 'OP_DUP') {
                const top = pop();
                push(top);
                push(top);
            }
            else if (op === 'OP_DROP') {
                pop();
            }
            else if (op === 'OP_2DUP') {
                if (newStack.length < 2) throw new Error("Stack underflow");
                const item1 = newStack[newStack.length - 1];
                const item2 = newStack[newStack.length - 2];
                push(item2);
                push(item1);
            }
            else if (op === 'OP_SWAP') {
                 const top = pop();
                 const second = pop();
                 push(top);
                 push(second);
            }
            else if (op === 'OP_OVER') {
                 if (newStack.length < 2) throw new Error("Stack underflow");
                 push(newStack[newStack.length - 2]);
            }
            // --- ARITHMETIC ---
            else if (op === 'OP_ADD') {
                const a = parseInt(pop());
                const b = parseInt(pop());
                if (isNaN(a) || isNaN(b)) throw new Error("Invalid numbers for ADD");
                push((a + b).toString());
            }
            else if (op === 'OP_SUB') {
                const a = parseInt(pop());
                const b = parseInt(pop());
                push((b - a).toString()); // b is deeper, a is top
            }
            else if (op === 'OP_1ADD') {
                const a = parseInt(pop());
                push((a + 1).toString());
            }
            // --- LOGIC ---
            else if (op === 'OP_EQUAL') {
                const a = pop();
                const b = pop();
                push(a === b ? '1' : '0');
            }
            else if (op === 'OP_EQUALVERIFY') {
                 const a = pop();
                 const b = pop();
                 if (a !== b) throw new Error("OP_EQUALVERIFY failed");
            }
            // --- ALT STACK ---
            else if (op === 'OP_TOALTSTACK') {
                newAltStack.push(pop());
            }
            else if (op === 'OP_FROMALTSTACK') {
                if (newAltStack.length === 0) throw new Error("Alt Stack underflow");
                push(newAltStack.pop()!);
            }
            // --- CRYPTO (Simulated) ---
            else if (op === 'OP_HASH160') {
                const top = pop();
                // Simple logical demo hash: "HASH160(<val>)"
                // Simulating what a real visualizer usually shows if not actually verifying bytes
                push(`HASH160(${top.substring(0, 6)}...)`); 
            }
            else if (op === 'OP_CHECKSIG') {
                const pubKey = pop();
                const sig = pop();
                // We'll trust any signature that contains "SIG" and matches pubkey logically?
                // For demo: Always TRUE if sig is valid hex and pubkey is valid hex
                push('1'); // Simulated valid signature
            }
            else {
                // If it looks like hex, treat as push (fallback)
                 if (/^[0-9a-fA-F]+$/.test(op)) {
                     push(op);
                 } else {
                    newError = `Unknown Opcode: ${op}`;
                 }
            }

        } catch (e: any) {
            newError = e.message;
        }

        const nextPointer = state.pointer + 1;
        const complete = nextPointer >= state.script.length;

        // Record history
        const newHistory = [...state.history, { 
            stack: [...state.stack], 
            altStack: [...state.altStack], 
            opcode: op 
        }];

        return {
            stack: newStack,
            altStack: newAltStack,
            pointer: nextPointer,
            script: state.script,
            completed: !!newError || complete,
            error: newError,
            history: newHistory
        };
    }
}
