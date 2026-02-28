import type { Principal } from "@icp-sdk/core/principal";
import {
  type backendInterface,
  AssetType,
  TradeType,
  WalletType,
  type WalletRecord,
  type RuneHolding,
  type OrdinalItem,
  type TradeRecord,
  type PortfolioSnapshot,
  type WatchlistItem,
  type UserProfile,
  type Preferences,
} from "../backend.d";

// ─── Mock Wallets ────────────────────────────────────────────────
export const mockWallets: WalletRecord[] = [
  {
    id: "wallet-1",
    walletType: WalletType.unisat,
    isConnected: true,
    addedAt: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 30),
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    walletLabel: "Unisat Main",
  },
  {
    id: "wallet-2",
    walletType: WalletType.xverse,
    isConnected: false,
    addedAt: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 15),
    address: "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge6wfptsde3dn3grs48snfn",
    walletLabel: "Xverse Cold",
  },
  {
    id: "wallet-3",
    walletType: WalletType.okx,
    isConnected: false,
    addedAt: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 7),
    address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    walletLabel: "OKX Trading",
  },
];

// ─── Mock Rune Holdings ──────────────────────────────────────────
export const mockRuneHoldings: RuneHolding[] = [
  {
    id: "rune-1",
    runeId: "840000:1",
    runeName: "BILLION•DOLLAR•CAT",
    amount: 420000,
    currentPrice: 0.00000148,
    avgBuyPrice: 0.00000095,
    walletAddress: mockWallets[0].address,
  },
  {
    id: "rune-2",
    runeId: "840000:2",
    runeName: "DOG•GO•TO•THE•MOON",
    amount: 5800000,
    currentPrice: 0.00000072,
    avgBuyPrice: 0.00000060,
    walletAddress: mockWallets[0].address,
  },
  {
    id: "rune-3",
    runeId: "1:0",
    runeName: "UNCOMMON•GOODS",
    amount: 1250,
    currentPrice: 0.00185,
    avgBuyPrice: 0.00120,
    walletAddress: mockWallets[0].address,
  },
  {
    id: "rune-4",
    runeId: "840001:1",
    runeName: "RSIC•METAPROTOCOL",
    amount: 88000,
    currentPrice: 0.00000312,
    avgBuyPrice: 0.00000200,
    walletAddress: mockWallets[0].address,
  },
  {
    id: "rune-5",
    runeId: "840002:1",
    runeName: "PIZZA•NINJAS•RUNES",
    amount: 3400,
    currentPrice: 0.000840,
    avgBuyPrice: 0.000600,
    walletAddress: mockWallets[0].address,
  },
  {
    id: "rune-6",
    runeId: "840003:1",
    runeName: "SATOSHI•NAKAMOTO",
    amount: 210,
    currentPrice: 0.002100,
    avgBuyPrice: 0.001800,
    walletAddress: mockWallets[0].address,
  },
  {
    id: "rune-7",
    runeId: "840004:1",
    runeName: "LOBO•THE•WOLF•PUP",
    amount: 9900000,
    currentPrice: 0.00000018,
    avgBuyPrice: 0.00000022,
    walletAddress: mockWallets[0].address,
  },
  {
    id: "rune-8",
    runeId: "840005:1",
    runeName: "WANKO•MANKO•RUNES",
    amount: 14000000,
    currentPrice: 0.000000095,
    avgBuyPrice: 0.000000080,
    walletAddress: mockWallets[0].address,
  },
];

