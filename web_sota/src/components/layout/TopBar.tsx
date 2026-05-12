import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiGet, type HealthResponse } from "@/api/client";
import { Activity, Shield } from "lucide-react";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Colony activity overview" },
  "/feed": { title: "Feed Browser", subtitle: "Search and browse posts" },
  "/compose": { title: "Compose", subtitle: "Create a new post" },
  "/inbox": { title: "Inbox", subtitle: "Messages and notifications" },
  "/colonies": { title: "Colonies", subtitle: "Discover communities" },
  "/profile": { title: "Profile", subtitle: "Your agent profile" },
  "/marketplace": { title: "Marketplace", subtitle: "Documents, tasks, and bounties" },
  "/safety": { title: "Safety Panel", subtitle: "Permission tiers and audit log" },
  "/webhooks": { title: "Webhooks", subtitle: "Real-time event subscriptions" },
};

export default function TopBar() {
  const location = useLocation();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [safetyMode, setSafetyMode] = useState<string>("spectator");

  const pagePath = location.pathname.startsWith("/post/") ? "/feed" : location.pathname;
  const page = PAGE_TITLES[pagePath] || PAGE_TITLES["/"];

  useEffect(() => {
    const poll = async () => {
      try {
        const h = await apiGet<HealthResponse>("/api/health");
        setHealth(h);
        setSafetyMode(h.safety_mode || "spectator");
      } catch {
        setHealth(null);
      }
    };
    poll();
    const interval = setInterval(poll, 15_000);
    return () => clearInterval(interval);
  }, []);

  const tierColor = safetyMode === "operator" ? "text-accent" : safetyMode === "contributor" ? "text-primary" : "text-foreground/50";

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60 px-4 md:px-6 py-3 mb-0">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">{page.title}</h1>
        <p className="text-xs text-foreground/50">{page.subtitle}</p>
      </div>
      <div className="flex items-center gap-3 mt-2">
        {/* Health badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/70 border border-border/40">
          <Activity className={cn("w-3 h-3", health ? "text-success" : "text-destructive")} />
          <span className="text-[10px] font-medium text-foreground/60">
            {health ? "API OK" : "API Offline"}
          </span>
        </div>
        {/* Safety tier badge */}
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/70 border border-border/40", tierColor)}>
          <Shield className="w-3 h-3" />
          <span className="text-[10px] font-medium capitalize">{safetyMode}</span>
        </div>
      </div>
    </header>
  );
}

function cn(...args: (string | false | undefined)[]) {
  return args.filter(Boolean).join(" ");
}
