# IPFS Profile Store Implementation - MVP

## Overview

Wallet-derived deterministic profile storage on public peer-to-peer IPFS with server-side pointer indexing for retrieval. The app now verifies local IPFS write/read correctness and clearly reports whether a profile load came from IPFS or local cache.

## Current Architecture

### 1. Identity and Namespace Derivation (`src/lib/profile.ts`)

- Deterministic namespace derived from wallet identity
- Preferred identity: stake/reward address
- Fallback identity: payment address
- Namespace seed: `cardano-p2p-dapp:profile:v1:{identity}`

### 2. Profile Validation (`src/lib/profile.ts`)

- `displayName` required
- optional fields constrained by length
- website normalization to `https://`
- CID validation uses `CID.parse` via `multiformats`
- payload size limit enforced

### 3. Browser IPFS Client (`src/lib/client/ipfs.ts`)

- Helia singleton with concurrent-init guard
- IndexedDB-backed datastore and blockstore (`datastore-idb`, `blockstore-idb`)
- Compatibility adapter to match Helia 4.2 blockstore expectations
- `addJsonToIPFS(json)` to store profile payload
- `getJsonFromIPFS(cid, timeoutMs, offline)` for retrieval with timeout and optional local-only reads
- `getIPFSStatus()` exposes `storageMode`, `lastInitError`, and connection state

### 4. Authenticated Pointer APIs

- `POST /api/profile/save` validates input and stores namespace -> CID pointer
- `GET /api/profile/get` returns latest pointer for authenticated identity
- pointer store is still in-memory and resets on server restart

### 5. Dashboard Behavior (`src/pages/dashboard.astro`)

- Save flow:
  - writes profile to IPFS
  - verifies immediate local read-back with offline mode
  - stores pointer on server
  - caches CID/profile in `localStorage`
- Load flow (waterfall):
  - server pointer -> IPFS
  - cached CID -> IPFS
  - cached profile JSON fallback
- Status messaging distinguishes IPFS vs cache paths

## Persistence Model (Important)

### What persists now

- Reload/reopen in same browser profile: yes (IndexedDB + localStorage)
- logout/login in same browser profile: yes

### What does not persist

- clearing site data (cookies + IndexedDB + localStorage): local profile copy is removed
- server restarts: in-memory pointer map is removed
- cross-device guaranteed retrieval: not guaranteed without an always-online replica

## Why clear-site-data breaks retrieval

After a full site-data clear, the browser has no local blocks and no local cache. Retrieval then depends entirely on finding peers that still provide the profile CID. If no peers serve it, load fails even though it worked earlier.

## Production Persistence Options

1. Self-hosted always-online IPFS node that pins profile CIDs
2. Managed pinning service (for example Pinata/web3.storage)
3. Persistent server pointer store (Redis/KV/DB) so pointer survives restarts

Best practical path for this project:

1. Keep current browser IndexedDB persistence for user experience
2. Replace in-memory pointer store with Redis/KV
3. Add one always-online pinning source (self-hosted node preferred if avoiding third-party dependence)

## Files Added/Updated

- `src/lib/profile.ts`
- `src/lib/client/ipfs.ts`
- `src/lib/server/pointer-store.ts`
- `src/lib/server/auth.ts`
- `src/pages/api/profile/save.ts`
- `src/pages/api/profile/get.ts`
- `src/pages/dashboard.astro`
- `src/styles/dashboard.css`
- `docs/IPFS_PROFILE_STORE.md`

## Dependencies Added

```json
{
  "helia": "^4.2.0",
  "@helia/unixfs": "^3.0.0",
  "multiformats": "^13.3.7",
  "blockstore-idb": "^3.0.1",
  "datastore-idb": "^4.0.1"
}
```

## Remaining Known Limits

- profile data is plaintext on public IPFS
- pointer store is in-memory only
- without always-online pinning, availability is probabilistic

---

**Implementation Date:** 15-16 April 2026  
**Branch:** `feature/ipfs-profile-store`  
**Status:** MVP Working (local persistence + offline read-back verification)
