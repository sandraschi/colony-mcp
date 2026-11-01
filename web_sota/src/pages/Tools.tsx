import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/api/client";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogger } from "@/context/LoggerContext";

interface Capabilities {
  success: boolean;
  message: string;
  data: { tools: string[]; tool_count: number; version: string };
}

const PAGE_SIZE = 12;

export default function Tools() {
  const { log } = useLogger();
  const [tools, setTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [sort, setSort] = useState<"az" | "za">("az");
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const caps = await apiGet<Capabilities>("/api/capabilities");
        setTools(caps.data?.tools || []);
      } catch (e) {
        setError(`Tool catalog error: ${e}`);
        log(`Tools error: ${e}`, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [log]);

  const domains = useMemo(() => {
    const set = new Set(tools.map((t) => t.split("_")[1] || "other"));
    return ["all", ...[...set].sort()];
  }, [tools]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tools.filter((t) => {
      if (domain !== "all" && (t.split("_")[1] || "other") !== domain) return false;
      return !q || t.toLowerCase().includes(q);
    });
    list = [...list].sort((a, b) => (sort === "az" ? a.localeCompare(b) : b.localeCompare(a)));
    return list;
  }, [tools, search, domain, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6" data-testid="tools-page">
      <PageHero
        eyebrow="Catalog"
        title="Tools"
        lead="Every MCP tool this server exposes, live from /api/capabilities."
      />
      <div className="flex flex-wrap items-center gap-2" data-testid="tools-controls">
        <Input
          data-testid="search-tools"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search tools..."
          className="max-w-xs"
        />
        <select
          data-testid="tools-domain"
          className="h-9 rounded-lg border border-border bg-background/60 px-2 text-sm text-foreground"
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value);
            setPage(0);
          }}
        >
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          data-testid="tools-sort"
          className="h-9 rounded-lg border border-border bg-background/60 px-2 text-sm text-foreground"
          value={sort}
          onChange={(e) => setSort(e.target.value as "az" | "za")}
        >
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
        </select>
        <span className="text-sm text-foreground/50" data-testid="tools-count">
          {filtered.length} of {tools.length} tools
        </span>
      </div>
      <Card>
        <CardTitle className="mb-3">MCP Tools</CardTitle>
        {loading ? (
          <p className="text-sm text-foreground/40">Loading tool catalog...</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3 py-1 rounded border border-border text-sm hover:bg-card"
            >
              Retry
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground/40">No tools match this filter.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDomain("all");
                setPage(0);
              }}
              className="px-3 py-1 rounded border border-border text-sm hover:bg-card"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {visible.map((t) => (
              <div key={t} className="rounded-lg border border-border/40 px-3 py-2">
                <p className="font-mono text-sm text-foreground">{t}</p>
                <p className="text-sm text-foreground/50">Domain: {t.split("_")[1] || "other"}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-4 text-sm text-foreground/50">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage(safePage - 1)}
            className="px-3 py-1 rounded border border-border hover:bg-card disabled:opacity-30"
          >
            Prev
          </button>
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage + 1 >= pageCount}
            onClick={() => setPage(safePage + 1)}
            className="px-3 py-1 rounded border border-border hover:bg-card disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </Card>
    </div>
  );
}
