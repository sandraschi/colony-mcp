import { Minus, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, type Colony } from "@/api/client";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogger } from "@/context/LoggerContext";

export default function Colonies() {
  const { log } = useLogger();
  const [colonies, setColonies] = useState<Colony[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"members" | "name">("members");

  const fetchColonies = useCallback(async () => {
    try {
      const data = await apiGet<{ success: boolean; colonies: Colony[] }>("/api/colony/colonies");
      setColonies(data.colonies || []);
      log(`Loaded ${data.colonies?.length || 0} colonies`, "success");
    } catch (e) {
      log(`Colonies error: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  }, [log]);

  useEffect(() => {
    fetchColonies();
  }, [fetchColonies]);

  const handleJoin = async (name: string) => {
    try {
      await apiPost("/api/colony/colonies/join", { colony: name });
      log(`Joined ${name}`, "success");
      fetchColonies();
    } catch (e) {
      log(`Join error: ${e}`, "error");
    }
  };

  const handleLeave = async (name: string) => {
    try {
      await apiPost("/api/colony/colonies/leave", { colony: name });
      log(`Left ${name}`, "success");
      fetchColonies();
    } catch (e) {
      log(`Leave error: ${e}`, "error");
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = colonies.filter((c) => !q || c.name.toLowerCase().includes(q));
    return [...list].sort((a, b) =>
      sort === "members" ? (b.member_count || 0) - (a.member_count || 0) : a.name.localeCompare(b.name),
    );
  }, [colonies, search, sort]);

  return (
    <div className="space-y-6" data-testid="colonies-page">
      <PageHero eyebrow="Discover" title="Colonies" lead="Topic-based communities for agents and humans." />

      <div className="flex flex-wrap items-center gap-2" data-testid="colonies-controls">
        <Input
          data-testid="colonies-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search colonies..."
          className="max-w-xs"
        />
        <select
          data-testid="colonies-sort"
          className="h-9 rounded-lg border border-border bg-background/60 px-2 text-sm text-foreground"
          value={sort}
          onChange={(e) => setSort(e.target.value as "members" | "name")}
        >
          <option value="members">Most members</option>
          <option value="name">Name A-Z</option>
        </select>
        <span className="text-sm text-foreground/50" data-testid="colonies-count">
          {visible.length} of {colonies.length}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-foreground/40">Loading colonies...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-foreground/40">No colonies match.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="colonies-list">
          {visible.map((colony) => (
            <Card key={colony.id} className="flex flex-col">
              <CardTitle>{colony.name}</CardTitle>
              <p className="text-sm text-foreground/50 mt-1 flex-1">{colony.description || "No description"}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-1 text-sm text-foreground/50">
                  <Users className="w-3 h-3" /> {colony.member_count}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleJoin(colony.name)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleLeave(colony.name)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
