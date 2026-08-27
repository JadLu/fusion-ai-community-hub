"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteWorkflow } from "@/lib/actions/workflows";

export function DeleteWorkflowButton({ workflowId, title }: { workflowId: string; title: string }) {
  const [pending, setPending] = React.useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" aria-hidden /> Delete workflow
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the workflow, its version history, and its download/upvote
            counts. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={pending}
            onClick={async (e) => {
              e.preventDefault();
              setPending(true);
              const res = await deleteWorkflow(workflowId);
              setPending(false);
              if (!res.ok) {
                toast.error(res.error ?? "Could not delete workflow.");
              }
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