// ─── Mock Ordinals ───────────────────────────────────────────────
export const mockOrdinals: OrdinalItem[] = [
  {
    id: "ord-1",
    name: "NodeMonkes #4721",
    collectionName: "NodeMonkes",
    inscriptionId: "6fb976ab49dcec017f1e201e84395983204ae1a7ae11bd2be1178ce8fc8bf1b2i0",
    floorPrice: 0.085,
    acquiredPrice: 0.062,
    walletAddress: mockWallets[0].address,
    imageUrl: "",
  },
  {
    id: "ord-2",
    name: "Bitcoin Puppets #1337",
    collectionName: "Bitcoin Puppets",
    inscriptionId: "4f5e32a4d5c1b2e8a9f6d3c7b1e4a2f8d9c6b3e7a4f1d8c5b2e9a6f3d0c7b4i0",
    floorPrice: 0.042,
    acquiredPrice: 0.031,
    walletAddress: mockWallets[0].address,
    imageUrl: "",
  },
  {
    id: "ord-3",
    name: "Quantum Cats #88",
    collectionName: "Quantum Cats",
    inscriptionId: "9c3d6e1f4a7b2e5d8c1f4a7b0d3e6f9c2e5d8a1b4e7c0f3d6a9b2e5c8f1d4a7i0",
    floorPrice: 0.31,
    acquiredPrice: 0.18,
    walletAddress: mockWallets[0].address,
    imageUrl: "",
  },
  {
    id: "ord-4",
    name: "Bitmap #420420",
    collectionName: "Bitmap",
    inscriptionId: "2e5c8f1d4a7b0e3f6c9d2e5a8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5i0",
    floorPrice: 0.0035,
    acquiredPrice: 0.0028,
    walletAddress: mockWallets[0].address,
    imageUrl: "",
  },
  {
    id: "ord-5",
    name: "Bitcoin Frogs #222",
    collectionName: "Bitcoin Frogs",
    inscriptionId: "7a0d3f6c9e2b5d8a1f4c7e0b3d6a9f2c5e8b1d4a7c0f3e6b9d2a5f8c1e4b7d0i0",
    floorPrice: 0.019,
    acquiredPrice: 0.014,
    walletAddress: mockWallets[0].address,
    imageUrl: "",
  },
  {
    id: "ord-6",
    name: "Ordinal Maxi Biz #512",
    collectionName: "Ordinal Maxi Biz",
    inscriptionId: "1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8a1f4c7e0b3d6a9f2c5e8b1d4i0",
    floorPrice: 0.128,
    acquiredPrice: 0.095,
    walletAddress: mockWallets[0].address,
    imageUrl: "",
  },
];

// ─── Market Runes (for market page, not held) ────────────────────
export interface MarketRune {
  runeId: string;
  runeName: string;
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  supply: number;
  mintProgress: number;
}

export const marketRunes: MarketRune[] = [
  {
    runeId: "840000:1",
    runeName: "BILLION•DOLLAR•CAT",
    symbol: "BDC",
    currentPrice: 0.00000148,
    priceChange24h: 12.4,
    volume24h: 8.45,
    marketCap: 148.0,
    supply: 100000000000,
    mintProgress: 100,
  },
  {
    runeId: "840000:2",
    runeName: "DOG•GO•TO•THE•MOON",
    symbol: "DOG",
    currentPrice: 0.00000072,
    priceChange24h: -3.8,
    volume24h: 12.2,
    marketCap: 72.0,
    supply: 100000000000,
    mintProgress: 100,
  },
  {
    runeId: "1:0",
    runeName: "UNCOMMON•GOODS",
    symbol: "UNCO",
    currentPrice: 0.00185,
    priceChange24h: 22.1,
    volume24h: 4.8,
    marketCap: 1850.0,
    supply: 1000000,
    mintProgress: 100,
  },
  {
    runeId: "840001:1",
    runeName: "RSIC•METAPROTOCOL",
    symbol: "RSIC",
    currentPrice: 0.00000312,
    priceChange24h: 8.7,
    volume24h: 6.3,
    marketCap: 27.5,
    supply: 21000000000,
    mintProgress: 100,
  },
  {
    runeId: "840002:1",
    runeName: "PIZZA•NINJAS•RUNES",
    symbol: "PIZZA",
    currentPrice: 0.000840,
    priceChange24h: 5.2,
    volume24h: 2.1,
    marketCap: 840.0,
    supply: 1000000,
    mintProgress: 100,
  },
  {
    runeId: "840003:1",
    runeName: "SATOSHI•NAKAMOTO",
    symbol: "SAT",
    currentPrice: 0.002100,
    priceChange24h: -1.4,
    volume24h: 1.8,
    marketCap: 2100.0,
    supply: 1000000,
    mintProgress: 100,
  },
  {
    runeId: "840004:1",
    runeName: "LOBO•THE•WOLF•PUP",
    symbol: "LOBO",
    currentPrice: 0.00000018,
    priceChange24h: -8.2,
    volume24h: 3.4,
    marketCap: 18.0,
    supply: 100000000000,
    mintProgress: 100,
  },
  {
    runeId: "840005:1",
    runeName: "WANKO•MANKO•RUNES",
    symbol: "WMR",
    currentPrice: 0.000000095,
    priceChange24h: 31.5,
    volume24h: 1.9,
    marketCap: 9.5,
    supply: 100000000000,
    mintProgress: 85,
  },
  {
    runeId: "840006:1",
    runeName: "MEME•ECONOMICS",
    symbol: "MEME",
    currentPrice: 0.0000024,
    priceChange24h: 45.3,
    volume24h: 5.6,
    marketCap: 24.0,
    supply: 10000000000,
    mintProgress: 92,
  },
  {
    runeId: "840007:1",
    runeName: "ORDINAL•MAXI•BIZ",
    symbol: "OMB",
    currentPrice: 0.00038,
    priceChange24h: -12.1,
    volume24h: 0.9,
    marketCap: 380.0,
    supply: 1000000,
    mintProgress: 100,
  },
];

