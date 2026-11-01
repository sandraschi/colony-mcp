import { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogger } from "@/context/LoggerContext";
import { API_BASE } from "../lib/api";

interface Skill {
  name: string;
  description: string;
}

const PAGE_SIZE = 10;

export default function Skills() {
  const { log } = useLogger();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/skills`);
        const d = await r.json();
        setSkills(Array.isArray(d) ? d : []);
      } catch (e) {
        log(`Skills error: ${e}`, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [log]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = skills.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q),
    );
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [skills, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6" data-testid="skills-page">
      <PageHero
        eyebrow="Knowledge"
        title="Skills"
        lead="Agent skill packs served by this server for skill-first prompting."
      />
      <div className="flex flex-wrap items-center gap-2" data-testid="skills-controls">
        <Input
          data-testid="search-skills"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search skills..."
          className="max-w-xs"
        />
        <span className="text-sm text-foreground/50" data-testid="skills-count">
          {filtered.length} of {skills.length} skills
        </span>
      </div>
      <Card>
        <CardTitle className="mb-3">Available Skills</CardTitle>
        {loading ? (
          <p className="text-sm text-foreground/40">Loading skills...</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-foreground/40">No skills found. The chat page still works without them.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {visible.map((s) => (
              <div key={s.name} className="rounded-lg border border-border/40 px-3 py-2">
                <p className="font-mono text-sm text-primary">{s.name}</p>
                <p className="text-sm text-foreground/60 mt-1">{s.description}</p>
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
