"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BadgeCheck, Check, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { verifyCreator } from "@/lib/actions/moderation";

export interface CreatorRequest {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  reputation: number;
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function CreatorRequestsQueue({ initialRequests }: { initialRequests: CreatorRequest[] }) {
  const [requests, setRequests] = React.useState(initialRequests);
  const [pending, setPending] = React.useState<string | null>(null);

  async function handle(id: string, approve: boolean) {
    setPending(id);
    const res = await verifyCreator(id, approve);
    setPending(null);
    if (!res.ok) {
      toast.error(res.error ?? "Could not update request.");
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success(approve ? "Creator verified." : "Request rejected.");
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={BadgeCheck}
        title="No pending requests"
        description="Verified creator badge requests will show up here for review."
      />
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between gap-4 p-4">
          <Link href={`/creators/${request.username}`} className="flex min-w-0 items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials(request.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{request.display_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{request.username} · {request.reputation.toLocaleString()} rep
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={pending === request.id}
              onClick={() => handle(request.id, false)}
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Reject
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={pending === request.id}
              onClick={() => handle(request.id, true)}
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> Verify
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
