# Raw Block ES Translation Style Guide (Bitcoin Terminology)

## Goal

Keep Spanish content readable while preserving Bitcoin-native technical accuracy.

Rule of thumb:

- Translate **explanations, UI text, guidance, and warnings**
- Keep **protocol terms, standards, and code identifiers** in English

This applies to:

- Academy content (`nodes.es.ts`)
- Research pages (ES routes)
- Lab UI copy
- Tooltips and warnings

## Keep In English (Always)

These terms should remain in English in Spanish content because they are standard Bitcoin terminology and improve clarity/searchability:

- `Hashrate`
- `Wallet`
- `Fee`
- `Relay`
- `Mempool`
- `Header`
- `Chainwork`
- `UTXO`
- `Coinbase` (transaction/payout context)
- `Witness`
- `Taproot`
- `SegWit`
- `RBF`
- `CPFP`
- `Nonce`
- `Merkle Root`
- `Script`
- `Tapscript`
- `Timelock`
- `Soft fork` / `Hard fork` (prefer lowercase, space)
- `Standardness`
- `Proof-of-Work`
- `Watchtower`
- `Multisig`
- `Key-path` / `Script-path`

## Keep In English (Source / Reference Integrity)

Do not translate:

- BIP titles and IDs (`BIP 125 Replace-by-fee`)
- Paper titles
- External documentation titles
- File names / source paths (`consensus.h`, `policy.h`, `validation.cpp`, `pow.cpp`)
- Code identifiers and API field names

Reason: preserves citation accuracy and makes source verification easier.

## Translate To Spanish (Always)

Translate generic UI and explanatory language:

- Buttons / labels / placeholders
- Errors and warnings
- Descriptive prose
- Explanations of concepts
- Instructional text
- Section headings (except when the heading is a protocol standard name)

Examples:

- `Latest Blocks` -> `Bloques Recientes`
- `Recent Transactions` -> `Transacciones Recientes`
- `Security Notes` -> `Notas de Seguridad`
- `Policy docs` -> `Docs de Politica`
- `Difficulty chart` -> `Grafico de Dificultad`

## Mixed Phrasing (Recommended Pattern)

When a sentence includes protocol terms, translate around them:

- Good:
  - `La Wallet calcula el Fee y transmite por Relay a la Mempool.`
  - `El Header incluye Nonce, Merkle Root y nBits.`
  - `RBF y CPFP son estrategias de fee bumping.`

- Avoid:
  - Fully translating protocol nouns into non-standard wording
  - Over-localizing terms that users search in English

## Writing Style (Spanish)

- Prefer clear LATAM-neutral Spanish
- Keep sentences short in UI contexts
- Avoid literal translation when it harms meaning
- Preserve technical precision over stylistic flourish

## Orthography Rules

Use accents in user-facing Spanish copy:

- `Qué`, `Política`, `Minería`, `Dirección`, `semántica`, `rápido`

Accept no accent only when:

- it is a code identifier
- it is an external title
- it is a constrained slug/path

## Consistency Rules

Use one form consistently:

- `Fee` (not alternate with `Comision` unless in non-technical onboarding prose)
- `Wallet` (not mix with `Billetera` in the same UI block)
- `Hashrate` (not mix with `Tasa de hash`)
- `Mempool` (not `pool de memoria`)
- `Header` (not `encabezado`) in low-level protocol contexts

Allowed exception:

- High-level educational prose may use a translated helper phrase once, followed by the canonical term in English.
  - Example: `encabezado (Header)`

## SEO Note (Spanish Pages)

For `/es/*` pages:

- Keep primary Bitcoin keywords in English where that is how users search
- Translate explanatory modifiers around them

Examples:

- `Bitcoin Script Visual Debugger` can appear in ES copy as:
  - `Depurador visual de Bitcoin Script`
- `Fee Market`:
  - `Mercado de Fees`

## QA Checklist For New ES Content

Before merging:

1. Confirm UI labels are Spanish
2. Confirm protocol terms remain in English
3. Confirm source titles are unchanged
4. Check accents in user-facing Spanish text
5. Check no broken `/es/*` links were introduced
6. Run build (content schema limits may fail if prose gets too long)

## Practical Guardrail For Contributors

When in doubt:

- Keep the protocol noun in English
- Translate the surrounding explanation
- Do not translate source titles
- Prefer consistency with existing Academy ES content over inventing synonyms

