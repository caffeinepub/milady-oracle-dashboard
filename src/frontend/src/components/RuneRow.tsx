import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import type { MarketRune } from "../mocks/backend";
import { BTC_USD_PRICE } from "../mocks/backend";

interface RuneRowProps {
  rune: MarketRune;
  rank: number;
  isWatchlisted?: boolean;
  onWatchlist?: () => void;
  className?: string;
}

function formatSats(btcPrice: number): string {
  const sats = Math.round(btcPrice * 100_000_000);
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(1)}k`;
  }
  return sats.toString();
}

export function RuneRow({
  rune,
  rank,
  isWatchlisted = false,
  onWatchlist,
  className,
}: RuneRowProps) {
  const isPositive = rune.priceChange24h >= 0;
  const usdPrice = rune.currentPrice * BTC_USD_PRICE;

  return (
    <div
      className={cn(
        "grid gap-2 px-3 py-2.5 rounded-md text-xs font-mono transition-colors hover:bg-muted/20 group cursor-pointer",
        "grid-cols-[20px_1fr_auto_auto_auto_auto]",
        className,
      )}
    >
      {/* Rank */}
      <span className="text-muted-foreground/60 text-[10px] self-center">
        {rank}
      </span>

      {/* Name */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-bold neon-text-cyan">
            {rune.symbol.slice(0, 3)}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-foreground font-semibold truncate text-[11px] tracking-wide">
            {rune.runeName}
          </div>
          <div className="text-muted-foreground text-[9px]">{rune.symbol}</div>
        </div>
      </div>

      {/* Price */}
      <div className="text-right self-center">
        <div className="text-foreground">
          {formatSats(rune.currentPrice)} sats
        </div>
        <div className="text-muted-foreground text-[9px]">
          ${usdPrice < 0.01 ? usdPrice.toFixed(6) : usdPrice.toFixed(4)}
        </div>
      </div>

      {/* 24h change */}
      <div
        className={cn(
          "text-right self-center",
          isPositive ? "neon-text-green" : "neon-text-pink",
        )}
      >
        {isPositive ? "+" : ""}
        {rune.priceChange24h.toFixed(1)}%
      </div>

      {/* Volume */}
      <div className="text-right self-center text-muted-foreground hidden sm:block">
        {rune.volume24h.toFixed(2)} BTC
      </div>

      {/* Watchlist */}
      <div className="self-center flex justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onWatchlist?.();
          }}
          className={cn(
            "p-1 rounded transition-colors",
            isWatchlisted
              ? "text-yellow-400"
              : "text-muted-foreground/40 hover:text-yellow-400",
          )}
        >
          <Star size={12} fill={isWatchlisted ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}

export default RuneRow;
