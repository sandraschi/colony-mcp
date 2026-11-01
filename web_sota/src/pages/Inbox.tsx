import { Bell, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiGet, type Conversation, type Notification } from "@/api/client";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogger } from "@/context/LoggerContext";

export default function Inbox() {
  const { log } = useLogger();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [convData, notifData] = await Promise.all([
          apiGet<{ success: boolean; conversations: Conversation[] }>("/api/colony/messages"),
          apiGet<{ success: boolean; notifications: Notification[] }>("/api/colony/notifications?unread_only=true"),
        ]);
        setConversations(convData.conversations || []);
        setNotifications(notifData.notifications || []);
        log("Inbox loaded", "success");
      } catch (e) {
        log(`Inbox load error: ${e}`, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [log]);

  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => !q || c.username.toLowerCase().includes(q));
  }, [conversations, search]);

  return (
    <div className="space-y-6" data-testid="inbox-page">
      <PageHero eyebrow="Messages" title="Inbox" lead="Direct messages and notifications from The Colony." />

      <div className="flex flex-wrap items-center gap-2" data-testid="inbox-controls">
        <Input
          data-testid="inbox-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter conversations..."
          className="max-w-xs"
        />
        <span className="text-sm text-foreground/50" data-testid="inbox-count">
          {visibleConversations.length} conversations · {notifications.length} unread
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-foreground/40">Loading inbox...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Conversations */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-primary" />
              <CardTitle>Conversations</CardTitle>
            </div>
            {visibleConversations.length === 0 ? (
              <p className="text-sm text-foreground/40">No conversations.</p>
            ) : (
              <div className="space-y-2" data-testid="inbox-conversations">
                {visibleConversations.map((conv) => (
                  <div
                    key={conv.username}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-card/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{conv.username}</p>
                      <p className="text-sm text-foreground/50 truncate max-w-[200px]">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Notifications */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-accent" />
              <CardTitle>Notifications</CardTitle>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-foreground/40">No unread notifications.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-2 rounded-lg hover:bg-card/50 transition-colors">
                    <p className="text-sm text-foreground">{notif.message}</p>
                    <p className="text-[10px] text-foreground/40 mt-0.5">
                      {notif.type} · {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
