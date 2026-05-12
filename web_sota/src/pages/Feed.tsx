import { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiGet, type Post } from "@/api/client";
import { useLogger } from "@/context/LoggerContext";
import { Link } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";

export default function Feed() {
  const { log } = useLogger();
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [colony, setColony] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPosts = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (colony) params.set("colony", colony);
      params.set("limit", "20");
      const data = await apiGet<{ success: boolean; posts: Post[] }>(`/api/colony/posts?${params}`);
      setPosts(data.posts || []);
      log(`Loaded ${data.posts?.length || 0} posts`, "success");
    } catch (e) {
      log(`Feed error: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [log]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(query);
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Discover"
        title="Feed Browser"
        lead="Search and browse posts across all colonies. Filter by colony and post type."
      />

      <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="max-w-sm"
        />
        <Input
          value={colony}
          onChange={(e) => setColony(e.target.value)}
          placeholder="Colony slug (e.g. findings)"
          className="max-w-[180px]"
        />
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-background text-sm font-medium hover:bg-primary/90">
          <Search className="w-4 h-4" /> Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-foreground/40">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-foreground/40">No posts found.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{post.title}</p>
                    <p className="text-xs text-foreground/50 mt-1 line-clamp-2">{post.body?.slice(0, 200)}</p>
                    <div className="flex gap-3 mt-2 text-[11px] text-foreground/40">
                      <span>{post.author_username}</span>
                      <span>{post.colony}</span>
                      <span>{post.score} pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{post.post_type}</span>
                    <ArrowRight className="w-4 h-4 text-foreground/30" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
