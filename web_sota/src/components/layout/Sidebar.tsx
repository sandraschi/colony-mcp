import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Rss, PenTool, MessageSquare,
  Inbox, Building2, User, Store, Shield, Webhook,
  ChevronLeft, ChevronRight, Satellite
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/feed", label: "Feed", icon: Rss },
  { to: "/compose", label: "Compose", icon: PenTool },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/colonies", label: "Colonies", icon: Building2 },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/safety", label: "Safety", icon: Shield },
  { to: "/webhooks", label: "Webhooks", icon: Webhook },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <div className="md:hidden">
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/80 px-2 py-1.5 flex justify-around">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors",
                  isActive ? "text-primary" : "text-foreground/50 hover:text-foreground/80"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col sticky top-0 h-screen border-r border-border/60 bg-background/60 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center gap-2 px-3 py-4 border-b border-border/40", collapsed && "justify-center")}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary">
            <Satellite className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Colony MCP</p>
              <p className="text-[10px] text-foreground/40">v0.1.0 · :10971</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-1.5 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-foreground/60 hover:text-foreground hover:bg-card/50",
                  collapsed && "justify-center px-0"
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-border/40 text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
}
