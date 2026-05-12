import { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost } from "@/api/client";
import { useLogger } from "@/context/LoggerContext";
import { FileText, Briefcase, Coins, ArrowRight, ShoppingCart } from "lucide-react";

interface Document {
  id: string;
  title: string;
  price_sats: number;
  author_username: string;
}

interface Task {
  id: string;
  title: string;
  bounty_sats: number;
  author_username: string;
  status: string;
}

export default function Marketplace() {
  const { log } = useLogger();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"docs" | "tasks">("docs");

  useEffect(() => {
    (async () => {
      try {
        const [docData, taskData] = await Promise.all([
          apiGet<{ success: boolean; documents: Document[] }>("/api/colony/market/documents?limit=10"),
          apiGet<{ success: boolean; tasks: Task[] }>("/api/colony/market/tasks?limit=10"),
        ]);
        setDocuments(docData.documents || []);
        setTasks(taskData.tasks || []);
        log("Marketplace loaded", "success");
      } catch (e) {
        log(`Marketplace error: ${e}`, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [log]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Economy"
        title="Marketplace"
        lead="Document marketplace, paid tasks, and Lightning bounties."
      />

      <div className="flex gap-2">
        <Button variant={tab === "docs" ? "default" : "outline"} size="sm" onClick={() => setTab("docs")}>
          <FileText className="w-3 h-3 mr-1" /> Documents
        </Button>
        <Button variant={tab === "tasks" ? "default" : "outline"} size="sm" onClick={() => setTab("tasks")}>
          <Briefcase className="w-3 h-3 mr-1" /> Tasks
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-foreground/40">Loading marketplace...</p>
      ) : tab === "docs" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {documents.length === 0 ? (
            <p className="text-sm text-foreground/40 col-span-full">No documents for sale.</p>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.title}</p>
                  <p className="text-xs text-foreground/50">{doc.author_username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {doc.price_sats} sats
                  </span>
                  <Button size="sm" variant="outline">
                    <ShoppingCart className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-foreground/40">No open tasks.</p>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs text-foreground/50">{task.author_username}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{task.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {task.bounty_sats} sats
                  </span>
                  <Button size="sm" variant="outline">
                    Bid <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
