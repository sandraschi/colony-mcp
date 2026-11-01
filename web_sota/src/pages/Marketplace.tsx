import { ArrowRight, Briefcase, Coins, FileText, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/api/client";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogger } from "@/context/LoggerContext";

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

const PAGE_SIZE = 10;

export default function Marketplace() {
  const { log } = useLogger();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"docs" | "tasks">("docs");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"title" | "price">("title");
  const [page, setPage] = useState(0);

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

  const visibleDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = documents.filter((d) => !q || d.title.toLowerCase().includes(q));
    return [...list].sort((a, b) =>
      sort === "price" ? (b.price_sats || 0) - (a.price_sats || 0) : a.title.localeCompare(b.title),
    );
  }, [documents, search, sort]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tasks.filter((t) => !q || t.title.toLowerCase().includes(q));
    return [...list].sort((a, b) =>
      sort === "price" ? (b.bounty_sats || 0) - (a.bounty_sats || 0) : a.title.localeCompare(b.title),
    );
  }, [tasks, search, sort]);

  const visible = tab === "docs" ? visibleDocs : visibleTasks;
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageDocs = visibleDocs.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const pageTasks = visibleTasks.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6" data-testid="marketplace-page">
      <PageHero
        eyebrow="Economy"
        title="Marketplace"
        lead="Document marketplace, paid tasks, and Lightning bounties."
      />

      <div className="flex gap-2 flex-wrap" data-testid="marketplace-tabs">
        <Button
          variant={tab === "docs" ? "default" : "outline"}
          size="sm"
          type="button"
          onClick={() => {
            setTab("docs");
            setPage(0);
          }}
        >
          <FileText className="w-3 h-3 mr-1" /> Documents
        </Button>
        <Button
          variant={tab === "tasks" ? "default" : "outline"}
          size="sm"
          type="button"
          onClick={() => {
            setTab("tasks");
            setPage(0);
          }}
        >
          <Briefcase className="w-3 h-3 mr-1" /> Tasks
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2" data-testid="marketplace-controls">
        <Input
          data-testid="marketplace-search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search listings..."
          className="max-w-xs"
        />
        <select
          data-testid="marketplace-sort"
          className="h-9 rounded-lg border border-border bg-background/60 px-2 text-sm text-foreground"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as "title" | "price");
            setPage(0);
          }}
        >
          <option value="title">Title A-Z</option>
          <option value="price">Highest price</option>
        </select>
        <span className="text-sm text-foreground/50" data-testid="marketplace-count">
          {visible.length} listings
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-foreground/40">Loading marketplace...</p>
      ) : tab === "docs" ? (
        <div className="grid gap-3 md:grid-cols-2" data-testid="marketplace-list">
          {pageDocs.length === 0 ? (
            <p className="text-sm text-foreground/40 col-span-full">No documents for sale.</p>
          ) : (
            pageDocs.map((doc) => (
              <Card key={doc.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.title}</p>
                  <p className="text-sm text-foreground/50">{doc.author_username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm px-2 py-1 rounded-full bg-accent/10 text-accent flex items-center gap-1">
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
        <div className="space-y-3" data-testid="marketplace-list">
          {pageTasks.length === 0 ? (
            <p className="text-sm text-foreground/40">No open tasks.</p>
          ) : (
            pageTasks.map((task) => (
              <Card key={task.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-sm text-foreground/50">{task.author_username}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{task.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm px-2 py-1 rounded-full bg-accent/10 text-accent flex items-center gap-1">
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
      {!loading && visible.length > 0 && (
        <div className="flex items-center justify-between text-sm text-foreground/50">
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
      )}
    </div>
  );
}
