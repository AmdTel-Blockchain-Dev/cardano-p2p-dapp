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
- `src/styles/` — Separate CSS files for each major component/feature
  - `global.css` — Core Open Props imports, brand tokens, global resets
  - `home.css` — Homepage-specific styles
  - `dashboard.css` — Dashboard-specific styles
- `src/lib/server/` — server-only utilities (auth, DB)

## Design System & Styling
- **Open Props** — Fluid design tokens for spacing, typography, colors, shadows
- **CSS Custom Properties** — Brand tokens: `--brand: #00d1ff`, surfaces: `--surface-1 / --surface-2`
- **Dark Theme First** — Optimized for crypto users with light theme support
- **Separate CSS Files** — Each major feature/component has its own stylesheet
- **Responsive Design** — Mobile-first with fluid scaling using Open Props

## Current Implementation Status

### Authentication System ✅
- **Secure nonce-based auth**: `/api/auth/challenge` → `wallet.signData()` → `/api/auth/verify` → HttpOnly cookie session
- **COSE_Sign1 verification**: Server-side cryptographic validation of signatures
- **Session management**: HttpOnly cookies with HMAC signatures, localStorage for client state
- **Multi-wallet support**: Yoroi, Nami, Eternl, Flint, Lace (with special handling)

### Wallet Integration ✅
- **WalletButton component**: TypeScript Lit web component with modal UI
- **CIP-30 compliance**: Full standard implementation with error handling
- **Lace wallet support**: Special retry logic and fallback authentication due to known CIP-30 issues
- **Address validation**: Supports all Cardano formats (Shelley, Byron, stake addresses)

### User Dashboard ✅
- **Post-login landing page**: `/dashboard` with user overview and quick actions
- **Authentication guards**: Client-side checks redirect unauthenticated users
- **Activity overview**: Stats cards for listings, volume, reputation, trades
- **Quick actions**: Links to marketplace, create listings, manage listings, transaction history
- **Logout functionality**: Disconnect wallet and clear session
- **Responsive design**: Mobile-first with Open Props fluid tokens
- **Dark/light theme support**: Automatic theme switching with crypto-optimized dark default

## Key conventions
- Lit components must style themselves internally via the `static styles` getter. Never attempt to style them from outside via descendant selectors — shadow DOM blocks this.
- Use CSS custom properties (Open Props tokens) for all spacing, typography, and colour. Brand tokens: `--brand: #00d1ff`, surfaces: `--surface-1 / --surface-2`.
- Auth flow: nonce from `/api/auth/challenge` → `wallet.signData()` → verify at `/api/auth/verify` → HttpOnly cookie session.
- Nonce store must use Redis/KV in production, not in-memory Map.
- All Cardano wallet calls are async — always handle errors per-wallet (Lace has known CIP-30 signData issues, handle gracefully).

## Lace Wallet Special Handling
- **Retry mechanism**: 3 attempts with 1-second delays for signData failures
- **Decline tolerance**: Ignores false "decline" errors that Lace returns even on approval
- **Fallback authentication**: Simplified auth flow when signature verification fails
- **Address format support**: Accepts all Cardano address types for Lace compatibility

## Environment Variables
- **AUTH_SECRET**: Required for production (HMAC session signing). Use fallback in development.
- **Future**: BLOCKFROST_PROJECT_ID for Cardano blockchain queries

## Code style
- Prefer `async/await` over `.then()` chains
- Early returns for error conditions
- JSDoc on all exported functions
- No large commented-out code blocks — use git history instead
- Comprehensive error logging for debugging wallet issues