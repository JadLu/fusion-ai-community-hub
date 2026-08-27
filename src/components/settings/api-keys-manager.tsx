"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { EmptyState } from "@/components/shared/empty-state";
import { generateApiKey, revokeApiKey } from "@/lib/actions/api-keys";
import type { ApiKey } from "@/lib/types";

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const router = useRouter();
  const [keys, setKeys] = React.useState(initialKeys);
  React.useEffect(() => setKeys(initialKeys), [initialKeys]);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [revealedKey, setRevealedKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function handleGenerate() {
    setGenerating(true);
    const res = await generateApiKey(name);
    setGenerating(false);
    if (!res.ok || !res.plaintextKey) {
      toast.error(res.error ?? "Could not generate key.");
      return;
    }
    setRevealedKey(res.plaintextKey);
    setName("");
  }

  async function handleRevoke(id: string) {
    const res = await revokeApiKey(id);
    if (!res.ok) {
      toast.error(res.error ?? "Could not revoke key.");
      return;
    }
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("Key revoked.");
  }

  function closeDialog(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && revealedKey) {
      setRevealedKey(null);
      setCopied(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Use an API key to publish workflows or run imports from the CLI.
        </p>
        <Dialog open={open} onOpenChange={closeDialog}>
          <DialogTrigger asChild>
            <Button type="button" className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden /> Generate key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {!revealedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Generate a new API key</DialogTitle>
                  <DialogDescription>Give it a name that reminds you where it&apos;s used.</DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="CI pipeline"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleGenerate} disabled={generating} className="gap-1.5">
                    {generating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    Generate
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Copy your key now</DialogTitle>
                  <DialogDescription>
                    This is the only time it will be shown — it isn&apos;t stored in plaintext.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
                  <code className="flex-1 overflow-x-auto text-xs">{revealedKey}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={async () => {
                      await navigator.clipboard.writeText(revealedKey);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                  </Button>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={() => closeDialog(false)}>
                    Done
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {keys.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No API keys yet"
          description="Generate one to publish workflows or run imports from the CLI."
        />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{key.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {key.key_prefix}••••••••••••••••
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  <p>Created {formatDate(key.created_at)}</p>
                  <p>Last used {formatDate(key.last_used_at)}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Revoke {key.name}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke &ldquo;{key.name}&rdquo;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Anything using this key — CLI scripts, CI pipelines — will stop working immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleRevoke(key.id)}
                      >
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
