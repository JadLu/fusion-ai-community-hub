"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Tag as TagIcon } from "lucide-react";
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
import { CATEGORIES } from "@/lib/categories";
import { updateWorkflowMetadata, publishWorkflowVersion } from "@/lib/actions/workflows";
import type { Workflow } from "@/lib/types";

export function WorkflowEditForm({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(workflow.title);
  const [description, setDescription] = React.useState(workflow.description);
  const [category, setCategory] = React.useState(workflow.category);
  const [tags, setTags] = React.useState(workflow.tags.join(", "));
  const [savingMeta, setSavingMeta] = React.useState(false);

  const [newVersion, setNewVersion] = React.useState("");
  const [changelog, setChangelog] = React.useState("");
  const [publishingVersion, setPublishingVersion] = React.useState(false);

  async function saveMetadata() {
    setSavingMeta(true);
    const res = await updateWorkflowMetadata({
      id: workflow.id,
      title,
      description,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setSavingMeta(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save changes.");
      return;
    }
    toast.success("Metadata updated.");
    router.refresh();
  }

  async function publishVersion() {
    if (!newVersion.trim()) {
      toast.error("Enter a version, e.g. v2.0.");
      return;
    }
    setPublishingVersion(true);
    const res = await publishWorkflowVersion({
      workflowId: workflow.id,
      version: newVersion,
      changelog,
      jsonSchema: workflow.json_schema,
    });
    setPublishingVersion(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not publish version.");
      return;
    }
    toast.success(`Published ${newVersion}.`);
    setNewVersion("");
    setChangelog("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold">Metadata</h2>
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">Title</Label>
          <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category">
                <SelectValue />
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
            <Label htmlFor="edit-tags" className="flex items-center gap-1">
              <TagIcon className="h-3.5 w-3.5" aria-hidden /> Tags
            </Label>
            <Input id="edit-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea id="edit-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button type="button" className="gap-1.5" disabled={savingMeta} onClick={saveMetadata}>
          {savingMeta ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Save changes
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border border-border p-5">
        <div>
          <h2 className="text-sm font-semibold">Publish a new version</h2>
          <p className="text-xs text-muted-foreground">
            Current version: <span className="font-medium text-foreground">{workflow.version}</span>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="new-version">Version</Label>
            <Input id="new-version" placeholder="v2.0" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="changelog">Changelog</Label>
            <Input id="changelog" placeholder="What changed?" value={changelog} onChange={(e) => setChangelog(e.target.value)} />
          </div>
        </div>
        <Button type="button" variant="outline" className="gap-1.5" disabled={publishingVersion} onClick={publishVersion}>
          {publishingVersion && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Publish version
        </Button>
      </div>
    </div>
  );
}
