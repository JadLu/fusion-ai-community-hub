"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JsonViewer } from "@/components/shared/json-viewer";
import { CATEGORIES } from "@/lib/categories";
import { publishWorkflow } from "@/lib/actions/workflows";
import type { Json } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

interface ParseResponse {
  ok: boolean;
  error?: string;
  sanitized?: Json;
  redactions?: { path: string; reason: string }[];
  meta?: { filename: string | null; nodeCount?: number; redactionCount: number };
}

export function WorkflowUploadForm() {
  const router = useRouter();
  const [dragging, setDragging] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [result, setResult] = React.useState<ParseResponse | null>(null);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!/\.(json|ya?ml)$/i.test(file.name)) {
      toast.error("Only .json, .yaml, or .yml files are supported.");
      return;
    }
    setParsing(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v1/workflows/parse", { method: "POST", body: form });
      const data: ParseResponse = await res.json();
      setResult(data);
      if (data.ok) {
        setTitle((prev) => prev || file.name.replace(/\.(json|ya?ml)$/i, "").replace(/[-_]/g, " "));
      }
    } catch {
      setResult({ ok: false, error: "Could not reach the sanitization service." });
    } finally {
      setParsing(false);
    }
  }

  async function handlePublish() {
    if (!result?.ok || !result.sanitized) return;
    setPublishing(true);
    const res = await publishWorkflow({
      title,
      description,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      sanitizedSchema: result.sanitized,
    });
    setPublishing(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not publish workflow.");
      return;
    }
    toast.success("Workflow published.");
    router.push(`/workflows/${res.workflowId}`);
  }

  const canPublish = result?.ok && title.trim().length > 0 && category.length > 0 && !publishing;

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">Drag & drop a .json or .yaml workflow config</p>
        <p className="text-xs text-muted-foreground">or</p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,.yaml,.yml"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {parsing && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sanitizing upload…
        </div>
      )}

      {result && !result.ok && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertTitle>Could not process file</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {result?.ok && (
        <>
          {result.redactions && result.redactions.length > 0 ? (
            <Alert>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <AlertTitle>
                {result.redactions.length} credential{result.redactions.length === 1 ? "" : "s"} stripped before storage
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-1 space-y-0.5 text-xs">
                  {result.redactions.map((r) => (
                    <li key={r.path}>
                      <code className="rounded bg-muted px-1 py-0.5">{r.path}</code> — {r.reason}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              <AlertTitle>No credentials detected</AlertTitle>
              <AlertDescription>Nothing matched a known secret pattern in this file.</AlertDescription>
            </Alert>
          )}

          <JsonViewer data={result.sanitized} filename={result.meta?.filename ?? "workflow.json"} />

          <div className="space-y-4 rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold">Workflow details</h2>
            <div className="space-y-1.5">
              <Label htmlFor="wf-title">Title</Label>
              <Input id="wf-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="wf-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="wf-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-tags">Tags (comma separated)</Label>
                <Input id="wf-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="shopify, webhook" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-description">Description</Label>
              <Textarea
                id="wf-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this workflow do, and what does someone need before using it?"
              />
            </div>
            <Button type="button" className="gap-1.5" disabled={!canPublish} onClick={handlePublish}>
              {publishing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Publish workflow
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
