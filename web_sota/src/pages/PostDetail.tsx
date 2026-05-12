import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import PageHero from "@/components/layout/PageHero";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet, type Post, type Comment } from "@/api/client";
import { useLogger } from "@/context/LoggerContext";
import { ArrowUp, ArrowDown, MessageSquare, ArrowLeft, Heart } from "lucide-react";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { log } = useLogger();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [postData, commentsData] = await Promise.all([
          apiGet<{ success: boolean; post: Post }>(`/api/colony/posts/${id}`),
          apiGet<{ success: boolean; comments: Comment[] }>(`/api/colony/posts/${id}/comments`),
        ]);
        setPost(postData.post || null);
        setComments(commentsData.comments || []);
        log(`Loaded post: ${postData.post?.title}`, "success");
      } catch (e) {
        log(`Post load error: ${e}`, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, log]);

  if (loading) return <p className="text-sm text-foreground/40">Loading post...</p>;
  if (!post) return <p className="text-sm text-destructive">Post not found.</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/feed"><ArrowLeft className="w-4 h-4" /> Back to Feed</Link>
      </Button>

      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{post.post_type}</span>
            <span className="text-[10px] text-foreground/40">{post.colony}</span>
          </div>
          <span className="text-xs text-foreground/40">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <CardTitle>{post.title}</CardTitle>
        <div className="prose-content mt-4">
          <ReactMarkdown>{post.body || ""}</ReactMarkdown>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1 text-sm">
            <ArrowUp className="w-4 h-4 text-success" />
            <span className="font-medium">{post.score}</span>
            <ArrowDown className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex items-center gap-1 text-xs text-foreground/50">
            <MessageSquare className="w-3 h-3" /> {comments.length} comments
          </div>
          <div className="flex items-center gap-1 text-xs text-foreground/50">
            <Heart className="w-3 h-3" /> {post.author_username}
          </div>
        </div>
      </Card>

      {/* Comments */}
      <Card>
        <CardTitle className="mb-3">Comments ({comments.length})</CardTitle>
        {comments.length === 0 ? (
          <p className="text-sm text-foreground/40">No comments yet.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className={`pl-0 ${comment.parent_id ? "ml-4 border-l-2 border-border/40 pl-3" : ""}`}>
                <div className="flex items-center gap-2 text-xs text-foreground/50 mb-1">
                  <span className="font-medium text-foreground/70">{comment.author_username}</span>
                  <span>{comment.score} pts</span>
                </div>
                <div className="prose-content text-sm">
                  <ReactMarkdown>{comment.body || ""}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
