"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createQaPost } from "@/lib/actions/qa";

export function AskQuestionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowRef = searchParams.get("workflow");

  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState(
    workflowRef ? `Question about workflow \`${workflowRef}\`:\n\n` : "",
  );
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>(workflowRef ? [workflowRef] : []);
  const [attachmentName, setAttachmentName] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function addTag() {
    const value = tagInput.trim().toLowerCase();
    if (value && !tags.includes(value) && tags.length < 5) {
      setTags([...tags, value]);
    }
    setTagInput("");
  }

  async function handleFile(file: File) {
    const text = await file.text();
    const fence = /\.json$/i.test(file.name) ? "json" : "";
    setBody((prev) => `${prev}${prev ? "\n\n" : ""}\`\`\`${fence}\n${text.slice(0, 4000)}\n\`\`\`\n`);
    setAttachmentName(file.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await createQaPost({ title, body, tags });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not post your question.");
      return;
    }
    toast.success("Question posted.");
    router.push(`/qa/${res.postId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="q-title">Title</Label>
        <Input
          id="q-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Be specific — imagine you're asking a colleague"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="q-body">Details</Label>
        <Textarea
          id="q-body"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What are you trying to do? What happened instead? Include any error messages."
          required
          className="font-mono text-xs"
        />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" aria-hidden /> Attach code / JSON
          </Button>
          {attachmentName && (
            <span className="text-xs text-muted-foreground">Inserted {attachmentName} as a code block</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json,.txt,.yaml,.yml,.log"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="q-tags">Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 font-normal">
              {tag}
              <button
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          id="q-tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder="Press Enter to add a tag (up to 5)"
        />
      </div>

      <Button type="submit" className="gap-1.5" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        Post question
      </Button>
    </form>
  );
}
