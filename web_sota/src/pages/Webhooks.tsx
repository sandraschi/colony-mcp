import { Link, Loader, Plus, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, type Webhook } from "@/api/client";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogger } from "@/context/LoggerContext";

export default function Webhooks() {
  const { log } = useLogger();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState("post.created,comment.created");
  const [creating, setCreating] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const data = await apiGet<{ success: boolean; webhooks: Webhook[] }>("/api/colony/webhooks");
      setWebhooks(data.webhooks || []);
      log(`Loaded ${data.webhooks?.length || 0} webhooks`, "success");
    } catch (e) {
      log(`Webhooks error: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  }, [log]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !secret.trim()) return;
    setCreating(true);
    try {
      const result = await apiPost<{ success: boolean; error?: string }>("/api/colony/webhooks", {
        url: url.trim(),
        events: events.split(",").map((s) => s.trim()),
        secret: secret.trim(),
      });
      if (result.success) {
        log("Webhook created!", "success");
        setUrl("");
        setSecret("");
        fetchWebhooks();
      } else {
        log(`Webhook create failed: ${result.error}`, "error");
      }
    } catch (e) {
      log(`Create error: ${e}`, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/colony/webhooks/${id}`);
      log(`Webhook ${id} deleted`, "success");
      fetchWebhooks();
    } catch (e) {
      log(`Delete error: ${e}`, "error");
    }
  };

  return (
    <div className="space-y-6" data-testid="webhooks-page">
      <PageHero
        eyebrow="Integrations"
        title="Webhooks"
        lead="Register webhooks for real-time Colony events. Operator tier required."
      />

      {/* Create form */}
      <Card data-testid="webhook-create">
        <CardTitle className="mb-3">Register New Webhook</CardTitle>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label htmlFor="wh-url" className="text-sm font-medium text-foreground/60 mb-1 block">
              Callback URL
            </label>
            <Input
              id="wh-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://my-app.com/colony-hooks"
            />
          </div>
          <div>
            <label htmlFor="wh-secret" className="text-sm font-medium text-foreground/60 mb-1 block">
              HMAC Secret (min 16 chars)
            </label>
            <Input
              id="wh-secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="your-shared-secret-min-16-chars"
            />
          </div>
          <div>
            <label htmlFor="wh-events" className="text-sm font-medium text-foreground/60 mb-1 block">
              Events (comma-separated)
            </label>
            <Input id="wh-events" value={events} onChange={(e) => setEvents(e.target.value)} />
          </div>
          <Button type="submit" disabled={creating || !url.trim() || !secret.trim()}>
            {creating ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? "Creating..." : "Register Webhook"}
          </Button>
        </form>
      </Card>

      {/* Existing webhooks */}
      <Card data-testid="webhook-list">
        <div className="flex items-center gap-2 mb-3">
          <WebhookIcon className="w-4 h-4 text-primary" />
          <CardTitle>Registered Webhooks</CardTitle>
        </div>
        {loading ? (
          <p className="text-sm text-foreground/40">Loading webhooks...</p>
        ) : webhooks.length === 0 ? (
          <p className="text-sm text-foreground/40">No webhooks registered.</p>
        ) : (
          <div className="space-y-2">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link className="w-3 h-3 text-foreground/40 shrink-0" />
                    <p className="text-sm font-mono text-foreground/70 truncate">{wh.url}</p>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {(wh.events || []).slice(0, 3).map((evt) => (
                      <span key={evt} className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary">
                        {evt}
                      </span>
                    ))}
                    {(wh.events || []).length > 3 && (
                      <span className="text-[9px] text-foreground/40">+{wh.events.length - 3}</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(wh.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
