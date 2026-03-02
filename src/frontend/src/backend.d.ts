import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WalletRecord {
    id: string;
    walletType: WalletType;
    isConnected: boolean;
    addedAt: Time;
    address: string;
    walletLabel: string;
}
export interface RuneHolding {
    id: string;
    currentPrice: number;
    runeId: string;
    walletAddress: string;
    runeName: string;
    avgBuyPrice: number;
    amount: number;
}
export type Time = bigint;
export interface PortfolioSnapshot {
    id: string;
    ordinalsValueBtc: number;
    totalValueBtc: number;
    totalValueUsd: number;
    pnlDay: number;
    pnlWeek: number;
    timestamp: Time;
    pnlMonth: number;
    runesValueBtc: number;
}
export interface Preferences {
    theme: string;
    notifications: boolean;
    currency: string;
}
export interface TradeRecord {
    id: string;
    status: string;
    asset: string;
    tradeType: TradeType;
    totalValue: number;
    walletAddress: string;
    timestamp: Time;
    assetType: AssetType;
    price: number;
    amount: number;
}
export interface WatchlistItem {
    id: string;
    assetId: string;
    alertEnabled: boolean;
    targetPrice: number;
    addedAt: Time;
    assetName: string;
    assetType: AssetType;
}
export interface UserProfile {
    principal: Principal;
    username: string;
    createdAt: Time;
    preferences: Preferences;
    avatarUrl: string;
}
export interface OrdinalItem {
    id: string;
    name: string;
    acquiredPrice: number;
    floorPrice: number;
    walletAddress: string;
    imageUrl: string;
    inscriptionId: string;
    collectionName: string;
}
export enum AssetType {
    rune = "rune",
    ordinal = "ordinal"
}
export enum TradeType {
    buy = "buy",
    sell = "sell"
}
export enum WalletType {
    okx = "okx",
    xverse = "xverse",
    oisy = "oisy",
    plug = "plug",
    magicEden = "magicEden",
    unisat = "unisat",
    bioniq = "bioniq"
}
export interface backendInterface {
    addOrdinal(ordinal: OrdinalItem): Promise<void>;
    addRuneHolding(rune: RuneHolding): Promise<void>;
    addTradeRecord(trade: TradeRecord): Promise<void>;
    addWallet(wallet: WalletRecord): Promise<void>;
    addWatchlistItem(item: WatchlistItem): Promise<void>;
    createProfile(username: string, avatarUrl: string): Promise<void>;
    getMyOrdinals(): Promise<Array<OrdinalItem>>;
    getMyProfile(): Promise<UserProfile>;
    getMyRuneHoldings(): Promise<Array<RuneHolding>>;
    getMyTradeHistory(): Promise<Array<TradeRecord>>;
    getMyWallets(): Promise<Array<WalletRecord>>;
    getMyWatchlist(): Promise<Array<WatchlistItem>>;
    getPortfolioHistory(): Promise<Array<PortfolioSnapshot>>;
    savePortfolioSnapshot(snapshot: PortfolioSnapshot): Promise<void>;
    updateMyProfile(username: string, avatarUrl: string, preferences: Preferences): Promise<void>;
}
