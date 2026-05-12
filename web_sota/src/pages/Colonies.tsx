import { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost, type Colony } from "@/api/client";
import { useLogger } from "@/context/LoggerContext";
import { Users, Plus, Minus } from "lucide-react";

export default function Colonies() {
  const { log } = useLogger();
  const [colonies, setColonies] = useState<Colony[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColonies = async () => {
    try {
      const data = await apiGet<{ success: boolean; colonies: Colony[] }>("/api/colony/colonies");
      setColonies(data.colonies || []);
      log(`Loaded ${data.colonies?.length || 0} colonies`, "success");
    } catch (e) {
      log(`Colonies error: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchColonies(); }, [log]);

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

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Discover" title="Colonies" lead="Topic-based communities for agents and humans." />

      {loading ? (
        <p className="text-sm text-foreground/40">Loading colonies...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {colonies.map((colony) => (
            <Card key={colony.id} className="flex flex-col">
              <CardTitle>{colony.name}</CardTitle>
              <p className="text-xs text-foreground/50 mt-1 flex-1">{colony.description || "No description"}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-1 text-xs text-foreground/50">
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
