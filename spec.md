# Milady Oracle Dashboard

## Current State
Fresh Caffeine project with only the base template: Motoko stub backend, React + Tailwind frontend skeleton, no application logic or pages.

## Requested Changes (Diff)

### Add
- Full Milady Oracle Dashboard: a dark cyberpunk-themed ICP dApp for BTC Runes and Ordinals tracking and trading
- Multi-wallet integration UI (simulated): Plug, OISY, Bioniq, Unisat, Xverse, OKX, Magic Eden
- Portfolio overview: wallet balances, Rune holdings, Ordinals collection, P&L tracking
- Odin.Fun trading interface: buy/sell Runes, order book, price charts, trading history
- Bioniq marketplace: browse/list Ordinals, bid/ask management
- Live market data dashboard: Rune prices, floor prices, volume, trending assets
- Activity feed: recent transactions, inscriptions, trades across connected wallets
- Settings page: wallet management, notifications, display preferences
- Backend: user profiles, wallet records, portfolio snapshots, watchlist, trade history storage on ICP

### Modify
- Nothing (new project)

### Remove
- Nothing

## Implementation Plan
1. Generate Motoko backend with types for: UserProfile, WalletRecord, RuneHolding, OrdinalItem, TradeRecord, Watchlist, PortfolioSnapshot
2. Backend functions: CRUD for profiles/wallets, portfolio queries, trade history, watchlist management
3. Frontend pages: Dashboard (home), Portfolio, Runes Market, Ordinals/Bioniq, Odin.Fun Trading, Activity Feed, Settings
4. Wallet connect modal with 7 wallet options (simulated)
5. Rich mock data layer for all market data, holdings, and trades
6. Dark cyberpunk aesthetic with neon accents, glassmorphism cards, animated elements
