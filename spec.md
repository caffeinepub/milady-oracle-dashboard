# Milady Oracle Dashboard

## Current State

Full-stack ICP dApp with:
- Motoko backend: user profiles, wallets, rune holdings, ordinals, trade records, watchlist, portfolio snapshots — all keyed by caller principal
- React frontend: 7 pages (Dashboard, Portfolio, RunesMarket, OrdinalsMarket, OdinTrading, ActivityFeed, Settings)
- Wallet support: 7 wallets (Unisat, Xverse, OKX, Magic Eden, Plug, OISY, Bioniq)
- OISY uses `@dfinity/oisy-wallet-signer` official protocol
- Odin.Fun: live token list from `api.odin.fun/v1` (paginated), canister IDL from `odinfun-mcp`, trade function calls `token_trade` on `z2vm5-gaaaa-aaaaj-azw6q-cai`
- PWA: manifest, service worker, deep links, install prompt

## Requested Changes (Diff)

### Add

1. **Identity context**: A global `WalletIdentityContext` that stores the connected wallet's ICP `Identity` (from OISY signer, Plug extension, or Internet Identity / AuthClient). All components can read the live identity.
2. **Identity-aware Odin trades**: `OdinTrading` reads the identity from context and passes it to `executeOdinTrade` for real on-chain signed trades. Shows a "SIGN IN TO TRADE" nudge when no identity is available.
3. **OISY identity extraction**: After OISY connects, extract and store the `IcpWallet` instance (not just the principal string) so its `Identity` can be passed to canister calls.
4. **Plug identity extraction**: After Plug connects, get the identity from `window.ic.plug.agent.getPrincipal()` and wrap it in a usable `Identity` object.
5. **Internet Identity fallback**: When an ICP wallet popup succeeds (Plug/Bioniq via II), use the `AuthClient` identity from `useInternetIdentity` and expose it in context.
6. **Backend profile auto-create**: On app mount (if ICP identity present), call `getMyProfile` — if it traps (profile not found), call a new backend `createProfile` function that initializes the user record. This enables backend persistence for the connected user.
7. **Trade record persistence**: After a successful on-chain Odin trade, call `backend.addTradeRecord` with the real trade details to persist it to the ICP canister.
8. **Wallet persistence**: After successful wallet connect, call `backend.addWallet` to persist the wallet record on-chain for the connected ICP principal.

### Modify

1. **`walletDetect.ts` / `connectRealWallet`**: Return not just an address string but also an identity object when available (OISY IcpWallet identity, Plug identity). Export a richer `ConnectionResult` type.
2. **`WalletConnectModal`**: On successful connect, extract and forward the identity (if any) to the `WalletIdentityContext` via a provided callback.
3. **`App.tsx`**: Wrap app in `WalletIdentityProvider`. Pass `onIdentityUpdate` callback to `WalletConnectModal`. After connect, attempt backend profile creation and wallet persistence (only when ICP identity is available).
4. **`OdinTrading.tsx`**: Consume `useWalletIdentity()` hook. If identity is present, use it in `executeOdinTrade`. Show locked/disabled trade form with "Connect an ICP wallet to trade on-chain" message when no identity; allow simulation mode toggle.
5. **`main.mo`**: Add `createProfile` function that creates a new UserProfile for the caller if one doesn't exist yet (idempotent — no-op if already exists). This makes the profile creation safe to call on mount.

### Remove

- The fallback `AnonymousIdentity` placeholder in `OdinTrading.handleTrade` that prevented real trades from ever firing (the code checked `identity.constructor.name === "AnonymousIdentity"` and fell through to simulation).

## Implementation Plan

1. **Backend**: Add `createProfile` public shared function to `main.mo` — creates profile if absent, no-ops if present. Regenerate `backend.d.ts`.
2. **`WalletIdentityContext`** (`src/frontend/src/hooks/useWalletIdentity.tsx`): Create context holding `{ identity: Identity | null; setIdentity: (i: Identity | null) => void; principalText: string | null }`.
3. **`walletDetect.ts`**: Extend `connectRealWallet` to return `{ address: string; identity?: Identity }` for ICP wallets (OISY: store `IcpWallet` instance and proxy its `Identity`; Plug: wrap `window.ic.plug` agent). Export `ConnectionResult` type.
4. **`WalletConnectModal`**: Update `onConnect` callback signature to include optional identity. Forward identity to context after connect.
5. **`App.tsx`**: Wrap with `WalletIdentityProvider`. On wallet connect, call `setIdentity` if identity is provided. After identity is set, call `backend.createProfile` (idempotent) then `backend.addWallet`.
6. **`OdinTrading`**: Replace anonymous-identity guard with `useWalletIdentity()` check. When `identity` is set, pass it to `executeOdinTrade`. After successful trade, call `backend.addTradeRecord`. Show "Connect ICP wallet" CTA when no identity.
7. **TypeCheck + build validation**: Run `pnpm tsc --noEmit` and fix all errors before deploy.
