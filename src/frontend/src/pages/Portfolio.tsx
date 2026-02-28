import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OrdinalItem, PortfolioSnapshot, RuneHolding } from "../backend.d";
import { BTC_USD_PRICE } from "../mocks/backend";

interface PortfolioProps {
  runeHoldings: RuneHolding[];
  ordinals: OrdinalItem[];
  portfolioHistory: PortfolioSnapshot[];
}

interface TooltipPayload {
  value: number;
}

function ChartTooltip({
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
        ${((payload[0]?.value ?? 0) * BTC_USD_PRICE).toFixed(0)}
      </div>
    </div>
  );
}

export function Portfolio({
  runeHoldings,
  ordinals,
  portfolioHistory,
}: PortfolioProps) {
  const totalRunesBtc = useMemo(
    () => runeHoldings.reduce((sum, r) => sum + r.amount * r.currentPrice, 0),
    [runeHoldings],
  );
  const totalOrdinalsBtc = useMemo(
    () => ordinals.reduce((sum, o) => sum + o.floorPrice, 0),
    [ordinals],
  );
  const totalBtc = totalRunesBtc + totalOrdinalsBtc;

  const chartData = portfolioHistory.slice(-30).map((s, i) => ({
    day: `D${i + 1}`,
    total: Number.parseFloat(s.totalValueBtc.toFixed(4)),
    runes: Number.parseFloat(s.runesValueBtc.toFixed(4)),
    ordinals: Number.parseFloat(s.ordinalsValueBtc.toFixed(4)),
  }));

  const pieData = [
    { name: "Runes", value: totalRunesBtc, color: "oklch(0.82 0.15 195)" },
    {
      name: "Ordinals",
      value: totalOrdinalsBtc,
      color: "oklch(0.72 0.22 345)",
    },
  ];

  const latestSnap = portfolioHistory[portfolioHistory.length - 1];

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Value",
            value: `${totalBtc.toFixed(4)} BTC`,
            sub: `$${(totalBtc * BTC_USD_PRICE).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            accent: "cyan" as const,
          },
          {
            label: "Runes",
            value: `${totalRunesBtc.toFixed(4)} BTC`,
            sub: `${runeHoldings.length} positions`,
            accent: "btc" as const,
          },
          {
            label: "Ordinals",
            value: `${totalOrdinalsBtc.toFixed(4)} BTC`,
            sub: `${ordinals.length} items`,
            accent: "pink" as const,
          },
          {
            label: "30d PnL",
            value: latestSnap
              ? `${(latestSnap.pnlMonth * 100).toFixed(1)}%`
              : "N/A",
            sub: latestSnap
              ? `${latestSnap.pnlMonth >= 0 ? "+" : ""}${(latestSnap.pnlMonth * totalBtc).toFixed(4)} BTC`
              : "",
            accent:
              latestSnap?.pnlMonth >= 0
                ? ("green" as const)
                : ("pink" as const),
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card rounded-lg p-4"
          >
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono mb-1.5">
              {card.label}
            </div>
            <div
              className={cn(
                "text-xl font-bold font-mono",
                card.accent === "cyan" && "neon-text-cyan",
                card.accent === "btc" && "neon-text-btc",
                card.accent === "pink" && "neon-text-pink",
                card.accent === "green" && "neon-text-green",
              )}
            >
              {card.value}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {card.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card rounded-lg p-4"
        >
          <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-4">
            30-Day Portfolio History
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.82 0.15 195)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.82 0.15 195)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="runesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.78 0.17 50)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.78 0.17 50)"
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
                interval={4}
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
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="oklch(0.82 0.15 195)"
                strokeWidth={2}
                fill="url(#totalGrad)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="runes"
                stroke="oklch(0.78 0.17 50)"
                strokeWidth={1.5}
                fill="url(#runesGrad)"
                dot={false}
                strokeDasharray="4 2"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-primary rounded" />
              <span className="text-[9px] text-muted-foreground font-mono">
                Total
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded"
                style={{ background: "oklch(0.78 0.17 50)" }}
              />
              <span className="text-[9px] text-muted-foreground font-mono">
                Runes
              </span>
            </div>
          </div>
        </motion.div>

        {/* Pie */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-lg p-4 flex flex-col"
        >
          <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Allocation
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2 w-full">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-foreground">
                    {totalBtc > 0
                      ? ((d.value / totalBtc) * 100).toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Holdings Tables */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-lg"
      >
        <Tabs defaultValue="runes">
          <div className="flex items-center justify-between px-4 pt-4 pb-0">
            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
              Holdings
            </h3>
            <TabsList className="bg-muted/40 h-7">
              <TabsTrigger value="runes" className="text-[10px] h-5.5 px-3">
                Runes ({runeHoldings.length})
              </TabsTrigger>
              <TabsTrigger value="ordinals" className="text-[10px] h-5.5 px-3">
                Ordinals ({ordinals.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="runes" className="p-4 pt-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground/60 border-b border-border/30 mb-1">
              <span>Rune</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Avg Buy</span>
              <span className="text-right">Current</span>
              <span className="text-right">PnL</span>
            </div>
            <div className="space-y-0.5">
              {runeHoldings.map((rune) => {
                const value = rune.amount * rune.currentPrice;
                const pnl =
                  ((rune.currentPrice - rune.avgBuyPrice) / rune.avgBuyPrice) *
                  100;
                const isPos = pnl >= 0;
                return (
                  <div
                    key={rune.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-2 py-2 rounded hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <div className="text-[11px] font-mono text-foreground">
                        {rune.runeName}
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono neon-text-btc">
                        {value.toFixed(4)} BTC
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-foreground">
                        {rune.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {(rune.avgBuyPrice * 1e8).toFixed(0)} sats
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono neon-text-cyan">
                        {(rune.currentPrice * 1e8).toFixed(0)} sats
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-[10px] font-mono flex items-center justify-end gap-0.5",
                          isPos ? "neon-text-green" : "neon-text-pink",
                        )}
                      >
                        {isPos ? (
                          <TrendingUp size={9} />
                        ) : (
                          <TrendingDown size={9} />
                        )}
                        {isPos ? "+" : ""}
                        {pnl.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="ordinals" className="p-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ordinals.map((ordinal) => {
                const pnl =
                  ((ordinal.floorPrice - ordinal.acquiredPrice) /
                    ordinal.acquiredPrice) *
                  100;
                const isPos = pnl >= 0;
                return (
                  <div
                    key={ordinal.id}
                    className="rounded-lg border border-border/40 overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    <div className="aspect-square bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center">
                      <div className="text-3xl opacity-60">🖼</div>
                    </div>
                    <div className="p-2.5">
                      <div className="text-[10px] font-mono text-foreground truncate">
                        {ordinal.name}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {ordinal.collectionName}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="text-[10px] font-mono neon-text-btc">
                          {ordinal.floorPrice} BTC
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
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}

export default Portfolio;
