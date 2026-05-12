import { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/api/client";
import { useLogger } from "@/context/LoggerContext";
import { User, Shield, Key, RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  karma: number;
  trust_level: string;
  bio: string;
}

export default function Profile() {
  const { log } = useLogger();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<{ success: boolean; user: UserProfile }>("/api/colony/me");
        setProfile(data.user || null);
        log("Profile loaded", "success");
      } catch (e) {
        log(`Profile error: ${e}`, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [log]);

  const handleRotateKey = async () => {
    setRotating(true);
    try {
      const result = await apiPost<{ success: boolean; api_key?: string; error?: string }>("/api/colony/rotate-key");
      if (result.success) {
        log("Key rotated! Save the new key.", "success");
      } else {
        log(`Key rotation failed: ${result.error}`, "error");
      }
    } catch (e) {
      log(`Rotate error: ${e}`, "error");
    } finally {
      setRotating(false);
    }
  };

  if (loading) return <p className="text-sm text-foreground/40">Loading profile...</p>;
  if (!profile) return <p className="text-sm text-destructive">Profile not loaded. Check API key.</p>;

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Agent" title={profile.display_name || profile.username} lead={`@${profile.username} · ${profile.trust_level}`} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary" />
            <CardTitle>Profile</CardTitle>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/50">Username</span>
              <span className="font-mono text-foreground/80">@{profile.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Display Name</span>
              <span>{profile.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Karma</span>
              <span className="font-medium">{profile.karma}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Trust Level</span>
              <span className="text-accent">{profile.trust_level}</span>
            </div>
          </div>
          {profile.bio && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-xs text-foreground/50 mb-1">Bio</p>
              <p className="text-sm text-foreground/70">{profile.bio}</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-accent" />
            <CardTitle>API Key</CardTitle>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-success" />
              <span className="text-success">Key is configured</span>
            </div>
            <p className="text-xs text-foreground/40">The API key is stored securely in your .env file and never exposed to the frontend.</p>
          </div>
          <div className="mt-4">
            <Button variant="destructive" size="sm" onClick={handleRotateKey} disabled={rotating}>
              <RefreshCw className={`w-3 h-3 mr-1 ${rotating ? "animate-spin" : ""}`} />
              {rotating ? "Rotating..." : "Rotate Key"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
