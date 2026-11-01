import { useCallback, useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { useLogger } from "@/context/LoggerContext";
import { API_BASE } from "../lib/api";
import { useLlmStore } from "../store/llm";

interface Provider {
  id: string;
  label: string;
  detected: boolean;
  models: string[];
}

export default function Settings() {
  const { log } = useLogger();
  const provider = useLlmStore((s) => s.provider);
  const setProvider = useLlmStore((s) => s.setProvider);
  const model = useLlmStore((s) => s.model);
  const setModel = useLlmStore((s) => s.setModel);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [ready, setReady] = useState<boolean | null>(null);
  const [onboarding, setOnboarding] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [prov, mods, onb] = await Promise.all([
        fetch(`${API_BASE}/api/llm/providers`).then((r) => r.json()),
        fetch(`${API_BASE}/api/llm/models?provider=${provider}`).then((r) => r.json()),
        fetch(`${API_BASE}/api/llm/onboarding`).then((r) => r.json()),
      ]);
      setProviders(prov.providers || []);
      setModels(mods.models || []);
      setReady(onb.ready ?? null);
      setOnboarding(onb.message || "");
    } catch (e) {
      log(`Settings error: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  }, [provider, log]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6" data-testid="settings-page">
      <PageHero
        eyebrow="Configure"
        title="Settings"
        lead="Local LLM providers and models. Everything runs on your machine."
      />
      {ready === false && (
        <Card data-testid="llm-onboarding">
          <CardTitle className="mb-2">Get a local model</CardTitle>
          <p className="text-sm text-foreground/60" data-testid="onboarding-cue">
            {onboarding || "No local LLM detected. Install Ollama or LM Studio to enable chat."}
          </p>
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Provider</CardTitle>
          {loading ? (
            <p className="text-sm text-foreground/40">Detecting providers...</p>
          ) : (
            <div className="space-y-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`llm-provider-card-${p.id}`}
                  onClick={() => setProvider(p.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 ${
                    provider === p.id ? "border-primary/60 bg-primary/10" : "border-border/40 hover:border-border"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className={`w-2 h-2 rounded-full ${p.detected ? "bg-emerald-400" : "bg-slate-500"}`} />
                    {p.label}
                  </span>
                  <span className="text-sm text-foreground/50">{p.detected ? "Detected" : "Not detected"}</span>
                </button>
              ))}
              {providers.length === 0 && <p className="text-sm text-foreground/40">No providers reported.</p>}
            </div>
          )}
        </Card>
        <Card>
          <CardTitle className="mb-3">Model</CardTitle>
          <label htmlFor="settings-model" className="text-sm text-foreground/60 mb-1 block">
            Active model for chat
          </label>
          <select
            id="settings-model"
            data-testid="llm-model-select"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {models.length === 0 && <option value={model || ""}>{model || "no models detected"}</option>}
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <label htmlFor="settings-provider" className="text-sm text-foreground/60 mt-3 mb-1 block">
            Provider id
          </label>
          <select
            id="settings-provider"
            data-testid="llm-provider-select"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-foreground/50 mt-3">
            GPU: local models use your GPU automatically when Ollama or LM Studio is configured for it.
          </p>
        </Card>
      </div>
    </div>
  );
}
