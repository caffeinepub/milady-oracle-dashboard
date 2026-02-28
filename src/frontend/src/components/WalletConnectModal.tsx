import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { type WalletRecord, WalletType } from "../backend.d";

interface WalletOption {
  type: WalletType;
  name: string;
  tagline: string;
  color: string;
  emoji: string;
  popular?: boolean;
}

const walletOptions: WalletOption[] = [
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

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (wallet: WalletRecord) => void;
}

function generateAddress(type: WalletType): string {
  const prefixes: Record<WalletType, string> = {
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
  return prefixes[type] || "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
}

export function WalletConnectModal({
  open,
  onClose,
  onConnect,
}: WalletConnectModalProps) {
  const [connecting, setConnecting] = useState<WalletType | null>(null);
  const [connected, setConnected] = useState<WalletType | null>(null);

  const handleConnect = async (option: WalletOption) => {
    if (connecting) return;
    setConnecting(option.type);

    await new Promise((r) => setTimeout(r, 1400));
    setConnected(option.type);

    await new Promise((r) => setTimeout(r, 600));

    const wallet: WalletRecord = {
      id: `wallet-${option.type}-${Date.now()}`,
      walletType: option.type,
      isConnected: true,
      addedAt: BigInt(Date.now()),
      address: generateAddress(option.type),
      walletLabel: `${option.name} Wallet`,
    };

    onConnect(wallet);
    setConnecting(null);
    setConnected(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-popover border border-border/60 p-0 overflow-hidden">
        {/* Cyan glow header */}
        <div className="relative p-6 pb-4 overflow-hidden">
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
              Connect your Bitcoin wallet to access portfolio tracking and
              trading features.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Wallet grid */}
        <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {walletOptions.map((option) => {
            const isConnecting = connecting === option.type;
            const isConnected = connected === option.type;
            const isDisabled = connecting !== null && !isConnecting;

            return (
              <button
                type="button"
                key={option.type}
                onClick={() => handleConnect(option)}
                disabled={isDisabled}
                className={cn(
                  "relative flex flex-col items-center gap-2.5 p-4 rounded-lg border transition-all duration-200 group",
                  isConnecting || isConnected
                    ? "border-primary/50 bg-primary/10 glow-cyan"
                    : isDisabled
                      ? "border-border/30 opacity-40 cursor-not-allowed"
                      : "border-border/50 bg-card/50 hover:border-primary/30 hover:bg-primary/5 cursor-pointer",
                )}
              >
                {option.popular && !isConnecting && !isConnected && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-1 text-[8px] h-3.5 px-1 border-primary/40 text-primary bg-primary/10 font-mono"
                  >
                    POPULAR
                  </Badge>
                )}

                {/* Wallet icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold border border-border/30"
                  style={{
                    background: `${option.color}25`,
                    borderColor: `${option.color}40`,
                  }}
                >
                  {isConnecting ? (
                    <Loader2 size={18} className="animate-spin text-primary" />
                  ) : isConnected ? (
                    <CheckCircle2 size={18} className="text-green-400" />
                  ) : (
                    <span>{option.emoji}</span>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xs font-semibold text-foreground">
                    {option.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {option.tagline}
                  </div>
                </div>

                {isConnecting && (
                  <div className="text-[10px] neon-text-cyan font-mono animate-pulse">
                    Connecting...
                  </div>
                )}
                {isConnected && (
                  <div className="text-[10px] neon-text-green font-mono">
                    Connected!
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-4 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            Connection is simulated for demonstration. No real wallet access
            required.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WalletConnectModal;