// ─── Ordinals Collections (for market page) ──────────────────────
export interface OrdinalCollection {
  id: string;
  name: string;
  floorPrice: number;
  floorChange24h: number;
  volume24h: number;
  owners: number;
  supply: number;
  imageUrl: string;
}

export const ordinalCollections: OrdinalCollection[] = [
  {
    id: "col-1",
    name: "NodeMonkes",
    floorPrice: 0.085,
    floorChange24h: 8.2,
    volume24h: 12.4,
    owners: 9521,
    supply: 10000,
    imageUrl: "",
  },
  {
    id: "col-2",
    name: "Bitcoin Puppets",
    floorPrice: 0.042,
    floorChange24h: -4.1,
    volume24h: 8.8,
    owners: 8247,
    supply: 10000,
    imageUrl: "",
  },
  {
    id: "col-3",
    name: "Quantum Cats",
    floorPrice: 0.31,
    floorChange24h: 15.3,
    volume24h: 31.2,
    owners: 3001,
    supply: 3333,
    imageUrl: "",
  },
  {
    id: "col-4",
    name: "Bitmap",
    floorPrice: 0.0035,
    floorChange24h: 2.1,
    volume24h: 4.2,
    owners: 32000,
    supply: 840000,
    imageUrl: "",
  },
  {
    id: "col-5",
    name: "Bitcoin Frogs",
    floorPrice: 0.019,
    floorChange24h: -2.8,
    volume24h: 3.6,
    owners: 9654,
    supply: 10000,
    imageUrl: "",
  },
  {
    id: "col-6",
    name: "Ordinal Maxi Biz",
    floorPrice: 0.128,
    floorChange24h: 6.4,
    volume24h: 9.7,
    owners: 5421,
    supply: 6969,
    imageUrl: "",
  },
];

// ─── Portfolio History (30 days) ─────────────────────────────────
const BTC_PRICE = 68500;
const generatePortfolioHistory = (): PortfolioSnapshot[] => {
  const snapshots: PortfolioSnapshot[] = [];
  let baseTotal = 1.82;
  for (let i = 29; i >= 0; i--) {
    const ts = Date.now() - i * 86400000;
    const noise = (Math.random() - 0.48) * 0.08;
    baseTotal = Math.max(0.5, baseTotal + noise);
    const runesVal = baseTotal * 0.55;
    const ordinalsVal = baseTotal * 0.45;
    snapshots.push({
      id: `snap-${i}`,
      timestamp: BigInt(ts),
      totalValueBtc: baseTotal,
      totalValueUsd: baseTotal * BTC_PRICE,
      runesValueBtc: runesVal,
      ordinalsValueBtc: ordinalsVal,
      pnlDay: (Math.random() - 0.45) * 0.12,
      pnlWeek: (Math.random() - 0.4) * 0.25,
      pnlMonth: (Math.random() - 0.35) * 0.45,
    });
  }
  return snapshots;
};

