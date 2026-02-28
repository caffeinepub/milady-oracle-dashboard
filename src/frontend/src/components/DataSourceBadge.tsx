import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { MarketDataStatus } from "../services/liveMarket";

interface DataSourceBadgeProps {
  status: MarketDataStatus | null;
  className?: string;
}

function getSecondsAgo(ts: number): number {
  return Math.max(0, Math.floor((Date.now() - ts) / 1000));
}

export function DataSourceBadge({ status, className }: DataSourceBadgeProps) {
  const [secondsAgo, setSecondsAgo] = useState<number>(
    status ? getSecondsAgo(status.updatedAt) : 0,
  );

  useEffect(() => {
    if (!status || status.source !== "live") return;
    const id = setInterval(() => {
      setSecondsAgo(getSecondsAgo(status.updatedAt));
    }, 5000);
    setSecondsAgo(getSecondsAgo(status.updatedAt));
    return () => clearInterval(id);
  }, [status]);

  if (!status) return null;

  if (status.source === "live") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-mono font-bold border border-green-400/30 bg-green-400/10 text-green-400 tracking-[0.12em]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          LIVE DATA
        </span>
        <span className="text-[9px] font-mono text-muted-foreground">
          Updated {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-mono font-bold border border-amber-400/30 bg-amber-400/10 text-amber-400 tracking-[0.12em]">
        <span className="inline-block w-1.5 h-1.5 rounded-full border border-amber-400/60" />
        MOCK DATA
      </span>
      {status.error && (
        <span
          className="text-[9px] font-mono text-muted-foreground/60 truncate max-w-[180px]"
          title={status.error}
        >
          (API unavailable)
        </span>
      )}
    </div>
  );
}

export default DataSourceBadge;
