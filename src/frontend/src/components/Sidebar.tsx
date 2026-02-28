import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gem,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Zap,
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "portfolio", label: "Portfolio", icon: TrendingUp },
  { id: "runes", label: "Runes Market", icon: Coins },
  { id: "ordinals", label: "Ordinals", icon: Gem },
  { id: "odin", label: "Odin.Fun", icon: Zap },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  currentPage,
  onNavigate,
  collapsed,
  onToggle,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-shrink-0 relative",
        collapsed ? "w-14" : "w-52",
      )}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center hover:border-primary/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-muted-foreground" />
        ) : (
          <ChevronLeft size={12} className="text-muted-foreground" />
        )}
      </button>

      {/* Subtle top gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/25 glow-cyan"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />
              )}
              <Icon
                size={16}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {!collapsed && (
                <span className="truncate tracking-wide text-xs">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom stats */}
      {!collapsed && (
        <div className="px-3 pb-4 space-y-2 border-t border-sidebar-border pt-3">
          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 px-1">
            Network
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              BTC Block
            </span>
            <span className="text-[10px] font-mono neon-text-cyan">
              840,421
            </span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              Fee Rate
            </span>
            <span className="text-[10px] font-mono neon-text-btc">
              24 sat/vB
            </span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              Mempool
            </span>
            <span className="text-[10px] font-mono text-foreground">
              142k txns
            </span>
          </div>
        </div>
      )}

      {/* Bottom gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </aside>
  );
}

export default Sidebar;
