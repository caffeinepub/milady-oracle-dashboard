import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, Crown, Wifi } from "lucide-react";
import type { WalletRecord } from "../backend.d";
import { WalletType } from "../backend.d";

interface HeaderProps {
  connectedWallet: WalletRecord | null;
  onConnectWallet: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

const walletTypeLabel: Record<WalletType, string> = {
  [WalletType.unisat]: "Unisat",
  [WalletType.xverse]: "Xverse",
  [WalletType.okx]: "OKX",
  [WalletType.plug]: "Plug",
  [WalletType.oisy]: "OISY",
  [WalletType.magicEden]: "Magic Eden",
  [WalletType.bioniq]: "Bioniq",
};

export function Header({
  connectedWallet,
  onConnectWallet,
  currentPage,
  onNavigate,
}: HeaderProps) {
  const pageTitle: Record<string, string> = {
    dashboard: "Dashboard",
    portfolio: "Portfolio",
    runes: "Runes Market",
    ordinals: "Ordinals / Bioniq",
    odin: "Odin.Fun Trading",
    activity: "Activity Feed",
    settings: "Settings",
  };

  return (
    <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border/50 bg-background/90 backdrop-blur-md">
      {/* Logo */}
      <button
        type="button"
        onClick={() => onNavigate("dashboard")}
        className="flex items-center gap-2 group"
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <img
            src="/assets/generated/milady-oracle-logo-transparent.dim_80x80.png"
            alt="Milady Oracle"
            className="w-8 h-8 object-contain"
          />
        </div>
        <div className="hidden sm:flex flex-col leading-none">
          <span className="font-display font-black text-sm tracking-[0.15em] neon-text-cyan animate-flicker">
            MILADY
          </span>
          <span className="font-display font-light text-xs tracking-[0.3em] text-muted-foreground">
            ORACLE
          </span>
        </div>
      </button>

      {/* Page title on mobile */}
      <div className="flex-1 text-center lg:hidden">
        <span className="text-sm font-medium text-muted-foreground">
          {pageTitle[currentPage] ?? ""}
        </span>
      </div>

      {/* Nav links (desktop) */}
      <nav className="hidden lg:flex items-center gap-1 ml-8">
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "runes", label: "Runes" },
          { id: "ordinals", label: "Ordinals" },
          { id: "odin", label: "Odin.Fun" },
        ].map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`px-3 py-1.5 text-xs font-medium tracking-wide transition-colors rounded ${
              currentPage === item.id
                ? "neon-text-cyan bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-[10px] tracking-wider">LIVE</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-1.5 rounded hover:bg-muted/50 transition-colors"
        >
          <Bell size={14} className="text-muted-foreground" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>

        {/* Wallet button */}
        {connectedWallet ? (
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="flex items-center gap-2 px-3 py-1.5 rounded glass-card border-glow-cyan text-xs font-mono transition-all hover:glow-cyan"
          >
            <Wifi size={12} className="neon-text-cyan flex-shrink-0" />
            <div className="flex flex-col items-start leading-none">
              <span className="neon-text-cyan text-[10px] tracking-wider mb-0.5">
                {walletTypeLabel[connectedWallet.walletType]}
              </span>
              <span className="text-muted-foreground truncate max-w-[100px]">
                {truncateAddress(connectedWallet.address)}
              </span>
            </div>
            <ChevronDown size={10} className="text-muted-foreground" />
          </button>
        ) : (
          <Button
            onClick={onConnectWallet}
            size="sm"
            className="text-xs px-3 py-1.5 h-7 font-mono tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-glow border border-primary/50"
          >
            CONNECT WALLET
          </Button>
        )}
      </div>
    </header>
  );
}

export default Header;
