# Wallet Button Progress – Self-Contained Login Component

## Goal
A single, reusable `<wallet-button>` component that can be dropped on any page.
- Connect via any Cardano wallet (CIP-30)
- After login → shows Profile button with truncated address
- Profile popover: View Profile | Switch Wallet | Log Out
- Foundation for on-chain user identity (future P2P marketplace + governance token)

## Current State (29 March 2026)
- ✅ Lit-based web component (`src/components/wallet/WalletButton.js`)
- ✅ Basic UI states: Connect → Connected/Profile → Popover
- ✅ Wallet detection (Nami, Eternl, Flint, etc.)
- ✅ Placeholder connection flow
- ✅ Works with `client:load` style via manual script import
- ✅ No Qwik or heavy framework bloat
- ✅ Astro 6 + Vercel adapter stable

## Next Steps (Tomorrow)
1. **Step 2**: Real Lucid + CIP-30 integration
   - Proper `enable()` + `lucid.selectWallet()`
   - Fetch real Bech32 address + networkId
   - localStorage persistence (survives refresh)
   - Wallet selector dropdown instead of auto-first

2. **Step 3**: Polish & Persistence
   - Add ADA balance display
   - Better error handling / toast messages
   - Optional avatar from address (Blockies or similar — lightweight)

3. Future
   - Integrate our self-governed token balance
   - Profile page link (on-chain data)
   - P2P marketplace hooks (buy/sell services/items)

## Usage Example (in any .astro file)
```astro
<wallet-button></wallet-button>
<script type="module" src="/src/components/wallet/WalletButton.js"></script>