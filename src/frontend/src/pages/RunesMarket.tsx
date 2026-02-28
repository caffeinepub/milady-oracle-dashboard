import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { WatchlistItem } from "../backend.d";
import { RuneRow } from "../components/RuneRow";
import { BTC_USD_PRICE, type MarketRune, marketRunes } from "../mocks/backend";

interface RunesMarketProps {
  watchlist: WatchlistItem[];
}

type SortKey = "priceChange24h" | "volume24h" | "marketCap" | "currentPrice";
type SortDir = "asc" | "desc";

// Mini sparkline data per rune (generated)
function generateSparkline(seed: number): { v: number }[] {
  const data: { v: number }[] = [];
  let v = 50 + seed * 10;
  for (let i = 0; i < 10; i++) {
    v += (Math.random() - 0.48) * 15;
    data.push({ v: Math.max(5, v) });
  }
  return data;
}

function MiniSparkline({
  data,
  positive,
}: { data: { v: number }[]; positive: boolean }) {
  return (
    <ResponsiveContainer width={60} height={28}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`spark-${positive}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={
                positive ? "oklch(0.78 0.18 142)" : "oklch(0.72 0.22 345)"
              }
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={
                positive ? "oklch(0.78 0.18 142)" : "oklch(0.72 0.22 345)"
              }
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Tooltip content={() => null} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={positive ? "oklch(0.78 0.18 142)" : "oklch(0.72 0.22 345)"}
          strokeWidth={1.5}
          fill={`url(#spark-${positive})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RunesMarket({ watchlist }: RunesMarketProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume24h");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [watchlisted, setWatchlisted] = useState<Set<string>>(
    new Set(
      watchlist.filter((w) => w.assetType === "rune").map((w) => w.assetId),
    ),
  );

  const sparklines = useMemo(
    () =>
      Object.fromEntries(
        marketRunes.map((r, i) => [r.runeId, generateSparkline(i)]),
      ),
    [],
  );

  const filtered = useMemo(() => {
    let list = [...marketRunes];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.runeName.toLowerCase().includes(q) ||
          r.symbol.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return list;
  }, [search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleWatchlist(runeId: string) {
    setWatchlisted((prev) => {
      const next = new Set(prev);
      if (next.has(runeId)) next.delete(runeId);
      else next.add(runeId);
      return next;
    });
  }

  // Stats bar
  const totalVol = marketRunes.reduce((s, r) => s + r.volume24h, 0);
  const gainers = marketRunes.filter((r) => r.priceChange24h > 0).length;
  const losers = marketRunes.length - gainers;

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Market overview strip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-3"
      >
        {[
          {
            label: "24h Volume",
            value: `${totalVol.toFixed(1)} BTC`,
            accent: "neon-text-cyan",
          },
          {
            label: "Gainers",
            value: gainers.toString(),
            accent: "neon-text-green",
          },
          {
            label: "Losers",
            value: losers.toString(),
            accent: "neon-text-pink",
          },
          {
            label: "BTC Price",
            value: `$${BTC_USD_PRICE.toLocaleString()}`,
            accent: "neon-text-btc",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded px-3 py-2 flex items-center gap-2"
          >
            <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
              {stat.label}
            </span>
            <span className={cn("text-xs font-mono font-bold", stat.accent)}>
              {stat.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Trending highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"
      >
        {marketRunes
          .sort((a, b) => b.priceChange24h - a.priceChange24h)
          .slice(0, 5)
          .map((rune: MarketRune) => {
            const isPos = rune.priceChange24h >= 0;
            return (
              <div
                key={rune.runeId}
                className={cn(
                  "rounded-lg border p-3 flex flex-col gap-1.5",
                  isPos
                    ? "border-green-400/20 bg-green-400/5"
                    : "border-accent/20 bg-accent/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center">
                    <span className="text-[7px] font-bold neon-text-cyan">
                      {rune.symbol.slice(0, 3)}
                    </span>
                  </div>
                  <MiniSparkline
                    data={sparklines[rune.runeId]}
                    positive={isPos}
                  />
                </div>
                <div className="text-[9px] font-mono text-foreground truncate">
                  {rune.runeName.split("•")[0]}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {(rune.currentPrice * 1e8).toFixed(0)} sats
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-mono font-bold flex items-center gap-0.5",
                      isPos ? "neon-text-green" : "neon-text-pink",
                    )}
                  >
                    {isPos ? (
                      <TrendingUp size={8} />
                    ) : (
                      <TrendingDown size={8} />
                    )}
                    {isPos ? "+" : ""}
                    {rune.priceChange24h.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
      </motion.div>

      {/* Main table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-lg"
      >
        {/* Table header + filters */}
        <div className="flex items-center justify-between gap-3 p-4 pb-3 border-b border-border/30">
          <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
            All Runes ({filtered.length})
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search runes..."
                className="pl-7 h-7 text-[11px] font-mono w-40 bg-muted/30 border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="flex gap-1">
              {(["volume24h", "priceChange24h", "marketCap"] as SortKey[]).map(
                (key) => {
                  const labels: Record<string, string> = {
                    volume24h: "VOL",
                    priceChange24h: "CHG",
                    marketCap: "MCAP",
                  };
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => toggleSort(key)}
                      className={cn(
                        "px-2 py-1 text-[9px] font-mono rounded border transition-colors",
                        sortKey === key
                          ? "border-primary/40 bg-primary/10 neon-text-cyan"
                          : "border-border/40 text-muted-foreground hover:border-border",
                      )}
                    >
                      {labels[key]}
                      {sortKey === key && (sortDir === "desc" ? " ↓" : " ↑")}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[20px_1fr_auto_auto_auto_auto] gap-2 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground/60 border-b border-border/20">
          <span>#</span>
          <span>Rune</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right hidden sm:block">Volume</span>
          <span className="text-center">★</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/20">
          {filtered.map((rune, i) => (
            <RuneRow
              key={rune.runeId}
              rune={rune}
              rank={i + 1}
              isWatchlisted={watchlisted.has(rune.runeId)}
              onWatchlist={() => toggleWatchlist(rune.runeId)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm font-mono">
              No runes match your search.
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default RunesMarket;