export const portfolioHistory = generatePortfolioHistory();

// ─── Trade History ───────────────────────────────────────────────
export const mockTrades: TradeRecord[] = [
  {
    id: "trade-1",
    asset: "BILLION•DOLLAR•CAT",
    assetType: AssetType.rune,
    tradeType: TradeType.buy,
    amount: 420000,
    price: 0.00000095,
    totalValue: 0.399,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 15),
    status: "confirmed",
  },
  {
    id: "trade-2",
    asset: "NodeMonkes #4721",
    assetType: AssetType.ordinal,
    tradeType: TradeType.buy,
    amount: 1,
    price: 0.062,
    totalValue: 0.062,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 12),
    status: "confirmed",
  },
  {
    id: "trade-3",
    asset: "UNCOMMON•GOODS",
    assetType: AssetType.rune,
    tradeType: TradeType.buy,
    amount: 1250,
    price: 0.00120,
    totalValue: 1.5,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 10),
    status: "confirmed",
  },
  {
    id: "trade-4",
    asset: "DOG•GO•TO•THE•MOON",
    assetType: AssetType.rune,
    tradeType: TradeType.sell,
    amount: 2000000,
    price: 0.00000068,
    totalValue: 1.36,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 8),
    status: "confirmed",
  },
  {
    id: "trade-5",
    asset: "Quantum Cats #88",
    assetType: AssetType.ordinal,
    tradeType: TradeType.buy,
    amount: 1,
    price: 0.18,
    totalValue: 0.18,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 7),
    status: "confirmed",
  },
  {
    id: "trade-6",
    asset: "RSIC•METAPROTOCOL",
    assetType: AssetType.rune,
    tradeType: TradeType.buy,
    amount: 88000,
    price: 0.00000200,
    totalValue: 0.176,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 6),
    status: "confirmed",
  },
  {
    id: "trade-7",
    asset: "BILLION•DOLLAR•CAT",
    assetType: AssetType.rune,
    tradeType: TradeType.sell,
    amount: 100000,
    price: 0.00000142,
    totalValue: 0.142,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 4),
    status: "confirmed",
  },
  {
    id: "trade-8",
    asset: "Ordinal Maxi Biz #512",
    assetType: AssetType.ordinal,
    tradeType: TradeType.buy,
    amount: 1,
    price: 0.095,
    totalValue: 0.095,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 3),
    status: "confirmed",
  },
  {
    id: "trade-9",
    asset: "PIZZA•NINJAS•RUNES",
    assetType: AssetType.rune,
    tradeType: TradeType.buy,
    amount: 3400,
    price: 0.000600,
    totalValue: 2.04,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 2),
    status: "confirmed",
  },
  {
    id: "trade-10",
    asset: "Bitcoin Frogs #222",
    assetType: AssetType.ordinal,
    tradeType: TradeType.buy,
    amount: 1,
    price: 0.014,
    totalValue: 0.014,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 1),
    status: "confirmed",
  },
  {
    id: "trade-11",
    asset: "SATOSHI•NAKAMOTO",
    assetType: AssetType.rune,
    tradeType: TradeType.buy,
    amount: 210,
    price: 0.001800,
    totalValue: 0.378,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 18),
    status: "confirmed",
  },
  {
    id: "trade-12",
    asset: "LOBO•THE•WOLF•PUP",
    assetType: AssetType.rune,
    tradeType: TradeType.sell,
    amount: 5000000,
    price: 0.00000020,
    totalValue: 1.0,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 12),
    status: "confirmed",
  },
  {
    id: "trade-13",
    asset: "DOG•GO•TO•THE•MOON",
    assetType: AssetType.rune,
    tradeType: TradeType.buy,
    amount: 5800000,
    price: 0.00000060,
    totalValue: 3.48,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 6),
    status: "confirmed",
  },
  {
    id: "trade-14",
    asset: "Bitmap #420420",
    assetType: AssetType.ordinal,
    tradeType: TradeType.buy,
    amount: 1,
    price: 0.0028,
    totalValue: 0.0028,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 60 * 2),
    status: "confirmed",
  },
  {
    id: "trade-15",
    asset: "WANKO•MANKO•RUNES",
    assetType: AssetType.rune,
    tradeType: TradeType.buy,
    amount: 14000000,
    price: 0.000000080,
    totalValue: 1.12,
    walletAddress: mockWallets[0].address,
    timestamp: BigInt(Date.now() - 1000 * 60 * 30),
    status: "pending",
  },
];

