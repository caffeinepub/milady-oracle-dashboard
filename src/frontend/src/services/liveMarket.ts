import { type MarketRune, marketRunes } from "../mocks/backend";

export interface MarketDataStatus {
  source: "live" | "mock";
  updatedAt: number; // Date.now() timestamp
  error?: string;
}

interface HiroRuneItem {
  id: string;
  name: string;
  symbol: string;
  supply: string;
  mint_percentage?: number;
  market_data?: {
    price_in_btc?: number;
    volume_24h_btc?: number;
    market_cap_in_btc?: number;
    percent_change_24h?: number;
  };
}

interface HiroResponse {
  results: HiroRuneItem[];
}

interface CacheEntry {
  runes: MarketRune[];
  fetchedAt: number;
}

const CACHE_KEY = "milady_oracle_runes_cache";
const CACHE_TTL_MS = 60_000; // 60 seconds
const HIRO_URL =
  "https://api.hiro.so/runes/v1/etchings?offset=0&limit=20&order_by=market_cap&order=desc";

function mapHiroItem(item: HiroRuneItem): MarketRune {
  return {
    runeId: item.id,
    runeName: item.name,
    symbol: item.symbol,
    currentPrice: item.market_data?.price_in_btc ?? 0,
    priceChange24h: item.market_data?.percent_change_24h ?? 0,
    volume24h: item.market_data?.volume_24h_btc ?? 0,
    marketCap: item.market_data?.market_cap_in_btc ?? 0,
    supply: Number(item.supply),
    mintProgress: item.mint_percentage ?? 100,
  };
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable (private browsing, quota)
  }
}

// Module-level status for getCachedStatus()
let _lastStatus: MarketDataStatus | null = null;

/**
 * Fetches live Runes data from Hiro's public API.
 * Results are cached in localStorage for 60s.
 * Falls back to mock data if the fetch fails.
 */
export async function fetchLiveRunes(): Promise<{
  runes: MarketRune[];
  status: MarketDataStatus;
}> {
  // Check fresh cache first
  const cached = readCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    const status: MarketDataStatus = {
      source: "live",
      updatedAt: cached.fetchedAt,
    };
    _lastStatus = status;
    return { runes: cached.runes, status };
  }

  // Attempt live fetch
  try {
    const response = await fetch(HIRO_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Hiro API returned ${response.status}`);
    }

    const data = (await response.json()) as HiroResponse;

    const runes: MarketRune[] = (data.results ?? [])
      .map(mapHiroItem)
      .filter((r) => r.currentPrice > 0);

    if (runes.length === 0) {
      throw new Error("Hiro returned no runes with market data");
    }

    const fetchedAt = Date.now();
    writeCache({ runes, fetchedAt });

    const status: MarketDataStatus = { source: "live", updatedAt: fetchedAt };
    _lastStatus = status;
    return { runes, status };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const status: MarketDataStatus = {
      source: "mock",
      updatedAt: Date.now(),
      error: errorMessage,
    };
    _lastStatus = status;
    return { runes: marketRunes, status };
  }
}

/**
 * Returns the last known data source status, or null if no fetch has
 * been attempted yet in this session.
 */
export function getCachedStatus(): MarketDataStatus | null {
  return _lastStatus;
}
