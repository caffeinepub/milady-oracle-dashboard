// Augment the global BeforeInstallPromptEvent which isn't in lib.dom yet
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

import { Toaster } from "@/components/ui/sonner";
import type { Principal } from "@icp-sdk/core/principal";
import { useCallback, useEffect, useState } from "react";
import type {
  OrdinalItem,
  RuneHolding,
  TradeRecord,
  UserProfile,
  WalletRecord,
  WatchlistItem,
} from "./backend.d";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { WalletConnectModal } from "./components/WalletConnectModal";
import {
  type MarketRune,
  mockBackend,
  portfolioHistory,
} from "./mocks/backend";
import { ActivityFeed } from "./pages/ActivityFeed";
import { Dashboard } from "./pages/Dashboard";
import { OdinTrading } from "./pages/OdinTrading";
import { OrdinalsMarket } from "./pages/OrdinalsMarket";
import { Portfolio } from "./pages/Portfolio";
import { RunesMarket } from "./pages/RunesMarket";
import { Settings } from "./pages/Settings";
import { type MarketDataStatus, fetchLiveRunes } from "./services/liveMarket";

type Page =
  | "dashboard"
  | "portfolio"
  | "runes"
  | "ordinals"
  | "odin"
  | "activity"
  | "settings";

function MobileNav({
  currentPage,
  onNavigate,
}: {
  currentPage: string;
  onNavigate: (p: string) => void;
}) {
  const items = [
    { id: "dashboard", label: "Home" },
    { id: "runes", label: "Runes" },
    { id: "ordinals", label: "NFTs" },
    { id: "odin", label: "Trade" },
    { id: "portfolio", label: "Portfolio" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/50">
      <div className="flex">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-1 py-2.5 text-[9px] font-mono uppercase tracking-[0.08em] transition-colors ${
              currentPage === item.id
                ? "neon-text-cyan border-t border-primary/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [connectedWallet, setConnectedWallet] = useState<WalletRecord | null>(
    null,
  );
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Data state — always show market data, wallet data populated on connect
  const [runeHoldings, setRuneHoldings] = useState<RuneHolding[]>([]);
  const [ordinals, setOrdinals] = useState<OrdinalItem[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Capture the beforeinstallprompt event for the Install App button
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Live market data
  const [liveRunes, setLiveRunes] = useState<MarketRune[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketDataStatus | null>(
    null,
  );

  // Load all data on mount
  useEffect(() => {
    async function loadData() {
      const [
        runesData,
        ordinalsData,
        tradesData,
        profileData,
        walletsData,
        watchlistData,
      ] = await Promise.all([
        mockBackend.getMyRuneHoldings(),
        mockBackend.getMyOrdinals(),
        mockBackend.getMyTradeHistory(),
        mockBackend.getMyProfile(),
        mockBackend.getMyWallets(),
        mockBackend.getMyWatchlist(),
      ]);
      setRuneHoldings(runesData);
      setOrdinals(ordinalsData);
      setTrades(tradesData);
      setProfile(profileData);
      setWallets(walletsData);
      setWatchlist(watchlistData);
    }
    loadData();
  }, []);

  // Fetch live runes market data on mount and every 60s
  useEffect(() => {
    async function loadMarket() {
      const { runes, status } = await fetchLiveRunes();
      setLiveRunes(runes);
      setMarketStatus(status);
    }
    loadMarket();

    const interval = setInterval(loadMarket, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleWalletConnect = useCallback((wallet: WalletRecord) => {
    setConnectedWallet(wallet);
    // Add to wallets list if not already present
    setWallets((prev) => {
      if (prev.find((w) => w.id === wallet.id)) return prev;
      return [...prev, wallet];
    });
  }, []);

  const navigate = useCallback((page: string) => {
    setCurrentPage(page as Page);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const defaultProfile: UserProfile = profile ?? {
    principal: { toString: () => "anonymous" } as unknown as Principal,
    username: "anon",
    avatarUrl: "",
    createdAt: BigInt(Date.now()),
    preferences: { theme: "dark", notifications: true, currency: "USD" },
  };

  function renderPage() {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            connectedWallet={connectedWallet}
            runeHoldings={runeHoldings}
            ordinals={ordinals}
            trades={trades}
            portfolioHistory={portfolioHistory}
            onNavigate={navigate}
            onConnectWallet={() => setShowWalletModal(true)}
          />
        );
      case "portfolio":
        return (
          <Portfolio
            runeHoldings={runeHoldings}
            ordinals={ordinals}
            portfolioHistory={portfolioHistory}
          />
        );
      case "runes":
        return (
          <RunesMarket
            watchlist={watchlist}
            liveRunes={liveRunes}
            marketStatus={marketStatus}
          />
        );
      case "ordinals":
        return <OrdinalsMarket />;
      case "odin":
        return (
          <OdinTrading liveRunes={liveRunes} marketStatus={marketStatus} />
        );
      case "activity":
        return <ActivityFeed trades={trades} />;
      case "settings":
        return (
          <Settings
            connectedWallet={connectedWallet}
            profile={defaultProfile}
            wallets={wallets}
            onConnectWallet={() => setShowWalletModal(true)}
          />
        );
      default:
        return (
          <Dashboard
            connectedWallet={connectedWallet}
            runeHoldings={runeHoldings}
            ordinals={ordinals}
            trades={trades}
            portfolioHistory={portfolioHistory}
            onNavigate={navigate}
            onConnectWallet={() => setShowWalletModal(true)}
          />
        );
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "oklch(0.82 0.15 195)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.03] blur-3xl"
          style={{ background: "oklch(0.72 0.22 345)" }}
        />
        {/* Noise grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>

      {/* App layout */}
      <div className="relative z-10 flex flex-col h-screen">
        <Header
          connectedWallet={connectedWallet}
          onConnectWallet={() => setShowWalletModal(true)}
          currentPage={currentPage}
          onNavigate={navigate}
          installPrompt={installPrompt}
          onInstall={handleInstall}
        />

        <div className="flex flex-1 min-h-0">
          <Sidebar
            currentPage={currentPage}
            onNavigate={navigate}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />
          <div className="flex-1 flex flex-col min-h-0 pb-14 md:pb-0">
            {renderPage()}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <MobileNav currentPage={currentPage} onNavigate={navigate} />

      {/* Wallet modal */}
      <WalletConnectModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "bg-popover border border-border/60 text-foreground font-mono text-xs",
        }}
      />
    </div>
  );
}
