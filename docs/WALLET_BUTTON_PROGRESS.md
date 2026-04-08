# Wallet Button Progress - Self-Contained Lit Component

## Current Status (as of 31 March 2026)
**Stage Complete: Pre-Step 2 - Explicit Wallet + Address Selection UX**

### What was implemented:
- **Connect button** always opens a clean wallet selector modal listing detected CIP-30 wallets (Nami, Eternl, Flint, Lace, etc.). No automatic connection to previously used wallets.
- After selecting a wallet → `enable()` is called, then an **Address Selector modal** appears so the user must explicitly choose which address to log in with (even if only one address exists).
- Once logged in:
  - Button shows truncated address.
  - Clicking the button opens a popover with:
    - "View Profile" (placeholder)
    - **"Switch Address"** – allows changing to a different address in the *same* wallet without full re-login.
    - **"Log Off"** – clears localStorage and resets to Connect state. This is the only way to switch to a completely different wallet.
- Persistence via `localStorage` (`cardano-wallet-name` + `cardano-active-address`).
- `currentWalletApi` stored for fast same-wallet address switching.
- High-contrast, theme-friendly styling using CSS `light-dark()` with fallbacks. Automatically respects system `prefers-color-scheme` (light/dark) and works cleanly in both themes.
- Blue "Connect Wallet" button kept as-is (clean accent color).
- All code remains in a single self-contained `src/components/wallet/WalletButton.js` LitElement — minimal footprint, no extra dependencies.

### How to test:
1. Click "Connect Wallet" → choose wallet → choose address.
2. Open popover → test "Switch Address" and "Log Off".
3. Toggle themes in DevTools (Cmd/Ctrl+Shift+P → "Emulate CSS prefers-color-scheme: dark/light") to verify readability.

### Next Stage (Step 2)
- Integrate real Lucid.js for proper Cardano signing and state management.
- Improve session restoration with actual re-enable on page load.
- Add error boundaries and better user feedback.
- Prepare foundation for self-governed token and P2P marketplace features.

This matches the exact UX flow requested: different wallet = Log Off + re-login; same wallet = Switch Address only.

Branch: `feature/self-contained-wallet-button`
Last updated: 31 March 2026