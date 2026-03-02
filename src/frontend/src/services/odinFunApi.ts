import type { MarketRune } from "../mocks/backend";

// ── Constants ─────────────────────────────────────────────────────────────────

const ODIN_BASE_URL = "https://api.odin.fun/v1";

/** 30-second TTL for in-memory cache */
export const ODIN_CACHE_TTL = 30_000;

// ── Data status type ──────────────────────────────────────────────────────────

export interface OdinDataStatus {
  source: "live" | "mock";
  updatedAt: number;
  error?: string;
}

// ── API types ─────────────────────────────────────────────────────────────────

export interface OdinToken {
  id: string;
  name: string;
  ticker: string;
  rune?: string;
  /** Price in raw units — multiply × 0.001 to get satoshis, × 0.001 / 1e8 to get BTC */
  price?: number;
  /** Price 24 h ago in raw units */
  price_24h?: number;
  /** Volume in raw units */
  volume?: number;
  /** Market cap in raw units */
  marketcap?: number;
  supply?: number;
  holders?: number;
  /** Creator's principal */
  creator?: string;
  description?: string;
  image?: string;
  created_time?: number;
  last_tx_time?: number;
  btc_liquidity?: number;
  token_liquidity?: number;
  comment_count?: number;
}

export interface OdinFeedCandle {
  time: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  /** Alias for close in some resolutions */
  price?: number;
  volume?: number;
}

export interface OdinTrade {
  id?: string;
  token?: string;
  user?: string;
  /** buy | sell */
  side?: string;
  btc?: number;
  amount?: number;
  price?: number;
  time?: number;
  timestamp?: number;
}

export interface OdinBtcPrice {
  price: number;
}

export interface OdinDashboardStats {
  total_tokens?: number;
  total_volume?: number;
  total_users?: number;
  active_tokens?: number;
  volume_24h?: number;
  tx_count_24h?: number;
}

export interface OdinTokensResponse {
  data?: OdinToken[];
  total?: number;
  page?: number;
  limit?: number;
}

// ── Price conversion helpers ──────────────────────────────────────────────────

/** Convert raw Odin price units to satoshis (multiply × 0.001) */
export function odinRawToSats(raw: number): number {
  return raw * 0.001;
}

/** Convert raw Odin price units to BTC (multiply × 0.001 / 1e8) */
export function odinRawToBtc(raw: number): number {
  return (raw * 0.001) / 1e8;
}

// ── Token → MarketRune mapper ─────────────────────────────────────────────────

export function mapOdinTokenToRune(
  t: OdinToken,
  btcUsdPrice?: number,
): MarketRune {
  const priceBtc = odinRawToBtc(t.price ?? 0);
  const price24hBtc = odinRawToBtc(t.price_24h ?? 0);
  const priceChange24h =
    price24hBtc > 0 ? ((priceBtc - price24hBtc) / price24hBtc) * 100 : 0;
  const volumeBtc = odinRawToBtc(t.volume ?? 0);
  const marketCapBtc = odinRawToBtc(t.marketcap ?? 0);
  void btcUsdPrice; // available for future USD conversion

  return {
    runeId: t.id,
    runeName: t.name ?? t.ticker ?? t.id,
    symbol: t.ticker ?? t.id.slice(0, 4).toUpperCase(),
    currentPrice: priceBtc,
    priceChange24h,
    volume24h: volumeBtc,
    marketCap: marketCapBtc,
    supply: t.supply ?? 0,
    mintProgress: 100,
  };
}

// ── In-memory cache ───────────────────────────────────────────────────────────

interface CacheEntry {
  data: unknown;
  ts: number;
}

