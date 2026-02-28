import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { AssetType, TradeType } from "../backend.d";
import type { TradeRecord } from "../backend.d";
import { BTC_USD_PRICE, marketRunes, mockTrades } from "../mocks/backend";

interface PricePoint {
  time: string;
  price: number;
  open: number;
  close: number;
}
interface OrderEntry {
  price: number;
  amount: number;
  total: number;
}

// Generate a fake price chart
function generatePriceChart(basePrice: number): PricePoint[] {
  const data: PricePoint[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = 48; i >= 0; i--) {
    const ts = now - i * 30 * 60 * 1000;
    price = price * (1 + (Math.random() - 0.49) * 0.04);
    data.push({
      time: new Date(ts).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      price: Number.parseFloat(price.toFixed(8)),
      open: Number.parseFloat((price * 0.998).toFixed(8)),
      close: Number.parseFloat((price * 1.002).toFixed(8)),
    });
  }
  return data;
}

// Generate order book
function generateOrderBook(midPrice: number) {
  const asks: OrderEntry[] = [];
  const bids: OrderEntry[] = [];
  for (let i = 1; i <= 12; i++) {
    asks.push({
      price: Number.parseFloat((midPrice * (1 + i * 0.004)).toFixed(8)),
      amount: Number.parseFloat((Math.random() * 500000 + 50000).toFixed(0)),
      total: 0,
    });
    bids.push({
      price: Number.parseFloat((midPrice * (1 - i * 0.004)).toFixed(8)),
      amount: Number.parseFloat((Math.random() * 500000 + 50000).toFixed(0)),
      total: 0,
    });
  }
  return { asks: asks.sort((a, b) => a.price - b.price), bids };
}

interface ChartTooltipPayload {
  value: number;
  dataKey: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: { active?: boolean; payload?: ChartTooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded px-2 py-1.5 text-[9px] font-mono border border-primary/20">
      <div className="text-muted-foreground">{label}</div>
      <div className="neon-text-cyan">{payload[0]?.value?.toFixed(8)} BTC</div>
    </div>
  );
}

