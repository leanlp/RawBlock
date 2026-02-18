
import { sha256 } from "@noble/hashes/sha2.js";
import { ripemd160 } from "@noble/hashes/legacy.js";

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

export type StackItem = string; // Representing data as hex strings for simplicity
export type Stack = StackItem[];

const MAX_SCRIPT_TOKENS = 1000;
const MAX_EXECUTION_STEPS = 2000;

export interface ScriptState {
    stack: Stack;
    altStack: Stack;
    execStack: boolean[]; // Flow control (OP_IF/OP_ELSE/OP_ENDIF)
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
    'OP_IF': 'Conditional execution (if top is true)',
    'OP_NOTIF': 'Conditional execution (if top is false)',
    'OP_ELSE': 'Conditional execution (else branch)',
    'OP_ENDIF': 'End conditional execution',
    'OP_TRUE': 'Push true (1)',
    'OP_FALSE': 'Push false (0)',
    'OP_CHECKSEQUENCEVERIFY': 'Relative timelock check (Mock)',

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

    static isHexLike(value: string): boolean {
        return /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0;
    }

    static toBytes(value: string): Uint8Array {
        if (OpcodeEngine.isHexLike(value)) return hexToBytes(value);
        return new TextEncoder().encode(value);
    }

    static toBool(value: string): boolean {
        const trimmed = value.trim();
        if (!trimmed) return false;
        if (/^-?\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10) !== 0;
        if (OpcodeEngine.isHexLike(trimmed)) return /[1-9a-fA-F]/.test(trimmed);
        return true;
    }
    
    static initialState(scriptStr: string): ScriptState {
        const tokens = scriptStr.trim().split(/\s+/).filter(s => s.length > 0);
        const tooLarge = tokens.length > MAX_SCRIPT_TOKENS;
        return {
            stack: [],
            altStack: [],
            execStack: [],
            pointer: 0,
            script: tooLarge ? tokens.slice(0, MAX_SCRIPT_TOKENS) : tokens,
            completed: false,
            error: tooLarge ? `Script too large (${tokens.length} tokens). Max allowed is ${MAX_SCRIPT_TOKENS}.` : null,
            history: []
        };
    }

