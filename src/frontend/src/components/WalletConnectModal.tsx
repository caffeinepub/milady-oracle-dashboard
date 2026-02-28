import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Smartphone,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type WalletRecord, WalletType } from "../backend.d";
import {
  type WalletConnectionMethod,
  type WalletInfo,
  connectRealWallet,
  getDetectedWallets,
  isMobile,
} from "../services/walletDetect";

// ── Wallet metadata ───────────────────────────────────────────────────────────

interface WalletMeta {
  type: WalletType;
  name: string;
  tagline: string;
  color: string;
  emoji: string;
  popular?: boolean;
}

const walletMeta: WalletMeta[] = [
  {
    type: WalletType.unisat,
    name: "Unisat",
    tagline: "BTC & Runes Native",
    color: "oklch(0.72 0.17 250)",
    emoji: "🦄",
    popular: true,
  },
  {
    type: WalletType.xverse,
    name: "Xverse",
    tagline: "Ordinals & STX",
    color: "oklch(0.65 0.2 290)",
    emoji: "✦",
    popular: true,
  },
  {
    type: WalletType.okx,
    name: "OKX Wallet",
    tagline: "Multi-chain",
    color: "oklch(0.82 0.03 255)",
    emoji: "⬛",
  },
  {
    type: WalletType.magicEden,
    name: "Magic Eden",
    tagline: "NFT Marketplace",
    color: "oklch(0.72 0.22 345)",
    emoji: "✨",
    popular: true,
  },
  {
    type: WalletType.plug,
    name: "Plug",
    tagline: "ICP Native",
    color: "oklch(0.75 0.2 195)",
    emoji: "🔌",
  },
  {
    type: WalletType.oisy,
    name: "OISY",
    tagline: "ICP Self-Custody",
    color: "oklch(0.78 0.18 142)",
    emoji: "◈",
  },
  {
    type: WalletType.bioniq,
    name: "Bioniq",
    tagline: "Ordinals on ICP",
    color: "oklch(0.82 0.15 195)",
    emoji: "⬡",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSimAddress(type: WalletType): string {
  const addrs: Record<WalletType, string> = {
    [WalletType.unisat]: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    [WalletType.xverse]:
      "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge6wfptsde3dn3grs48snfn",
    [WalletType.okx]: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    [WalletType.magicEden]: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    [WalletType.plug]:
      "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
    [WalletType.oisy]:
      "bc1p6h5fuzmnvpdthf5shf0qqjzwy7wsqc5rhmgq2hnpkx6wgfd3c7rqyxq5d4",
    [WalletType.bioniq]: "bc1qhkje0bfsa9xls6yzrwkkxqrnl8aexjqnt3jxdp",
  };
  return addrs[type] ?? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
}

// ── Badge configs ─────────────────────────────────────────────────────────────

interface MethodBadge {
  label: string;
  className: string;
}

function getMethodBadge(info: WalletInfo, mobile: boolean): MethodBadge | null {
  const { method, available } = info;

  if (method === "extension") {
    return available
      ? {
          label: "DETECTED",
          className:
            "text-green-400 border-green-400/40 bg-green-400/10 font-mono",
        }
      : {
          label: "EXTENSION",
          className: "text-muted-foreground border-border/40 font-mono",
        };
  }

  if (method === "popup") {
    return {
      label: "WEB LOGIN",
      className: "neon-text-cyan border-primary/40 bg-primary/10 font-mono",
    };
  }

  if (method === "weblogin") {
    return {
      label: "WEB LOGIN",
      className: "neon-text-cyan border-primary/40 bg-primary/10 font-mono",
    };
  }

  if (method === "deeplink") {
    return {
      label: mobile ? "OPEN APP" : "DEEP LINK",
      className: "text-amber-400 border-amber-400/40 bg-amber-400/10 font-mono",
    };
  }

  return null;
}

// ── CTA label ─────────────────────────────────────────────────────────────────

function getCtaLabel(method: WalletConnectionMethod, mobile: boolean): string {
  if (method === "deeplink") return mobile ? "Open App" : "Connect";
  if (method === "weblogin") return "Login";
  if (method === "popup") return "Login";
  return "Connect";
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ConnectingState =
  | "idle"
  | "connecting"
  | "popup-open"
  | "pending"
  | "connected";

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (wallet: WalletRecord) => void;
  /** Legacy prop — kept for backwards compat but we re-detect on open */
  detectedWallets?: WalletType[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WalletConnectModal({
  open,
  onClose,
  onConnect,
}: WalletConnectModalProps) {
  const [walletInfos, setWalletInfos] = useState<WalletInfo[]>([]);
  const [connectingType, setConnectingType] = useState<WalletType | null>(null);
  const [connectingState, setConnectingState] =
    useState<ConnectingState>("idle");
  const [pendingWallet, setPendingWallet] = useState<WalletMeta | null>(null);

  const mobile = isMobile();

  // Re-detect wallets every time the modal opens
  useEffect(() => {
    if (open) {
      setWalletInfos(getDetectedWallets());
      // Reset state
      setConnectingType(null);
      setConnectingState("idle");
      setPendingWallet(null);
    }
  }, [open]);

  const infoByType = Object.fromEntries(
    walletInfos.map((w) => [w.type, w]),
  ) as Record<WalletType, WalletInfo>;

  const handleConnect = async (meta: WalletMeta) => {
    if (connectingType !== null) return;
    const info = infoByType[meta.type];
    if (!info) return;

    setConnectingType(meta.type);

    // For popup and weblogin flows, notify the user immediately
    if (info.method === "popup") {
      setConnectingState("popup-open");
    } else {
      setConnectingState("connecting");
    }

    const result = await connectRealWallet(meta.type);

    // ── Pending (mobile redirects / new tabs) ─────────────────────────────
    if (
      result === "pending-mobile-redirect" ||
      result === "pending-mobile-weblogin"
    ) {
      setConnectingState("pending");
      setPendingWallet(meta);
      setConnectingType(null);
      return; // keep modal open with instructions
    }

    // ── Null — no real wallet found (extension not installed, popup blocked, etc.) ─
    if (!result && info.method === "extension" && !info.available) {
      toast("Wallet not detected — using simulation", {
        description: `Install ${meta.name} extension to connect your real wallet.`,
        duration: 3000,
      });
      // Simulate a delay, then use fallback address
      await new Promise((r) => setTimeout(r, 1200));
      const address = generateSimAddress(meta.type);
      finishConnect(meta, address);
      return;
    }

    if (!result) {
      // User cancelled or popup was blocked
      toast.error(`Could not connect ${meta.name}`, {
        description: "Connection was cancelled or the popup was blocked.",
        duration: 3000,
      });
      setConnectingType(null);
      setConnectingState("idle");
      return;
    }

    // ── Success ─────────────────────────────────────────────────────────────
    setConnectingState("connected");
    await new Promise((r) => setTimeout(r, 600));
    finishConnect(meta, result);
  };

  const finishConnect = (meta: WalletMeta, address: string) => {
    const wallet: WalletRecord = {
      id: `wallet-${meta.type}-${Date.now()}`,
      walletType: meta.type,
      isConnected: true,
      addedAt: BigInt(Date.now()),
      address,
      walletLabel: `${meta.name} Wallet`,
    };
    onConnect(wallet);
    setConnectingType(null);
    setConnectingState("idle");
    setPendingWallet(null);
    onClose();
  };

  // BTC wallets (first row), ICP wallets (second row)
  const btcWallets = walletMeta.slice(0, 4);
  const icpWallets = walletMeta.slice(4);

  const detectedCount = walletInfos.filter(
    (w) => w.method === "extension" && w.available,
  ).length;

  const renderWalletCard = (meta: WalletMeta) => {
    const info = infoByType[meta.type];
    const isConnecting = connectingType === meta.type;
    const isConnected =
      connectingType === meta.type && connectingState === "connected";
    const isPopupOpen =
      connectingType === meta.type && connectingState === "popup-open";
    const isDisabled = connectingType !== null && !isConnecting;
    const badge = info ? getMethodBadge(info, mobile) : null;
    const ctaLabel = info ? getCtaLabel(info.method, mobile) : "Connect";

    return (
      <button
        type="button"
        key={meta.type}
        onClick={() => handleConnect(meta)}
        disabled={isDisabled}
        className={cn(
          "relative flex flex-col items-center gap-2 p-3.5 rounded-lg border transition-all duration-200 group text-left",
          isConnecting || isConnected
            ? "border-primary/50 bg-primary/10 glow-cyan"
            : isDisabled
              ? "border-border/30 opacity-40 cursor-not-allowed"
              : "border-border/50 bg-card/50 hover:border-primary/30 hover:bg-primary/5 cursor-pointer",
        )}
      >
        {/* Method badge (top-left) */}
        {badge && !isConnecting && !isConnected && (
          <Badge
            variant="outline"
            className={cn(
              "absolute -top-2 left-1 text-[8px] h-3.5 px-1",
              badge.className,
            )}
          >
            {badge.label}
          </Badge>
        )}

        {/* Popular badge (top-right, only when not detected/connecting) */}
        {meta.popular &&
          !isConnecting &&
          !isConnected &&
          !(info?.method === "extension" && info.available) && (
            <Badge
              variant="outline"
              className="absolute -top-2 -right-1 text-[8px] h-3.5 px-1 border-primary/40 text-primary bg-primary/10 font-mono"
            >
              POPULAR
            </Badge>
          )}

        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold border border-border/30"
          style={{
            background: `${meta.color}25`,
            borderColor: `${meta.color}40`,
          }}
        >
          {isConnecting ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : isConnected ? (
            <CheckCircle2 size={16} className="text-green-400" />
          ) : (
            <span>{meta.emoji}</span>
          )}
        </div>

        {/* Name + tagline */}
        <div className="text-center w-full">
          <div className="text-xs font-semibold text-foreground leading-tight">
            {meta.name}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
            {meta.tagline}
          </div>
        </div>

        {/* Status line */}
        {isConnecting && connectingState === "connecting" && (
          <div className="text-[9px] neon-text-cyan font-mono animate-pulse">
            Connecting...
          </div>
        )}
        {isPopupOpen && (
          <div className="text-[9px] neon-text-cyan font-mono animate-pulse flex items-center gap-0.5">
            <ExternalLink size={8} />
            Popup open…
          </div>
        )}
        {isConnected && (
          <div className="text-[9px] neon-text-green font-mono">Connected!</div>
        )}
        {!isConnecting && !isConnected && (
          <div className="text-[9px] text-muted-foreground/60 font-mono group-hover:text-primary/70 transition-colors flex items-center gap-0.5">
            {info?.method === "deeplink" && mobile && <Smartphone size={8} />}
            {ctaLabel}
          </div>
        )}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-popover border border-border/60 p-0 overflow-hidden">
        {/* Cyan glow header */}
        <div className="relative p-5 pb-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="neon-text-cyan" />
              <DialogTitle className="text-base font-display font-bold tracking-wide neon-text-cyan">
                CONNECT WALLET
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {mobile
                ? "On mobile, BTC wallets open their native app and ICP wallets open a web login."
                : "Extension wallets connect directly. ICP wallets open a secure popup login."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Pending state — show instructions and wait */}
        {connectingState === "pending" && pendingWallet ? (
          <div className="px-5 pb-5 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full border border-amber-400/30 bg-amber-400/10 flex items-center justify-center">
              <Smartphone size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Complete in {pendingWallet.name}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {pendingWallet.emoji}{" "}
                {Object.keys(infoByType).length > 0 &&
                infoByType[pendingWallet.type]?.method === "deeplink"
                  ? "The wallet app is opening. Approve the connection there, then return to this app."
                  : "A new tab has opened for authentication. Complete login there and return here."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setConnectingState("idle");
                setPendingWallet(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-3">
            {/* Popup notice */}
            {connectingState === "popup-open" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-primary/20 bg-primary/5 text-xs text-primary/80">
                <ExternalLink size={12} className="shrink-0" />A popup window
                has opened — complete your login there.
              </div>
            )}

            {/* BTC Wallets */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-mono tracking-widest text-muted-foreground/60 uppercase">
                  Bitcoin Wallets
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {btcWallets.map(renderWalletCard)}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border/20" />
              <span className="text-[8px] font-mono tracking-widest text-border/60 uppercase">
                ICP Wallets
              </span>
              <div className="flex-1 h-px bg-border/20" />
            </div>

            {/* ICP Wallets */}
            <div>
              <div className="grid grid-cols-3 gap-2">
                {icpWallets.map(renderWalletCard)}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-4 border-t border-border/20 pt-3">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            {mobile
              ? "Running on mobile — BTC wallets use deep links, ICP wallets open web tabs."
              : detectedCount > 0
                ? `${detectedCount} wallet extension${detectedCount > 1 ? "s" : ""} detected in your browser.`
                : "No extensions detected — BTC wallets will simulate, ICP wallets use web login."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WalletConnectModal;