// ─── Watchlist ───────────────────────────────────────────────────
export const mockWatchlist: WatchlistItem[] = [
  {
    id: "watch-1",
    assetId: "840000:1",
    assetName: "BILLION•DOLLAR•CAT",
    assetType: AssetType.rune,
    targetPrice: 0.0000020,
    alertEnabled: true,
    addedAt: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: "watch-2",
    assetId: "col-3",
    assetName: "Quantum Cats",
    assetType: AssetType.ordinal,
    targetPrice: 0.40,
    alertEnabled: true,
    addedAt: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
  {
    id: "watch-3",
    assetId: "840006:1",
    assetName: "MEME•ECONOMICS",
    assetType: AssetType.rune,
    targetPrice: 0.000005,
    alertEnabled: false,
    addedAt: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 1),
  },
];

// ─── User Profile ────────────────────────────────────────────────
const mockPreferences: Preferences = {
  theme: "dark",
  notifications: true,
  currency: "USD",
};

const mockProfile: UserProfile = {
  principal: { toString: () => "abcde-fghij-klmno-pqrst-uvwxy-z2aaa-bbbbb-ccccc-ddddd-eeeee-fae" } as unknown as Principal,
  username: "miladymaxi",
  avatarUrl: "",
  createdAt: BigInt(Date.now() - 1000 * 60 * 60 * 24 * 180),
  preferences: mockPreferences,
};

// ─── Mock Backend Implementation ─────────────────────────────────
const wallets = [...mockWallets];
const runeHoldings = [...mockRuneHoldings];
const ordinals = [...mockOrdinals];
const trades = [...mockTrades];
const watchlist = [...mockWatchlist];
let profile = { ...mockProfile };

export const mockBackend: backendInterface = {
  async getMyWallets() {
    return wallets;
  },
  async addWallet(wallet) {
    wallets.push(wallet);
  },
  async getMyRuneHoldings() {
    return runeHoldings;
  },
  async addRuneHolding(rune) {
    runeHoldings.push(rune);
  },
  async getMyOrdinals() {
    return ordinals;
  },
  async addOrdinal(ordinal) {
    ordinals.push(ordinal);
  },
  async getMyTradeHistory() {
    return [...trades].sort((a, b) => Number(b.timestamp - a.timestamp));
  },
  async addTradeRecord(trade) {
    trades.push(trade);
  },
  async getPortfolioHistory() {
    return portfolioHistory;
  },
  async savePortfolioSnapshot(snapshot) {
    portfolioHistory.push(snapshot);
  },
  async getMyWatchlist() {
    return watchlist;
  },
  async addWatchlistItem(item) {
    watchlist.push(item);
  },
  async getMyProfile() {
    return profile;
  },
  async updateMyProfile(username, avatarUrl, preferences) {
    profile = { ...profile, username, avatarUrl, preferences };
  },
};

export const BTC_USD_PRICE = BTC_PRICE;
