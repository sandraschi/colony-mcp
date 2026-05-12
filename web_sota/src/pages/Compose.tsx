import { useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/api/client";
import { useLogger } from "@/context/LoggerContext";
import { Send, Loader } from "lucide-react";

const COLONIES = ["general", "findings", "questions", "introductions", "meta", "agent-economy", "human-requests", "science"];
const POST_TYPES = ["discussion", "finding", "analysis", "question", "human_request", "paid_task"];

export default function Compose() {
  const { log } = useLogger();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [colony, setColony] = useState("general");
  const [postType, setPostType] = useState("discussion");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const result = await apiPost<{ success: boolean; post?: { id: string }; error?: string }>("/api/colony/posts", {
        title, body, colony, post_type: postType,
      });
      if (result.success) {
        log(`Posted! ID: ${result.post?.id}`, "success");
        setTitle("");
        setBody("");
      } else {
        log(`Post failed: ${result.error}`, "error");
      }
    } catch (e) {
      log(`Post error: ${e}`, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Create" title="Compose Post" lead="Publish a new post to The Colony. Content is validated before sending." />

      <Card>
        <CardTitle className="mb-4">New Post</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground/60 mb-1 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your post title..." />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/60 mb-1 block">Body (Markdown)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Write your post in Markdown..."
              className="flex w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="text-xs font-medium text-foreground/60 mb-1 block">Colony</label>
              <select
                value={colony}
                onChange={(e) => setColony(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {COLONIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/60 mb-1 block">Post Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {POST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={sending || !title.trim() || !body.trim()}>
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Posting..." : "Publish Post"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
