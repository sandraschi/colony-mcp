import { ArrowRight, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, type Post } from "@/api/client";
import PageHero from "@/components/layout/PageHero";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogger } from "@/context/LoggerContext";

const PAGE_SIZE = 10;

export default function Feed() {
  const { log } = useLogger();
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [colony, setColony] = useState("");
  const [sort, setSort] = useState<"score" | "title">("score");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(
    async (searchQuery?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("query", searchQuery);
        if (colony) params.set("colony", colony);
        params.set("limit", "50");
        const data = await apiGet<{ success: boolean; posts: Post[] }>(`/api/colony/posts?${params}`);
        setPosts(data.posts || []);
        log(`Loaded ${data.posts?.length || 0} posts`, "success");
      } catch (e) {
        log(`Feed error: ${e}`, "error");
      } finally {
        setLoading(false);
      }
    },
    [colony, log],
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchPosts(query);
  };

  const visible = useMemo(() => {
    const sorted = [...posts].sort((a, b) =>
      sort === "score" ? (b.score || 0) - (a.score || 0) : (a.title || "").localeCompare(b.title || ""),
    );
    return sorted;
  }, [posts, sort]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagePosts = visible.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6" data-testid="feed-page">
      <PageHero
        eyebrow="Discover"
        title="Feed Browser"
        lead="Search and browse posts across all colonies. Filter by colony and post type."
      />

      <form onSubmit={handleSearch} className="flex gap-2 flex-wrap" data-testid="feed-controls">
        <Input
          data-testid="feed-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="max-w-sm"
        />
        <Input
          data-testid="feed-colony"
          value={colony}
          onChange={(e) => setColony(e.target.value)}
          placeholder="Colony slug (e.g. findings)"
          className="max-w-[180px]"
        />
        <select
          data-testid="feed-sort"
          className="h-9 rounded-lg border border-border bg-background/60 px-2 text-sm text-foreground"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as "score" | "title");
            setPage(0);
          }}
        >
          <option value="score">Top score</option>
          <option value="title">Title A-Z</option>
        </select>
        <button
          type="submit"
          data-testid="feed-search-button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-background text-sm font-medium hover:bg-primary/90"
        >
          <Search className="w-4 h-4" /> Search
        </button>
        <span className="text-sm text-foreground/50 self-center" data-testid="feed-count">
          {visible.length} posts
        </span>
      </form>

      {loading ? (
        <p className="text-sm text-foreground/40">Loading posts...</p>
      ) : pagePosts.length === 0 ? (
        <p className="text-sm text-foreground/40">No posts found.</p>
      ) : (
        <div className="space-y-3" data-testid="feed-list">
          {pagePosts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{post.title}</p>
                    <p className="text-sm text-foreground/50 mt-1 line-clamp-2">{post.body?.slice(0, 200)}</p>
                    <div className="flex gap-3 mt-2 text-[11px] text-foreground/40">
                      <span>{post.author_username}</span>
                      <span>{post.colony}</span>
                      <span>{post.score} pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {post.post_type}
                    </span>
                    <ArrowRight className="w-4 h-4 text-foreground/30" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
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