    static async step(state: ScriptState): Promise<ScriptState> {
        if (state.completed || state.error) return state;
        if (state.pointer >= state.script.length) {
            return { ...state, completed: true };
        }
        if (state.history.length >= MAX_EXECUTION_STEPS) {
            return {
                ...state,
                completed: true,
                error: `Execution step limit reached (${MAX_EXECUTION_STEPS}).`,
            };
        }

        const op = state.script[state.pointer];
        const newStack = [...state.stack];
        const newAltStack = [...state.altStack];
        const newExecStack = [...state.execStack];
        let newError: string | null = null;

        // Helper: Pop
        const pop = () => {
            if (newStack.length === 0) throw new Error("Stack underflow");
            return newStack.pop()!;
        };
        
        // Helper: Push
        const push = (val: string) => newStack.push(val);

        try {
            const isExecuting = newExecStack.every(Boolean);

            // --- FLOW CONTROL (always processed) ---
            if (op === "OP_IF" || op === "OP_NOTIF") {
                if (isExecuting) {
                    const condition = pop();
                    const truthy = OpcodeEngine.toBool(condition);
                    newExecStack.push(op === "OP_NOTIF" ? !truthy : truthy);
                } else {
                    // In a non-executing branch, OP_IF does not consume stack, but still nests.
                    newExecStack.push(false);
                }
            } else if (op === "OP_ELSE") {
                if (newExecStack.length === 0) throw new Error("OP_ELSE without OP_IF");
                const outerExecuting = newExecStack.slice(0, -1).every(Boolean);
                if (outerExecuting) {
                    newExecStack[newExecStack.length - 1] = !newExecStack[newExecStack.length - 1];
                }
            } else if (op === "OP_ENDIF") {
                if (newExecStack.length === 0) throw new Error("OP_ENDIF without OP_IF");
                newExecStack.pop();
            }

            // --- NORMAL EXECUTION (skipped when inside a false branch) ---
            else if (!isExecuting) {
                // Skip opcodes and pushes while inside a non-executing branch.
            }

            // --- CONSTANTS ---
            else if (op === "OP_TRUE") {
                push("1");
            } else if (op === "OP_FALSE") {
                push("0");
            } else if (/^OP_\d+$/.test(op)) {
                push(op.replace("OP_", ""));
            }
            // --- DATA PUSHES (Hex / words not starting with OP_) ---
            else if (!op.startsWith("OP_")) {
                push(op);
            }
            // --- STACK OPS ---
            else if (op === "OP_DUP") {
                const top = pop();
                push(top);
                push(top);
            } else if (op === "OP_DROP") {
                pop();
            } else if (op === "OP_2DUP") {
                if (newStack.length < 2) throw new Error("Stack underflow");
                const item1 = newStack[newStack.length - 1];
                const item2 = newStack[newStack.length - 2];
                push(item2);
                push(item1);
            } else if (op === "OP_SWAP") {
                const top = pop();
                const second = pop();
                push(top);
                push(second);
            } else if (op === "OP_OVER") {
                if (newStack.length < 2) throw new Error("Stack underflow");
                push(newStack[newStack.length - 2]);
            } else if (op === "OP_ROT") {
                if (newStack.length < 3) throw new Error("Stack underflow");
                const x3 = pop();
                const x2 = pop();
                const x1 = pop();
                push(x2);
                push(x3);
                push(x1);
            } else if (op === "OP_DEPTH") {
                push(String(newStack.length));
            }
            // --- SPLICE ---
            else if (op === "OP_CAT") {
                const a = pop();
                const b = pop();
                if (OpcodeEngine.isHexLike(a) && OpcodeEngine.isHexLike(b)) {
                    push(`${b}${a}`);
                } else {
                    push(`${b}${a}`);
                }
            }
            // --- ARITHMETIC ---
            else if (op === "OP_ADD") {
                const a = Number.parseInt(pop(), 10);
                const b = Number.parseInt(pop(), 10);
                if (Number.isNaN(a) || Number.isNaN(b)) throw new Error("Invalid numbers for ADD");
                push(String(a + b));
            } else if (op === "OP_SUB") {
                const a = Number.parseInt(pop(), 10);
                const b = Number.parseInt(pop(), 10);
                if (Number.isNaN(a) || Number.isNaN(b)) throw new Error("Invalid numbers for SUB");
                push(String(b - a)); // b is deeper, a is top
            } else if (op === "OP_1ADD") {
                const a = Number.parseInt(pop(), 10);
                if (Number.isNaN(a)) throw new Error("Invalid number for 1ADD");
                push(String(a + 1));
            } else if (op === "OP_1SUB") {
                const a = Number.parseInt(pop(), 10);
                if (Number.isNaN(a)) throw new Error("Invalid number for 1SUB");
                push(String(a - 1));
            }
            // --- LOGIC ---
            else if (op === "OP_VERIFY") {
                const val = pop();
                if (!OpcodeEngine.toBool(val)) throw new Error("OP_VERIFY failed");
            } else if (op === "OP_EQUAL") {
                const a = pop();
                const b = pop();
                push(a === b ? "1" : "0");
            } else if (op === "OP_EQUALVERIFY") {
                const a = pop();
                const b = pop();
                if (a !== b) throw new Error("OP_EQUALVERIFY failed");
            }
            // --- TIMELOCK (Mock) ---
            else if (op === "OP_CHECKSEQUENCEVERIFY") {
                if (newStack.length === 0) throw new Error("Stack underflow");
                const top = newStack[newStack.length - 1];
                const n = Number.parseInt(top, 10);
                if (Number.isNaN(n) || n < 0) throw new Error("OP_CHECKSEQUENCEVERIFY requires non-negative integer");
                // Contextless demo: we don't have tx input sequence here, so we only validate the operand.
            }
            // --- ALT STACK ---
            else if (op === "OP_TOALTSTACK") {
                newAltStack.push(pop());
            } else if (op === "OP_FROMALTSTACK") {
                if (newAltStack.length === 0) throw new Error("Alt Stack underflow");
                push(newAltStack.pop()!);
            }
            // --- CRYPTO ---
            else if (op === "OP_SHA256") {
                const top = pop();
                const digest = sha256(OpcodeEngine.toBytes(top));
                push(bytesToHex(digest));
            } else if (op === "OP_HASH160") {
                const top = pop();
                const digest = ripemd160(sha256(OpcodeEngine.toBytes(top)));
                push(bytesToHex(digest));
            } else if (op === "OP_CHECKSIG") {
                pop(); // pubKey (ignored)
                pop(); // signature (ignored)
                push("1"); // Mocked valid signature
            } else {
                // If it looks like hex, treat as push (fallback)
                if (/^[0-9a-fA-F]+$/.test(op)) {
                    push(op);
                } else {
                    newError = `Unknown Opcode: ${op}`;
                }
            }

        } catch (error: unknown) {
            newError = error instanceof Error ? error.message : "Interpreter error";
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
            execStack: newExecStack,
            pointer: nextPointer,
            script: state.script,
            completed: !!newError || complete,
            error: newError,
            history: newHistory
        };
    }
}
