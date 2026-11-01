import { useCallback, useEffect, useRef, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card } from "@/components/ui/card";
import { useLogger } from "@/context/LoggerContext";
import { API_BASE } from "../lib/api";
import { useLlmStore } from "../store/llm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const PERSONALITIES = [
  { id: "helpful", label: "Helpful", prompt: "You are a helpful assistant." },
  {
    id: "expert",
    label: "Expert",
    prompt: "You are an expert technical assistant. Provide detailed, precise answers.",
  },
  { id: "concise", label: "Concise", prompt: "You are a concise assistant. Give brief, to-the-point answers." },
  { id: "custom", label: "Custom", prompt: "You are a helpful assistant. Adapt to the user's style." },
];

const EXAMPLES = ["What can you do?", "Show me the current status", "Help me understand this system"];

export default function Chat() {
  const { log } = useLogger();
  const provider = useLlmStore((s) => s.provider);
  const setProvider = useLlmStore((s) => s.setProvider);
  const model = useLlmStore((s) => s.model);
  const setModel = useLlmStore((s) => s.setModel);
  const [chat, setChat] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<{ id: string; label: string; detected: boolean }[]>([]);
  const [modelList, setModelList] = useState<string[]>([]);
  const [skillName, setSkillName] = useState("");
  const [personality, setPersonality] = useState("helpful");
  const [ready, setReady] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chat_page");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Message>[];
        setChat(parsed.map((m) => ({ id: m.id ?? newId(), role: m.role ?? "assistant", content: m.content ?? "" })));
      }
      const savedP = localStorage.getItem("chat_personality");
      if (savedP) setPersonality(savedP);
    } catch {}
  }, []);

  useEffect(() => {
    if (chat.length > 0) {
      localStorage.setItem("chat_page", JSON.stringify(chat.slice(-100)));
    } else {
      localStorage.removeItem("chat_page");
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const refreshProviders = useCallback(async () => {
    try {
      const [prov, models, skills, onb] = await Promise.all([
        fetch(`${API_BASE}/api/llm/providers`).then((r) => r.json()),
        fetch(`${API_BASE}/api/llm/models?provider=${provider}`).then((r) => r.json()),
        fetch(`${API_BASE}/api/skills`).then((r) => r.json()),
        fetch(`${API_BASE}/api/llm/onboarding`).then((r) => r.json()),
      ]);
      setProviders(prov.providers || []);
      const list: string[] = models.models || [];
      setModelList(list);
      if (!model && list.length > 0) setModel(list[0]);
      if (Array.isArray(skills) && skills.length > 0) setSkillName(skills[0].name || String(skills[0]));
      setReady(onb.ready ?? null);
    } catch (e) {
      log(`Chat providers error: ${e}`, "error");
    }
  }, [provider, model, setModel, log]);

  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setChat((prev) => [...prev, { id: newId(), role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const sp = PERSONALITIES.find((p) => p.id === personality);
      const system = skillName ? `${sp?.prompt ?? ""} Active skill: ${skillName}.` : sp?.prompt;
      const r = await fetch(`${API_BASE}/api/llm/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, prompt: trimmed, system }),
      });
      const data = await r.json();
      setChat((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: data.response || data.error || "No response" },
      ]);
    } catch {
      setChat((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: "Request failed. Is the backend running?" },
      ]);
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (chat.length === 0) return;
    const lines = chat.map((m) => `[${m.role.toUpperCase()}] ${m.content}`);
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-export.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setChat([]);
    localStorage.removeItem("chat_page");
  };

  return (
    <div className="space-y-6" data-testid="chat-page">
      <PageHero
        eyebrow="Assistant"
        title="Chat"
        lead="Talk to a local model through the backend proxy. Keys never leave the server."
      />
      <div className="flex flex-wrap items-center gap-2" data-testid="chat-controls">
        <span
          data-testid="llm-status"
          className={`inline-flex items-center gap-1.5 text-sm ${ready === false ? "text-amber-300" : ready ? "text-emerald-300" : "text-slate-300"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${ready === false ? "bg-amber-400" : ready ? "bg-emerald-400" : "bg-slate-500"}`}
          />
          {ready === false ? "No local LLM detected" : ready ? "LLM ready" : "Checking LLM..."}
        </span>
        {skillName && <span className="text-sm text-cyan-300">Skill: {skillName}</span>}
        <select
          data-testid="personality-select"
          className="bg-slate-800 border border-slate-600 rounded text-sm px-2 py-1 text-slate-200"
          value={personality}
          onChange={(e) => {
            setPersonality(e.target.value);
            try {
              localStorage.setItem("chat_personality", e.target.value);
            } catch {}
          }}
        >
          {PERSONALITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          data-testid="llm-provider-select"
          className="bg-slate-800 border border-slate-600 rounded text-sm px-2 py-1 text-slate-200"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          {providers.length === 0 && <option value={provider}>{provider}</option>}
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
              {p.detected ? "" : " (not detected)"}
            </option>
          ))}
        </select>
        <select
          data-testid="llm-model-select"
          className="bg-slate-800 border border-slate-600 rounded text-sm px-2 py-1 text-slate-200"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {modelList.length === 0 && <option value={model || ""}>{model || "no models"}</option>}
          {modelList.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          type="button"
          data-testid="chat-export"
          onClick={handleExport}
          disabled={chat.length === 0}
          className="px-3 py-1 rounded border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30"
        >
          Export
        </button>
        <button
          type="button"
          data-testid="chat-clear"
          onClick={handleClear}
          disabled={chat.length === 0}
          className="px-3 py-1 rounded border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30"
        >
          Clear
        </button>
      </div>
      <Card>
        <div data-testid="chat-messages" className="space-y-3 min-h-[200px] max-h-[55vh] overflow-y-auto">
          {chat.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-300 mb-3">Ask about The Colony, your drafts, or the tool catalog.</p>
              <div className="flex flex-wrap justify-center gap-2" data-testid="example-prompts">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => sendMessage(ex)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-3 py-1.5 rounded-full border border-slate-700"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 whitespace-pre-wrap text-sm ${
                  msg.role === "user" ? "bg-cyan-800 text-cyan-100" : "bg-slate-800 text-slate-300"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-slate-300 text-sm animate-pulse">Thinking...</div>}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 mt-3">
          <input
            data-testid="chat-input"
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage(input);
            }}
          />
          <button
            type="button"
            data-testid="chat-send"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Send
          </button>
        </div>
      </Card>
    </div>
  );
}
