import Link from "next/link";
import { BadgeCheck, Workflow as WorkflowIcon, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CreatorProfile } from "@/lib/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function CreatorCard({ creator }: { creator: CreatorProfile }) {
  return (
    <Link href={`/creators/${creator.username}`} className="block focus-visible:outline-none">
      <Card className="h-full transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-secondary text-lg font-semibold text-secondary-foreground">
              {initials(creator.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <p className="font-semibold tracking-tight">{creator.display_name}</p>
              {creator.verified_creator && (
                <BadgeCheck className="h-4 w-4 text-platform-blue" aria-label="Verified creator" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{creator.username}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <WorkflowIcon className="h-3.5 w-3.5" aria-hidden />
              {creator.workflow_count} workflows
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" aria-hidden />
              {creator.reputation.toLocaleString()} rep
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
