# Milady Oracle Dashboard

## Current State

The app is a full-stack ICP dApp with:
- 7-page dashboard: Dashboard, Portfolio, Runes Market, Ordinals Market, Odin Trading, Activity Feed, Settings
- Wallet connect modal supporting 7 wallets (Unisat, Xverse, OKX, Magic Eden, Plug, OISY, Bioniq)
- OISY wallet currently uses a fake popup that opens `https://oisy.com/sign-in` and waits for a `postMessage` — no real ICRC protocol integration
- Odin Trading page uses Hiro API for Runes market data (BTC Runes), but the "Odin.Fun" trading UI uses mock data only — no real Odin.Fun API calls
- Backend: Motoko canister stores user profiles, wallet records, rune holdings, ordinals, trade history, watchlist, portfolio snapshots
- PWA support, mobile deep links, service worker

## Requested Changes (Diff)

### Add

1. **Real OISY Wallet integration via `@dfinity/oisy-wallet-signer`**
   - Install `@dfinity/oisy-wallet-signer` npm package in the frontend
   - Replace the fake popup flow with a proper `IcpWallet.connect({ url: 'https://oisy.com/sign' })` call
   - Request permissions, retrieve the user's ICP account, and store the real principal/address
   - Show the real ICP principal in the connected wallet display
   - Wire disconnect on wallet disconnect

2. **Live Odin.Fun market data via `https://api.odin.fun/v1`**
   - New service `src/services/odinFunApi.ts` that wraps the Odin.Fun REST API
   - Fetch token list (`/tokens?sort=marketcap:desc&limit=50`) on OdinTrading page load
   - Fetch candlestick/feed data (`/token/{id}/feed`) for the selected token chart
   - Fetch recent trades (`/token/{id}/trades`) for the trade feed
   - Fetch BTC price (`/currency/btc`) for USD conversion
   - Fetch market stats (`/statistics/dashboard`) for the dashboard
   - Convert Odin.Fun price units (multiply raw values × 0.001 to get satoshi values)
   - Show "LIVE" badge when data comes from Odin.Fun API; fallback to mock on error

3. **Odin.Fun token search** — search bar in OdinTrading to find tokens by name/ticker using `/tokens?search=...`

4. **Market stats panel on Dashboard** — show total volume, active tokens, BTC price from Odin.Fun `/statistics/dashboard`

### Modify

1. **`walletDetect.ts` — OISY connection method**
   - Change OISY's `connectRealWallet` to use `IcpWallet.connect` from `@dfinity/oisy-wallet-signer`
   - Return the resolved ICP account owner principal as the address string

2. **`OdinTrading.tsx`** — replace mock rune data with live Odin.Fun tokens
   - Use `odinFunApi.ts` service to load tokens, chart data, and trades
   - Map Odin.Fun token fields to the existing `MarketRune` interface shape
   - Show token image (via `/token/{id}/image` URL pattern `https://api.odin.fun/v1/token/{id}/image`)
   - Add token search input
   - Show live trade history from `/token/{id}/trades`

3. **`liveMarket.ts`** — add Odin.Fun BTC price fallback source

### Remove

- Nothing removed; mock data stays as fallback

## Implementation Plan

1. Install `@dfinity/oisy-wallet-signer` in `src/frontend/package.json`
2. Create `src/frontend/src/services/odinFunApi.ts` with functions:
   - `fetchOdinTokens(params)` — GET /tokens
   - `fetchOdinToken(id)` — GET /token/{id}
   - `fetchOdinTokenFeed(id, params)` — GET /token/{id}/feed
   - `fetchOdinTokenTrades(id)` — GET /token/{id}/trades
   - `fetchOdinBtcPrice()` — GET /currency/btc
   - `fetchOdinDashboardStats()` — GET /statistics/dashboard
   - Price conversion helper: `odinPriceToSats(raw) = raw * 0.001`
3. Update `walletDetect.ts` — OISY case: use `IcpWallet.connect({ url: 'https://oisy.com/sign' })`, return principal
4. Update `OdinTrading.tsx`:
   - Load live Odin.Fun tokens on mount, replace `activeRunes` with live data
   - Load feed/candlestick data per selected token
   - Load trade history per selected token
   - Add search input
   - Show token image thumbnails in market list
5. Update `Dashboard.tsx` — add a market stats row showing Odin.Fun dashboard data
6. Validate and build (typecheck + lint + build)
