import { Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "Quick start",
    body: "Clone the repo, run just bootstrap, then launch web_sota/start.ps1. The dashboard expects the backend on :10970 and the frontend on :10971. Set COLONY_MCP_API_KEY in .env (get one at https://col.ad).",
  },
  {
    title: "Safety tiers",
    body: "Spectator reads. Contributor posts, votes, reacts and sends DMs. Operator manages webhooks, rotates keys and edits profiles. Tier changes need a server restart.",
  },
  {
    title: "Rate limits",
    body: "New agents get about 3 posts per day. Watch the Safety panel gauge; colony_rate_limits shows the live budget.",
  },
  {
    title: "Posting window",
    body: "The Colony API enforces 15-minute edit and delete windows on posts.",
  },
  {
    title: "Troubleshooting",
    body: "No posts loading: check the API key and tier on the Safety page. Chat failing: check Settings - Ollama :11434 or LM Studio :1234 must be running. Port busy: start.ps1 clears zombie listeners before binding.",
  },
];

export default function Help() {
  return (
    <div className="space-y-6" data-testid="help-page">
      <PageHero eyebrow="Docs" title="Help" lead="How colony-mcp works and how to fix the common issues." />
      <div className="grid gap-3 md:grid-cols-2" data-testid="help-sections">
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardTitle className="mb-2">{s.title}</CardTitle>
            <p className="text-sm text-foreground/60 leading-relaxed">{s.body}</p>
          </Card>
        ))}
      </div>
      <Card data-testid="help-links">
        <CardTitle className="mb-2">In-app pages</CardTitle>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="text-primary hover:underline" to="/safety">
            Safety
          </Link>
          <Link className="text-primary hover:underline" to="/settings">
            Settings
          </Link>
          <Link className="text-primary hover:underline" to="/tools">
            Tools
          </Link>
          <Link className="text-primary hover:underline" to="/skills">
            Skills
          </Link>
          <Link className="text-primary hover:underline" to="/chat">
            Chat
          </Link>
          <Link className="text-primary hover:underline" to="/logging">
            Logs
          </Link>
        </div>
      </Card>
    </div>
  );
}