export function OdinTrading() {
  const [selectedRune, setSelectedRune] = useState(marketRunes[0]);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState(marketRunes[0].currentPrice.toFixed(8));
  const [isLoading, setIsLoading] = useState(false);

  const chartData = useMemo(
    () => generatePriceChart(selectedRune.currentPrice),
    [selectedRune],
  );
  const orderBook = useMemo(
    () => generateOrderBook(selectedRune.currentPrice),
    [selectedRune],
  );

  const totalCost = Number(amount || 0) * Number(price || 0);
  const isPositive = selectedRune.priceChange24h >= 0;

  const recentTrades = useMemo(
    () =>
      mockTrades
        .filter((t) => t.assetType === AssetType.rune)
        .slice(0, 8)
        .map((t) => ({
          ...t,
          displayPrice: (t.totalValue / (t.amount || 1)).toFixed(8),
        })),
    [],
  );

  function handleSelectRune(rune: (typeof marketRunes)[0]) {
    setSelectedRune(rune);
    setPrice(rune.currentPrice.toFixed(8));
  }

  async function handleTrade() {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    toast.success(
      `${tradeType === "buy" ? "Buy" : "Sell"} order placed: ${Number(amount).toLocaleString()} ${selectedRune.symbol} @ ${Number(price).toFixed(8)} BTC`,
    );
    setAmount("");
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
      {/* Odin.Fun header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className="neon-text-cyan" />
          <h2 className="font-display font-bold text-sm tracking-wide neon-text-cyan">
            ODIN.FUN
          </h2>
        </div>
        <div className="w-px h-4 bg-border" />
        <p className="text-xs text-muted-foreground">
          Rune trading on Internet Computer
        </p>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[9px] h-4 border-green-400/30 text-green-400 bg-green-400/10"
          >
            ● LIVE
          </Badge>
          <Badge
            variant="outline"
            className="text-[9px] h-4 border-primary/30 text-primary bg-primary/10"
          >
            ICP
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_280px] gap-3">
        {/* Rune selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-lg p-2 flex flex-col"
        >
          <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-mono px-1 mb-1.5 pb-1 border-b border-border/30">
            Markets
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[40vh] lg:max-h-full">
            {marketRunes.map((rune) => {
              const isPos = rune.priceChange24h >= 0;
              return (
                <button
                  type="button"
                  key={rune.runeId}
                  onClick={() => handleSelectRune(rune)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors",
                    selectedRune.runeId === rune.runeId
                      ? "bg-primary/15 border border-primary/25"
                      : "hover:bg-muted/30",
                  )}
                >
                  <div>
                    <div className="text-[9px] font-mono text-foreground">
                      {rune.symbol}
                    </div>
                    <div
                      className={cn(
                        "text-[8px] font-mono",
                        isPos ? "neon-text-green" : "neon-text-pink",
                      )}
                    >
                      {isPos ? "+" : ""}
                      {rune.priceChange24h.toFixed(1)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Chart + info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-lg p-4 flex flex-col"
        >
          {/* Ticker */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                {selectedRune.runeName}
              </h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-lg font-mono font-bold neon-text-cyan">
                  {(selectedRune.currentPrice * 1e8).toFixed(0)} sats
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ${(selectedRune.currentPrice * BTC_USD_PRICE).toFixed(6)}
                </span>
                <span
                  className={cn(
                    "text-xs font-mono flex items-center gap-1",
                    isPositive ? "neon-text-green" : "neon-text-pink",
                  )}
                >
                  {isPositive ? (
                    <TrendingUp size={11} />
                  ) : (
                    <TrendingDown size={11} />
                  )}
                  {isPositive ? "+" : ""}
                  {selectedRune.priceChange24h.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
              <div>
                <div className="text-muted-foreground/60">24h Vol</div>
                <div className="text-foreground">
                  {selectedRune.volume24h.toFixed(2)} BTC
                </div>
              </div>
              <div>
                <div className="text-muted-foreground/60">MCap</div>
                <div className="text-foreground">
                  {selectedRune.marketCap.toFixed(0)} BTC
                </div>
              </div>
            </div>
          </div>

          {/* Price chart */}
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 8,
                    fill: "oklch(0.55 0.02 255)",
                    fontFamily: "Geist Mono",
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval={8}
                />
                <YAxis
                  tick={{
                    fontSize: 8,
                    fill: "oklch(0.55 0.02 255)",
                    fontFamily: "Geist Mono",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v * 1e8).toFixed(0)}`}
                  width={45}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine
                  y={selectedRune.currentPrice}
                  stroke="oklch(0.82 0.15 195 / 0.3)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={
                    isPositive ? "oklch(0.78 0.18 142)" : "oklch(0.72 0.22 345)"
                  }
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: "oklch(0.82 0.15 195)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Order book snippet */}
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60 font-mono mb-1">
                  Asks
                </div>
                <div className="space-y-0.5">
                  {orderBook.asks.slice(0, 5).map((ask) => (
                    <div
                      key={`ask-${ask.price}`}
                      className="flex justify-between text-[9px] font-mono"
                    >
                      <span className="neon-text-pink">
                        {(ask.price * 1e8).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">
                        {(ask.amount / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60 font-mono mb-1">
                  Bids
                </div>
                <div className="space-y-0.5">
                  {orderBook.bids.slice(0, 5).map((bid) => (
                    <div
                      key={`bid-${bid.price}`}
                      className="flex justify-between text-[9px] font-mono"
                    >
                      <span className="neon-text-green">
                        {(bid.price * 1e8).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">
                        {(bid.amount / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trade form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-3"
        >
          {/* Buy/Sell form */}
          <div className="glass-card rounded-lg p-4">
            <Tabs
              value={tradeType}
              onValueChange={(v) => setTradeType(v as "buy" | "sell")}
            >
              <TabsList className="w-full bg-muted/40 mb-3">
                <TabsTrigger
                  value="buy"
                  className="flex-1 text-xs data-[state=active]:text-green-400"
                >
                  BUY
                </TabsTrigger>
                <TabsTrigger
                  value="sell"
                  className="flex-1 text-xs data-[state=active]:neon-text-pink data-[state=active]:text-accent"
                >
                  SELL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-3 mt-0">
                <TradeForm
                  rune={selectedRune}
                  tradeType="buy"
                  amount={amount}
                  price={price}
                  totalCost={totalCost}
                  onAmountChange={setAmount}
                  onPriceChange={setPrice}
                  onSubmit={handleTrade}
                  isLoading={isLoading}
                />
              </TabsContent>
              <TabsContent value="sell" className="space-y-3 mt-0">
                <TradeForm
                  rune={selectedRune}
                  tradeType="sell"
                  amount={amount}
                  price={price}
                  totalCost={totalCost}
                  onAmountChange={setAmount}
                  onPriceChange={setPrice}
                  onSubmit={handleTrade}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Recent trades */}
          <div className="glass-card rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-mono mb-2">
              Recent Trades
            </div>
            <div className="space-y-1">
              {recentTrades.slice(0, 6).map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between text-[9px] font-mono"
                >
                  <span
                    className={cn(
                      trade.tradeType === TradeType.buy
                        ? "neon-text-green"
                        : "neon-text-pink",
                    )}
                  >
                    {trade.tradeType === TradeType.buy ? "BUY" : "SELL"}
                  </span>
                  <span className="text-muted-foreground truncate max-w-[70px]">
                    {trade.asset.split("•")[0]}
                  </span>
                  <span className="neon-text-btc">
                    {trade.totalValue.toFixed(3)} BTC
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

interface TradeFormProps {
  rune: (typeof marketRunes)[0];
  tradeType: "buy" | "sell";
  amount: string;
  price: string;
  totalCost: number;
  onAmountChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

function TradeForm({
  rune,
  tradeType,
  amount,
  price,
  totalCost,
  onAmountChange,
  onPriceChange,
  onSubmit,
  isLoading,
}: TradeFormProps) {
  const isBuy = tradeType === "buy";
  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="amount-input"
          className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-mono block mb-1"
        >
          Amount ({rune.symbol})
        </label>
        <Input
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0"
          type="number"
          className="h-8 text-xs font-mono bg-muted/30 border-border/50 focus:border-primary/50"
        />
        <div className="flex gap-1 mt-1.5">
          {["25%", "50%", "75%", "MAX"].map((pct) => (
            <button
              type="button"
              key={pct}
              onClick={() => {
                const baseAmount = isBuy ? 100000 : 50000;
                const mult = pct === "MAX" ? 1 : Number.parseInt(pct) / 100;
                onAmountChange((baseAmount * mult).toFixed(0));
              }}
              className="flex-1 py-0.5 text-[8px] font-mono rounded border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
            >
              {pct}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-mono">
            Price (BTC)
          </span>
          <button
            type="button"
            onClick={() => onPriceChange(rune.currentPrice.toFixed(8))}
            className="text-[8px] neon-text-cyan font-mono flex items-center gap-1 hover:opacity-70"
          >
            <RefreshCw size={8} /> Market
          </button>
        </div>
        <Input
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder="0.00000000"
          type="number"
          className="h-8 text-xs font-mono bg-muted/30 border-border/50 focus:border-primary/50"
        />
      </div>

      <div className="rounded border border-border/30 p-2.5 space-y-1.5">
        <div className="flex justify-between text-[9px] font-mono">
          <span className="text-muted-foreground">Total</span>
          <span className="neon-text-btc">{totalCost.toFixed(8)} BTC</span>
        </div>
        <div className="flex justify-between text-[9px] font-mono">
          <span className="text-muted-foreground">USD Value</span>
          <span className="text-muted-foreground">
            ${(totalCost * BTC_USD_PRICE).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-[9px] font-mono">
          <span className="text-muted-foreground">Network Fee</span>
          <span className="text-muted-foreground">~0.00001 BTC</span>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className={cn(
          "w-full h-9 text-xs font-mono font-bold tracking-wider transition-all",
          isBuy
            ? "bg-green-500/20 text-green-400 border border-green-400/40 hover:bg-green-500/30 hover:glow-green"
            : "bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 hover:glow-pink",
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <ArrowUpDown size={12} className="animate-spin" />
            PROCESSING...
          </span>
        ) : (
          `${isBuy ? "BUY" : "SELL"} ${rune.symbol}`
        )}
      </Button>
    </div>
  );
}

export default OdinTrading;
