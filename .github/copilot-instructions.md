# Cardano P2P dApp — Copilot Instructions

## Stack
- Astro 6 (output: server, Vercel adapter) + Lit 3 web components + Open Props design tokens
- TypeScript throughout. No plain JS for new files.
- Cardano integration via lucid-evolution (NOT the deprecated lucid-cardano package)
- CIP-30 wallet standard for all wallet interactions

## Project structure
- `src/pages/` — Astro pages and API routes
- `src/components/wallet/` — Lit web components (shadow DOM, self-contained styles)
- `src/layouts/` — Astro layout wrappers
- `src/styles/` — global.css is the single source of Open Props imports; do not re-import in other files
- `src/lib/server/` — server-only utilities (auth, DB)

## Key conventions
- Lit components must style themselves internally via the `static styles` getter. Never attempt to style them from outside via descendant selectors — shadow DOM blocks this.
- Use CSS custom properties (Open Props tokens) for all spacing, typography, and colour. Brand tokens: `--brand: #00d1ff`, surfaces: `--surface-1 / --surface-2`.
- Auth flow: nonce from `/api/auth/challenge` → `wallet.signData()` → verify at `/api/auth/verify` → HttpOnly cookie session.
- Nonce store must use Redis/KV in production, not in-memory Map.
- All Cardano wallet calls are async — always handle errors per-wallet (Lace has known CIP-30 signData issues, handle gracefully).

## Code style
- Prefer `async/await` over `.then()` chains
- Early returns for error conditions
- JSDoc on all exported functions
- No large commented-out code blocks — use git history instead