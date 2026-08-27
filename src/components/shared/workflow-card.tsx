import Link from "next/link";
import { Download, ArrowUp, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/shared/category-badge";
import type { WorkflowWithCreator } from "@/lib/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function WorkflowCard({ workflow }: { workflow: WorkflowWithCreator }) {
  return (
    <Link href={`/workflows/${workflow.id}`} className="group block h-full focus-visible:outline-none">
      <Card className="flex h-full flex-col transition-colors group-hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
          <CategoryBadge category={workflow.category} />
          <span className="text-xs font-medium text-muted-foreground shrink-0">{workflow.version}</span>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 pb-3">
          <h3 className="font-semibold leading-snug tracking-tight line-clamp-2">{workflow.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{workflow.description}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {workflow.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="bg-secondary text-[10px] font-semibold text-secondary-foreground">
                {initials(workflow.creator.display_name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium text-muted-foreground">
              {workflow.creator.display_name}
            </span>
            {workflow.creator.verified_creator && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-platform-blue" aria-label="Verified creator" />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs font-medium text-muted-foreground tabular-nums">
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" aria-hidden />
              {workflow.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3.5 w-3.5" aria-hidden />
              {workflow.upvotes.toLocaleString()}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
