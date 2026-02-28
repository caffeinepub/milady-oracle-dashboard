import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface PriceCardProps {
  title: string;
  value: string;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  accent?: "cyan" | "pink" | "green" | "btc";
  className?: string;
  icon?: React.ReactNode;
}

const accentClasses = {
  cyan: "neon-text-cyan",
  pink: "neon-text-pink",
  green: "neon-text-green",
  btc: "neon-text-btc",
};

const borderClasses = {
  cyan: "border-l-2 border-l-[oklch(0.82_0.15_195/0.5)]",
  pink: "border-l-2 border-l-[oklch(0.72_0.22_345/0.5)]",
  green: "border-l-2 border-l-[oklch(0.78_0.18_142/0.5)]",
  btc: "border-l-2 border-l-[oklch(0.78_0.17_50/0.5)]",
};

export function PriceCard({
  title,
  value,
  subValue,
  change,
  changeLabel,
  accent = "cyan",
  className,
  icon,
}: PriceCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        "glass-card rounded-lg p-4 flex flex-col gap-1.5",
        borderClasses[accent],
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
          {title}
        </span>
        {icon && <div className="text-muted-foreground/60">{icon}</div>}
      </div>

      <div
        className={cn("text-2xl font-bold font-mono", accentClasses[accent])}
      >
        {value}
      </div>

      {(subValue || change !== undefined) && (
        <div className="flex items-center justify-between">
          {subValue && (
            <span className="text-xs text-muted-foreground font-mono">
              {subValue}
            </span>
          )}
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-mono",
                isPositive ? "neon-text-green" : "neon-text-pink",
              )}
            >
              {isPositive ? (
                <TrendingUp size={10} />
              ) : (
                <TrendingDown size={10} />
              )}
              {isPositive ? "+" : ""}
              {change.toFixed(2)}%
              {changeLabel && (
                <span className="text-muted-foreground ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PriceCard;
