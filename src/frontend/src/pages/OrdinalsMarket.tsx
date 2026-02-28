import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Grid3X3, List, Search, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  BTC_USD_PRICE,
  type OrdinalCollection,
  ordinalCollections,
} from "../mocks/backend";

const COLLECTION_EMOJIS: Record<string, string> = {
  NodeMonkes: "🐒",
  "Bitcoin Puppets": "🪆",
  "Quantum Cats": "🐱",
  Bitmap: "◼",
  "Bitcoin Frogs": "🐸",
  "Ordinal Maxi Biz": "🤖",
};

const COLLECTION_GRADIENTS: Record<string, string> = {
  NodeMonkes: "from-orange-500/20 to-amber-600/10",
  "Bitcoin Puppets": "from-purple-500/20 to-pink-600/10",
  "Quantum Cats": "from-cyan-500/20 to-blue-600/10",
  Bitmap: "from-slate-500/20 to-slate-700/10",
  "Bitcoin Frogs": "from-green-500/20 to-emerald-600/10",
  "Ordinal Maxi Biz": "from-indigo-500/20 to-violet-600/10",
};

function CollectionCard({ col }: { col: OrdinalCollection }) {
  const isPos = col.floorChange24h >= 0;
  const emoji = COLLECTION_EMOJIS[col.name] ?? "🖼";
  const gradient =
    COLLECTION_GRADIENTS[col.name] ?? "from-primary/20 to-muted/10";

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="glass-card rounded-xl overflow-hidden cursor-pointer group"
    >
      {/* Image / banner */}
      <div
        className={cn(
          "relative h-32 bg-gradient-to-br flex items-center justify-center",
          gradient,
        )}
      >
        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </span>
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[8px] h-4 px-1.5 font-mono border",
              isPos
                ? "border-green-400/40 text-green-400 bg-green-400/10"
                : "border-accent/40 text-accent bg-accent/10",
            )}
          >
            {isPos ? "+" : ""}
            {col.floorChange24h.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xs font-semibold text-foreground">
              {col.name}
            </h3>
            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
              {col.supply.toLocaleString()} items
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <div className="text-[8px] text-muted-foreground/60 uppercase tracking-[0.1em] font-mono">
              Floor
            </div>
            <div className="text-[11px] font-mono neon-text-btc font-bold">
              {col.floorPrice} BTC
            </div>
            <div className="text-[8px] text-muted-foreground font-mono">
              $
              {(col.floorPrice * BTC_USD_PRICE).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div>
            <div className="text-[8px] text-muted-foreground/60 uppercase tracking-[0.1em] font-mono">
              24h Vol
            </div>
            <div className="text-[11px] font-mono text-foreground font-bold">
              {col.volume24h.toFixed(1)} BTC
            </div>
            <div className="text-[8px] text-muted-foreground font-mono">
              {col.owners.toLocaleString()} holders
            </div>
          </div>
        </div>

        {/* Bid/Ask row */}
        <div className="flex gap-1.5 mt-3">
          <button
            type="button"
            className="flex-1 py-1.5 rounded text-[9px] font-mono border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-colors"
          >
            BID
          </button>
          <button
            type="button"
            className="flex-1 py-1.5 rounded text-[9px] font-mono border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
          >
            ASK
          </button>
          <button
            type="button"
            className="flex-1 py-1.5 rounded text-[9px] font-mono border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            BUY
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CollectionRow({ col, i }: { col: OrdinalCollection; i: number }) {
  const isPos = col.floorChange24h >= 0;
  const emoji = COLLECTION_EMOJIS[col.name] ?? "🖼";

  return (
    <div className="grid grid-cols-[20px_1fr_auto_auto_auto_auto] gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors rounded-md cursor-pointer">
      <span className="text-[9px] text-muted-foreground/60 font-mono self-center">
        {i + 1}
      </span>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
          {emoji}
        </div>
        <div>
          <div className="text-[11px] font-semibold text-foreground">
            {col.name}
          </div>
          <div className="text-[9px] text-muted-foreground font-mono">
            {col.supply.toLocaleString()} items
          </div>
        </div>
      </div>
      <div className="text-right self-center">
        <div className="text-[10px] font-mono neon-text-btc">
          {col.floorPrice} BTC
        </div>
        <div className="text-[8px] text-muted-foreground">
          ${(col.floorPrice * BTC_USD_PRICE).toFixed(0)}
        </div>
      </div>
      <div
        className={cn(
          "text-right self-center text-[10px] font-mono",
          isPos ? "neon-text-green" : "neon-text-pink",
        )}
      >
        {isPos ? "+" : ""}
        {col.floorChange24h.toFixed(1)}%
      </div>
      <div className="text-right self-center text-[10px] font-mono text-muted-foreground">
        {col.volume24h.toFixed(1)} BTC
      </div>
      <div className="text-right self-center text-[9px] font-mono text-muted-foreground">
        {col.owners.toLocaleString()}
      </div>
    </div>
  );
}

export function OrdinalsMarket() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = ordinalCollections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalVol = ordinalCollections.reduce((s, c) => s + c.volume24h, 0);
  const totalFloor = ordinalCollections.reduce((s, c) => s + c.floorPrice, 0);

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Stats */}
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
            label: "Collections",
            value: ordinalCollections.length.toString(),
            accent: "neon-text-pink",
          },
          {
            label: "Total Floor",
            value: `${totalFloor.toFixed(2)} BTC`,
            accent: "neon-text-btc",
          },
          { label: "Inscriptions", value: "74.2M+", accent: "text-foreground" },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-card rounded px-3 py-2 flex items-center gap-2"
          >
            <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
              {s.label}
            </span>
            <span className={cn("text-xs font-mono font-bold", s.accent)}>
              {s.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Tabs: Collections / My Ordinals */}
      <Tabs defaultValue="collections">
        <div className="flex items-center justify-between gap-3">
          <TabsList className="bg-muted/40 h-8">
            <TabsTrigger value="collections" className="text-[10px] px-3">
              Collections
            </TabsTrigger>
            <TabsTrigger value="bioniq" className="text-[10px] px-3">
              Bioniq Bridge
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={11}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-7 h-7 text-[11px] w-36 bg-muted/30 border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded border transition-colors",
                  viewMode === "grid"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground",
                )}
              >
                <Grid3X3 size={12} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded border transition-colors",
                  viewMode === "list"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground",
                )}
              >
                <List size={12} />
              </button>
            </div>
          </div>
        </div>

        <TabsContent value="collections" className="mt-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <CollectionCard col={col} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-lg">
              {/* List header */}
              <div className="grid grid-cols-[20px_1fr_auto_auto_auto_auto] gap-3 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground/60 border-b border-border/30">
                <span>#</span>
                <span>Collection</span>
                <span className="text-right">Floor</span>
                <span className="text-right">24h</span>
                <span className="text-right">Volume</span>
                <span className="text-right">Holders</span>
              </div>
              {filtered.map((col, i) => (
                <CollectionRow key={col.id} col={col} i={i} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bioniq" className="mt-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-8 text-center"
          >
            <div className="text-4xl mb-4">⬡</div>
            <h3 className="text-sm font-display font-bold neon-text-cyan mb-2">
              Bioniq Bridge
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Bioniq enables Bitcoin Ordinals to be traded at ICP speed with
              near-zero fees. Bridge your Ordinals from Bitcoin to the Internet
              Computer for instant trading.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6 max-w-sm mx-auto">
              {[
                { label: "Bridged NFTs", value: "12,847" },
                { label: "Avg. Speed", value: "< 1s" },
                { label: "Fee", value: "~0 sat" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border/40 p-3"
                >
                  <div className="text-sm font-bold neon-text-cyan font-mono">
                    {s.value}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-6 px-6 py-2 rounded border border-primary/40 text-primary text-xs font-mono hover:bg-primary/10 transition-colors"
            >
              BRIDGE ORDINALS →
            </button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

export default OrdinalsMarket;
