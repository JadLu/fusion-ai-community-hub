import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUp, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { QaPost, QaReply } from "@/lib/types";

interface Author {
  username: string;
  display_name: string;
  avatar_url: string | null;
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

async function getPost(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qa_posts")
    .select("*, author:profiles(username, display_name, avatar_url)")
    .eq("id", id)
    .maybeSingle();
  return data as (QaPost & { author: Author }) | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  return { title: post?.title ?? "Question" };
}

export default async function QaThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const supabase = await createClient();
  const { data: replyRows } = await supabase
    .from("qa_replies")
    .select("*, author:profiles(username, display_name, avatar_url)")
    .eq("post_id", post.id);

  const replies = ((replyRows ?? []) as (QaReply & { author: Author })[]).sort((a, b) => {
    if (a.is_solution !== b.is_solution) return a.is_solution ? -1 : 1;
    return b.upvotes - a.upvotes;
  });

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex w-10 shrink-0 flex-col items-center gap-1 pt-1 text-muted-foreground">
          <ArrowUp className="h-5 w-5" aria-hidden />
          <span className="text-base font-semibold tabular-nums text-foreground">{post.upvotes}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {post.status === "solved" && (
              <Badge className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" aria-hidden /> Solved
              </Badge>
            )}
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{post.body}</p>
          <div className="flex items-center gap-2 pt-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-secondary text-[10px] font-semibold text-secondary-foreground">
                {initials(post.author.display_name)}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/creators/${post.author.username}`}
              className="text-xs font-medium hover:text-primary"
            >
              {post.author.display_name}
            </Link>
            <span className="text-xs text-muted-foreground">asked {formatDate(post.created_at)}</span>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      <h2 className="mb-4 text-sm font-semibold">
        {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
      </h2>

      {replies.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          No replies yet — be the first to help.
        </p>
      ) : (
        <div className="space-y-4">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4",
                reply.is_solution ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card",
              )}
            >
              <div className="flex w-8 shrink-0 flex-col items-center gap-1 pt-0.5 text-muted-foreground">
                <ArrowUp className="h-4 w-4" aria-hidden />
                <span className="text-sm font-semibold tabular-nums text-foreground">{reply.upvotes}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {reply.is_solution && (
                  <Badge className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" aria-hidden /> Accepted solution
                  </Badge>
                )}
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{reply.body}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-secondary text-[9px] font-semibold text-secondary-foreground">
                      {initials(reply.author.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/creators/${reply.author.username}`}
                    className="text-xs font-medium hover:text-primary"
                  >
                    {reply.author.display_name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator className="my-8" />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Your answer</h2>
        <Textarea placeholder="Sign in to post a reply…" rows={4} disabled />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <Link href={`/login?next=/qa/${post.id}`} className="font-medium text-primary hover:underline">
              Log in
            </Link>{" "}
            to reply to this thread.
          </p>
          <Button disabled>Post reply</Button>
        </div>
      </div>
    </div>
  );
}
