import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Filter,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { TradeRecord } from "../backend.d";
import { AssetType, TradeType } from "../backend.d";
import { BTC_USD_PRICE } from "../mocks/backend";

interface ActivityFeedProps {
  trades: TradeRecord[];
}

type ActivityFilter = "all" | "buy" | "sell" | "rune" | "ordinal";

function timeAgo(ts: bigint): string {
  const diff = Date.now() - Number(ts);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function ActivityFeed({ trades }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");

  const filtered = trades
    .slice()
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .filter((t) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "buy") return t.tradeType === TradeType.buy;
      if (activeFilter === "sell") return t.tradeType === TradeType.sell;
      if (activeFilter === "rune") return t.assetType === AssetType.rune;
      if (activeFilter === "ordinal") return t.assetType === AssetType.ordinal;
      return true;
    });

  const totalBought = trades
    .filter((t) => t.tradeType === TradeType.buy)
    .reduce((s, t) => s + t.totalValue, 0);
  const totalSold = trades
    .filter((t) => t.tradeType === TradeType.sell)
    .reduce((s, t) => s + t.totalValue, 0);

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Header stats */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Total Transactions",
            value: trades.length.toString(),
            accent: "neon-text-cyan",
          },
          {
            label: "Total Bought",
            value: `${totalBought.toFixed(3)} BTC`,
            accent: "neon-text-green",
          },
          {
            label: "Total Sold",
            value: `${totalSold.toFixed(3)} BTC`,
            accent: "neon-text-pink",
          },
          {
            label: "Net Flow",
            value: `${(totalBought - totalSold) >= 0 ? "+" : ""}${(totalBought - totalSold).toFixed(3)} BTC`,
            accent:
              totalBought - totalSold >= 0
                ? "neon-text-green"
                : "neon-text-pink",
          },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-mono mb-1">
              {s.label}
            </div>
            <div className={cn("text-sm font-mono font-bold", s.accent)}>
              {s.value}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2"
      >
        <Filter size={12} className="text-muted-foreground" />
        <div className="flex gap-1.5">
          {(["all", "buy", "sell", "rune", "ordinal"] as ActivityFilter[]).map(
            (f) => (
              <button
                type="button"
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.1em] rounded border transition-colors",
                  activeFilter === f
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:border-border",
                )}
              >
                {f}
              </button>
            ),
          )}
        </div>
        <span className="ml-auto text-[9px] text-muted-foreground font-mono">
          {filtered.length} transactions
        </span>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />

        <div className="space-y-3">
          {filtered.map((trade, i) => {
            const isBuy = trade.tradeType === TradeType.buy;
            const isRune = trade.assetType === AssetType.rune;
            return (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-4 pl-1"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 z-10 relative",
                    isBuy
                      ? "bg-green-400/10 border-green-400/30 text-green-400"
                      : "bg-accent/10 border-accent/30 text-accent",
                  )}
                >
                  {isBuy ? (
                    <ArrowDownLeft size={14} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 glass-card rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[8px] h-4 px-1.5 font-mono border",
                          isBuy
                            ? "border-green-400/40 text-green-400 bg-green-400/10"
                            : "border-accent/40 text-accent bg-accent/10",
                        )}
                      >
                        {isBuy ? "BUY" : "SELL"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[8px] h-4 px-1.5 font-mono border",
                          isRune
                            ? "border-primary/40 text-primary bg-primary/10"
                            : "border-muted-foreground/30 text-muted-foreground",
                        )}
                      >
                        {trade.assetType.toUpperCase()}
                      </Badge>
                      <span
                        className={cn(
                          "text-[9px] px-1 py-0.5 rounded text-xs font-mono",
                          trade.status === "confirmed"
                            ? "text-green-400/70"
                            : trade.status === "pending"
                              ? "text-yellow-400/70"
                              : "text-muted-foreground",
                        )}
                      >
                        {trade.status === "confirmed" ? "✓" : "⏳"}{" "}
                        {trade.status}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] font-mono neon-text-btc font-bold">
                        {trade.totalValue.toFixed(4)} BTC
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono">
                        ${(trade.totalValue * BTC_USD_PRICE).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs font-mono text-foreground">
                      {trade.asset}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <div className="text-[9px] font-mono text-muted-foreground">
                        <span className="text-muted-foreground/60">
                          Amount:
                        </span>{" "}
                        {trade.amount.toLocaleString()}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground">
                        <span className="text-muted-foreground/60">Price:</span>{" "}
                        {trade.price.toFixed(8)} BTC
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground">
                        <span className="text-muted-foreground/60">
                          Wallet:
                        </span>{" "}
                        {truncateAddress(trade.walletAddress)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-[8px] text-muted-foreground/50 font-mono">
                    <Clock size={8} />
                    <span>{formatDate(trade.timestamp)}</span>
                    <span className="ml-1">({timeAgo(trade.timestamp)})</span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm font-mono">
              No transactions match the selected filter.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default ActivityFeed;
