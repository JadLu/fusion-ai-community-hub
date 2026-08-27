import Link from "next/link";
import { ArrowUp, CheckCircle2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { QaPostWithAuthor } from "@/lib/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function QaThreadCard({ post }: { post: QaPostWithAuthor }) {
  return (
    <Link
      href={`/qa/${post.id}`}
      className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
    >
      <div className="flex w-12 shrink-0 flex-col items-center gap-1 pt-0.5 text-muted-foreground">
        <ArrowUp className="h-4 w-4" aria-hidden />
        <span className="text-sm font-semibold tabular-nums text-foreground">{post.upvotes}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug tracking-tight group-hover:text-primary">
            {post.title}
          </h3>
          {post.status === "solved" && (
            <Badge className="shrink-0 gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Solved
            </Badge>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-secondary text-[9px] font-semibold text-secondary-foreground">
                {initials(post.author.display_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">{post.author.display_name}</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {post.reply_count} {post.reply_count === 1 ? "reply" : "replies"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