const _cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ODIN_CACHE_TTL) {
    _cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  _cache.set(key, { data, ts: Date.now() });
}

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function odinFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${ODIN_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Odin.Fun API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

// ── Public API functions ──────────────────────────────────────────────────────

/** Fetch the token list, sorted by marketcap by default */
export async function fetchOdinTokens(params?: {
  sort?: string;
  limit?: number;
  search?: string;
  page?: number;
}): Promise<OdinTokensResponse> {
  const qs = new URLSearchParams();
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  if (params?.page != null) qs.set("page", String(params.page));
  const query = qs.toString();
  const path = `/tokens${query ? `?${query}` : ""}`;

  const cached = getCached<OdinTokensResponse>(path);
  if (cached) return cached;

  const result = await odinFetch<OdinTokensResponse>(path);
  setCache(path, result);
  return result;
}

/** Fetch a single token by its ID */
export async function fetchOdinToken(id: string): Promise<OdinToken> {
  const path = `/token/${id}`;
  const cached = getCached<OdinToken>(path);
  if (cached) return cached;

  const result = await odinFetch<OdinToken>(path);
  setCache(path, result);
  return result;
}

/** Fetch OHLCV feed (candlestick data) for a token */
export async function fetchOdinTokenFeed(
  id: string,
  params?: { resolution?: number; last?: number },
): Promise<OdinFeedCandle[]> {
  const qs = new URLSearchParams();
  if (params?.resolution != null)
    qs.set("resolution", String(params.resolution));
  if (params?.last != null) qs.set("last", String(params.last));
  const query = qs.toString();
  const path = `/token/${id}/feed${query ? `?${query}` : ""}`;

  const cached = getCached<OdinFeedCandle[]>(path);
  if (cached) return cached;

  const result = await odinFetch<OdinFeedCandle[]>(path);
  setCache(path, result);
  return result;
}

/** Fetch recent trades for a token */
export async function fetchOdinTokenTrades(
  id: string,
  limit?: number,
): Promise<OdinTrade[]> {
  const path = `/token/${id}/trades${limit != null ? `?limit=${limit}` : ""}`;
  const cached = getCached<OdinTrade[]>(path);
  if (cached) return cached;

  const result = await odinFetch<OdinTrade[]>(path);
  setCache(path, result);
  return result;
}

/**
 * Fetch ALL tokens from Odin.Fun by paginating through every page.
 * Uses a page size of 50 and stops when a page returns fewer items than
 * requested or when the running total reaches the reported `total` count.
 * Caps at 20 pages (1000 tokens) as a safety limit.
 */
export async function fetchAllOdinTokens(params?: {
  sort?: string;
}): Promise<OdinTokensResponse> {
  const PAGE_SIZE = 50;
  const MAX_PAGES = 20;
  const allTokens: OdinToken[] = [];
  let page = 1;
  let reportedTotal: number | undefined;

  while (page <= MAX_PAGES) {
    let result: OdinTokensResponse;
    try {
      result = await fetchOdinTokens({
        sort: params?.sort ?? "marketcap:desc",
        limit: PAGE_SIZE,
        page,
      });
    } catch {
      break;
    }

    const items: OdinToken[] =
      result.data ?? (Array.isArray(result) ? (result as OdinToken[]) : []);

    if (items.length === 0) break;

    allTokens.push(...items);

    if (reportedTotal === undefined && result.total != null) {
      reportedTotal = result.total;
    }

    // Stop if we fetched everything or got a partial page
    if (
      items.length < PAGE_SIZE ||
      (reportedTotal != null && allTokens.length >= reportedTotal)
    ) {
      break;
    }

    page++;
  }

  return {
    data: allTokens,
    total: reportedTotal ?? allTokens.length,
    page: 1,
    limit: allTokens.length,
  };
}

/** Fetch the current BTC price in USD */
export async function fetchOdinBtcPrice(): Promise<OdinBtcPrice> {
  const path = "/currency/btc";
  const cached = getCached<OdinBtcPrice>(path);
  if (cached) return cached;

  const result = await odinFetch<OdinBtcPrice>(path);
  setCache(path, result);
  return result;
}

/** Fetch Odin.Fun dashboard statistics */
export async function fetchOdinDashboardStats(): Promise<OdinDashboardStats> {
  const path = "/statistics/dashboard";
  const cached = getCached<OdinDashboardStats>(path);
  if (cached) return cached;

  const result = await odinFetch<OdinDashboardStats>(path);
  setCache(path, result);
  return result;
}
