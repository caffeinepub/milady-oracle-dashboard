import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  Globe,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile, WalletRecord } from "../backend.d";
import { WalletType } from "../backend.d";

interface SettingsProps {
  connectedWallet: WalletRecord | null;
  profile: UserProfile;
  wallets: WalletRecord[];
  onConnectWallet: () => void;
}

const walletTypeLabels: Record<WalletType, string> = {
  [WalletType.unisat]: "Unisat",
  [WalletType.xverse]: "Xverse",
  [WalletType.okx]: "OKX",
  [WalletType.plug]: "Plug",
  [WalletType.oisy]: "OISY",
  [WalletType.magicEden]: "Magic Eden",
  [WalletType.bioniq]: "Bioniq",
};

const walletTypeEmojis: Record<WalletType, string> = {
  [WalletType.unisat]: "🦄",
  [WalletType.xverse]: "✦",
  [WalletType.okx]: "⬛",
  [WalletType.plug]: "🔌",
  [WalletType.oisy]: "◈",
  [WalletType.magicEden]: "✨",
  [WalletType.bioniq]: "⬡",
};

function truncateAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}...${address.slice(-8)}`;
}

export function Settings({
  connectedWallet,
  profile,
  wallets,
  onConnectWallet,
}: SettingsProps) {
  const [username, setUsername] = useState(profile.username);
  const [notifications, setNotifications] = useState(
    profile.preferences.notifications,
  );
  const [currency, setCurrency] = useState(profile.preferences.currency);
  const [saving, setSaving] = useState(false);

  async function handleSaveProfile() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Profile saved successfully");
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <SettingsIcon size={16} className="neon-text-cyan" />
          <h2 className="font-display font-bold text-sm tracking-wide neon-text-cyan">
            Settings
          </h2>
        </motion.div>

        {/* Profile section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <User size={14} className="text-primary" />
            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
              Profile
            </h3>
          </div>

          <div className="space-y-4">
            {/* Avatar + principal */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold neon-text-cyan">
                  {username.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  {username}
                </div>
                <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                  Principal: {profile.principal.toString().slice(0, 24)}...
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-mono block mb-1">
                  Username
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-8 text-xs font-mono bg-muted/30 border-border/50 focus:border-primary/50"
                />
              </div>
              <div>
                <Label className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-mono block mb-1">
                  Currency
                </Label>
                <div className="flex gap-1.5">
                  {["USD", "EUR", "GBP"].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={cn(
                        "flex-1 h-8 text-[10px] font-mono rounded border transition-colors",
                        currency === c
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/40 text-muted-foreground hover:border-border",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              size="sm"
              className="text-[10px] font-mono h-7 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Check size={10} className="animate-pulse" />
                  SAVING...
                </span>
              ) : (
                "SAVE PROFILE"
              )}
            </Button>
          </div>
        </motion.section>

        {/* Wallet management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-primary" />
              <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
                Connected Wallets
              </h3>
            </div>
            <button
              type="button"
              onClick={onConnectWallet}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus size={10} />
              ADD WALLET
            </button>
          </div>

          <div className="space-y-2">
            {wallets.length === 0 ? (
              <div className="text-center py-8">
                <Wallet
                  size={24}
                  className="text-muted-foreground/30 mx-auto mb-2"
                />
                <p className="text-xs text-muted-foreground font-mono">
                  No wallets connected
                </p>
                <button
                  type="button"
                  onClick={onConnectWallet}
                  className="mt-3 px-4 py-1.5 text-xs font-mono rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  Connect your first wallet
                </button>
              </div>
            ) : (
              wallets.map((wallet) => {
                const isActive = connectedWallet?.id === wallet.id;
                return (
                  <div
                    key={wallet.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      isActive
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/40 hover:border-border/60",
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-lg flex-shrink-0">
                      {walletTypeEmojis[wallet.walletType]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {walletTypeLabels[wallet.walletType]}
                        </span>
                        {isActive && (
                          <Badge
                            variant="outline"
                            className="text-[8px] h-3.5 px-1 border-green-400/40 text-green-400 bg-green-400/10 font-mono"
                          >
                            ACTIVE
                          </Badge>
                        )}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                        {truncateAddress(wallet.address)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded text-muted-foreground/40 hover:text-accent hover:bg-accent/10 transition-colors"
                      onClick={() =>
                        toast.error(
                          "Cannot remove active wallet — disconnect first",
                        )
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell size={14} className="text-primary" />
            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
              Notifications
            </h3>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "price-alerts",
                label: "Price Alerts",
                sub: "Get notified when watchlisted assets hit target prices",
              },
              {
                id: "trade-confirms",
                label: "Trade Confirmations",
                sub: "Confirm before executing trades",
              },
              {
                id: "new-inscriptions",
                label: "New Inscriptions",
                sub: "Be notified of new Ordinal inscriptions",
              },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-foreground font-medium">
                    {item.label}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {item.sub}
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={(v) => setNotifications(v)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>
        </motion.section>

        {/* Display */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} className="text-primary" />
            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
              Display
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-foreground font-medium">Theme</div>
                <div className="text-[9px] text-muted-foreground">
                  Always dark (cyberpunk mode)
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] border-primary/30 text-primary bg-primary/10 font-mono"
              >
                DARK
              </Badge>
            </div>
            <Separator className="bg-border/30" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-foreground font-medium">
                  Price Format
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Show prices in satoshis
                </div>
              </div>
              <Switch
                defaultChecked
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Separator className="bg-border/30" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-foreground font-medium">
                  ICP Network
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Connected via Internet Computer
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] border-green-400/30 text-green-400 bg-green-400/10 font-mono"
              >
                MAINNET
              </Badge>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center pb-4"
        >
          <p className="text-[9px] text-muted-foreground/40 font-mono">
            MILADY ORACLE v1.0.0 — Built with ♥ using caffeine.ai
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default Settings;
