import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bitcoin,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  OrdinalItem,
  PortfolioSnapshot,
  RuneHolding,
  TradeRecord,
  WalletRecord,
} from "../backend.d";
import { AssetType, TradeType } from "../backend.d";
import { PriceCard } from "../components/PriceCard";
import { BTC_USD_PRICE, marketRunes } from "../mocks/backend";

interface DashboardProps {
  connectedWallet: WalletRecord | null;
  runeHoldings: RuneHolding[];
  ordinals: OrdinalItem[];
  trades: TradeRecord[];
  portfolioHistory: PortfolioSnapshot[];
  onNavigate: (page: string) => void;
  onConnectWallet: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

function formatBtc(v: number): string {
  return `${v.toFixed(4)} BTC`;
}

function formatUsd(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(2)}K` : `$${v.toFixed(2)}`;
}

function timeAgo(ts: bigint): string {
  const diff = Date.now() - Number(ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Custom tooltip for recharts
interface TooltipPayload {
  value: number;
  dataKey: string;
}
function CustomTooltip({
  active,
  payload,
  label,
}: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded px-3 py-2 text-[10px] font-mono border border-primary/20">
      <div className="text-muted-foreground mb-1">{label}</div>
      <div className="neon-text-cyan">{payload[0]?.value?.toFixed(4)} BTC</div>
      <div className="text-muted-foreground">
        ${(Number(payload[0]?.value ?? 0) * BTC_USD_PRICE).toFixed(0)}
      </div>
    </div>
  );
}

export function Dashboard({
  connectedWallet,
  runeHoldings,
  ordinals,
  trades,
  portfolioHistory,
  onNavigate,
  onConnectWallet,
}: DashboardProps) {
  // Compute portfolio totals
  const totalRunesBtc = useMemo(
    () => runeHoldings.reduce((sum, r) => sum + r.amount * r.currentPrice, 0),
    [runeHoldings],
  );
  const totalOrdinalsBtc = useMemo(
    () => ordinals.reduce((sum, o) => sum + o.floorPrice, 0),
    [ordinals],
  );
  const totalBtc = totalRunesBtc + totalOrdinalsBtc;
  const totalUsd = totalBtc * BTC_USD_PRICE;

  // Chart data
  const chartData = useMemo(
    () =>
      portfolioHistory.slice(-14).map((s, i) => ({
        day: `D${i + 1}`,
        btc: Number.parseFloat(s.totalValueBtc.toFixed(4)),
        runes: Number.parseFloat(s.runesValueBtc.toFixed(4)),
        ordinals: Number.parseFloat(s.ordinalsValueBtc.toFixed(4)),
      })),
    [portfolioHistory],
  );

  const latestSnap = portfolioHistory[portfolioHistory.length - 1];
  const prevSnap = portfolioHistory[portfolioHistory.length - 2];
  const dayChange =
    latestSnap && prevSnap
      ? ((latestSnap.totalValueBtc - prevSnap.totalValueBtc) /
          prevSnap.totalValueBtc) *
        100
      : 0;

  // Top movers
  const movers = useMemo(
    () =>
      [...marketRunes]
        .sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h))
        .slice(0, 5),
    [],
  );

  // Recent trades
  const recentTrades = useMemo(
    () =>
      [...trades].sort((a, b) => Number(b.timestamp - a.timestamp)).slice(0, 5),
    [trades],
  );

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* Connect wallet banner */}
      {!connectedWallet && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-pink rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-semibold neon-text-pink">
              Connect your wallet
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect to see your personal portfolio, holdings, and trade
              history.
            </p>
          </div>
          <button
            type="button"
            onClick={onConnectWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors glow-cyan"
          >
            <Zap size={12} />
            CONNECT
          </button>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            title: "Total Portfolio",
            value: formatBtc(totalBtc),
            subValue: formatUsd(totalUsd),
            change: dayChange,
            changeLabel: "24h",
            accent: "cyan" as const,
          },
          {
            title: "Runes Value",
            value: formatBtc(totalRunesBtc),
            subValue: formatUsd(totalRunesBtc * BTC_USD_PRICE),
            change: latestSnap?.pnlDay ? latestSnap.pnlDay * 100 : 0,
            changeLabel: "24h",
            accent: "btc" as const,
          },
          {
            title: "Ordinals Value",
            value: formatBtc(totalOrdinalsBtc),
            subValue: `${ordinals.length} items`,
            accent: "pink" as const,
          },
          {
            title: "BTC Price",
            value: `$${BTC_USD_PRICE.toLocaleString()}`,
            subValue: "1 BTC",
            change: 2.4,
            changeLabel: "24h",
            accent: "green" as const,
          },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <PriceCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio chart - 2/3 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
                Portfolio History
              </h3>
              <p className="text-lg font-bold font-mono neon-text-cyan mt-0.5">
                {formatBtc(totalBtc)}
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-mono px-2 py-1 rounded",
                dayChange >= 0
                  ? "bg-green-400/10 neon-text-green"
                  : "bg-accent/10 neon-text-pink",
              )}
            >
              {dayChange >= 0 ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {dayChange >= 0 ? "+" : ""}
              {dayChange.toFixed(2)}%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.82 0.15 195)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.82 0.15 195)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{
                  fontSize: 9,
                  fill: "oklch(0.55 0.02 255)",
                  fontFamily: "Geist Mono",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 9,
                  fill: "oklch(0.55 0.02 255)",
                  fontFamily: "Geist Mono",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v.toFixed(1)}`}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="btc"
                stroke="oklch(0.82 0.15 195)"
                strokeWidth={2}
                fill="url(#cyanGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Movers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
              Top Movers
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("runes")}
              className="text-[10px] neon-text-cyan font-mono hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              ALL <ArrowRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {movers.map((rune) => {
              const isPos = rune.priceChange24h >= 0;
              return (
                <div
                  key={rune.runeId}
                  className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-primary/15 flex items-center justify-center">
                      <span className="text-[7px] font-bold neon-text-cyan">
                        {rune.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-foreground leading-tight truncate max-w-[100px]">
                        {rune.runeName.split("•")[0]}
                      </div>
                      <div className="text-[8px] text-muted-foreground">
                        {rune.symbol}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-[10px] font-mono",
                      isPos ? "neon-text-green" : "neon-text-pink",
                    )}
                  >
                    {isPos ? "+" : ""}
                    {rune.priceChange24h.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity + Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
              Recent Activity
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("activity")}
              className="text-[10px] neon-text-cyan font-mono hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              ALL <ArrowRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[8px] font-bold font-mono",
                    trade.tradeType === TradeType.buy
                      ? "bg-green-400/15 text-green-400"
                      : "bg-accent/15 neon-text-pink",
                  )}
                >
                  {trade.tradeType === TradeType.buy ? "BUY" : "SELL"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-foreground truncate">
                    {trade.asset}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={cn(
                        "text-[8px] px-1 rounded font-mono",
                        trade.assetType === AssetType.rune
                          ? "bg-primary/15 text-primary"
                          : "bg-accent/15 text-accent",
                      )}
                    >
                      {trade.assetType.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {timeAgo(trade.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-mono neon-text-btc">
                    {trade.totalValue.toFixed(4)} BTC
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
              Top Holdings
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("portfolio")}
              className="text-[10px] neon-text-cyan font-mono hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              ALL <ArrowRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {runeHoldings.slice(0, 5).map((rune) => {
              const value = rune.amount * rune.currentPrice;
              const pnl =
                ((rune.currentPrice - rune.avgBuyPrice) / rune.avgBuyPrice) *
                100;
              const isPos = pnl >= 0;
              return (
                <div
                  key={rune.id}
                  className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0"
                >
                  <div className="w-6 h-6 rounded bg-btc/15 border border-btc/20 flex items-center justify-center flex-shrink-0">
                    <Bitcoin size={12} className="neon-text-btc" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-foreground truncate">
                      {rune.runeName.split("•")[0]}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono">
                      {rune.amount.toLocaleString()} tokens
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-mono neon-text-btc">
                      {value.toFixed(4)} BTC
                    </div>
                    <div
                      className={cn(
                        "text-[9px] font-mono",
                        isPos ? "neon-text-green" : "neon-text-pink",
                      )}
                    >
                      {isPos ? "+" : ""}
                      {pnl.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default Dashboard;
