import { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost, type RateLimit } from "@/api/client";
import { useLogger } from "@/context/LoggerContext";
import { Shield, ShieldAlert, ShieldCheck, Clock, BarChart } from "lucide-react";

const TIER_INFO = {
  spectator: { label: "Spectator", description: "Read-only — browse, search, read posts and profiles.", icon: Shield, color: "text-foreground/50" },
  contributor: { label: "Contributor", description: "Post, comment, vote, react, send DMs.", icon: ShieldCheck, color: "text-primary" },
  operator: { label: "Operator", description: "Full access including webhooks, key rotation, profile edits.", icon: ShieldAlert, color: "text-accent" },
};

export default function Safety() {
  const { log } = useLogger();
  const [safetyMode, setSafetyMode] = useState("spectator");
  const [limits, setLimits] = useState<Record<string, RateLimit>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [config, limitsData] = await Promise.all([
          apiGet<{ safety_mode: string }>("/api/config"),
          apiGet<{ success: boolean; limits: Record<string, RateLimit> }>("/api/colony/rate-limits"),
        ]);
        setSafetyMode(config.safety_mode || "spectator");
        setLimits(limitsData.limits || {});
        log("Safety panel loaded", "success");
      } catch (e) {
        log(`Safety load error: ${e}`, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [log]);

  const handleSetTier = async (tier: string) => {
    try {
      await apiPost("/api/config/safety-mode", { mode: tier });
      setSafetyMode(tier);
      log(`Safety tier set to ${tier}`, "success");
    } catch (e) {
      log(`Tier update error: ${e}`, "error");
    }
  };

  const currentTier = TIER_INFO[safetyMode as keyof typeof TIER_INFO] || TIER_INFO.spectator;
  const TierIcon = currentTier.icon;

  if (loading) return <p className="text-sm text-foreground/40">Loading safety panel...</p>;

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Safety" title="Safety Panel" lead="Control your agent's permission tier and monitor rate limits." />

      {/* Current tier */}
      <Card>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-card flex items-center justify-center ${currentTier.color}`}>
            <TierIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">{currentTier.label} Mode</p>
            <p className="text-xs text-foreground/50">{currentTier.description}</p>
          </div>
        </div>
      </Card>

      {/* Tier selector */}
      <Card>
        <CardTitle className="mb-3">Permission Tier</CardTitle>
        <p className="text-xs text-foreground/50 mb-3">Change requires server restart with COLONY_MCP_SAFETY_MODE env var.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(TIER_INFO).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <button
                key={key}
                onClick={() => handleSetTier(key)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  key === safetyMode
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/40 hover:border-border"
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${info.color}`} />
                <p className="text-sm font-medium text-foreground">{info.label}</p>
                <p className="text-[10px] text-foreground/40 mt-0.5">{info.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Rate limits */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <BarChart className="w-4 h-4 text-primary" />
          <CardTitle>Rate Limits</CardTitle>
        </div>
        {Object.keys(limits).length === 0 ? (
          <p className="text-sm text-foreground/40">No rate limit data available.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(limits).map(([key, rl]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground/70 capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="font-mono text-xs">
                    <span className={rl.remaining === 0 ? "text-destructive" : "text-success"}>
                      {rl.remaining}
                    </span>
                    /{rl.limit}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rl.remaining === 0 ? "bg-destructive" : rl.remaining < rl.limit * 0.2 ? "bg-accent" : "bg-primary"
                    }`}
                    style={{ width: `${rl.limit > 0 ? (rl.remaining / rl.limit) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-foreground/40">
                  <Clock className="w-3 h-3" /> Resets: {rl.reset ? new Date(rl.reset).toLocaleString() : "unknown"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
