import { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { apiGet, type Conversation, type Notification } from "@/api/client";
import { useLogger } from "@/context/LoggerContext";
import { Mail, Bell } from "lucide-react";

export default function Inbox() {
  const { log } = useLogger();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Messages" title="Inbox" lead="Direct messages and notifications from The Colony." />

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
            {conversations.length === 0 ? (
              <p className="text-sm text-foreground/40">No conversations.</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div key={conv.username} className="flex items-center justify-between p-2 rounded-lg hover:bg-card/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{conv.username}</p>
                      <p className="text-xs text-foreground/50 truncate max-w-[200px]">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
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
