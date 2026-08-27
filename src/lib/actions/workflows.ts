"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { slugify } from "@/lib/slug";
import type { Json } from "@/lib/supabase/database.types";

const NOT_CONFIGURED_ERROR = "Connect a Supabase project to enable this — see the README.";

export interface PublishWorkflowInput {
  title: string;
  description: string;
  category: string;
  tags: string[];
  sanitizedSchema: Json;
}

export interface PublishWorkflowResult {
  ok: boolean;
  error?: string;
  workflowId?: string;
}

/** Persists an already-sanitized workflow config. Requires an authenticated session (enforced by RLS). */
export async function publishWorkflow(input: PublishWorkflowInput): Promise<PublishWorkflowResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to publish a workflow." };
  }

  if (!input.title.trim() || !input.category) {
    return { ok: false, error: "Title and category are required." };
  }

  const slug = `${slugify(input.title)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      owner_id: user.id,
      title: input.title.trim(),
      slug,
      description: input.description.trim(),
      category: input.category,
      tags: input.tags,
      json_schema: input.sanitizedSchema,
      status: "published",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, workflowId: data.id };
}

export interface UpdateWorkflowMetadataInput {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

export async function updateWorkflowMetadata(input: UpdateWorkflowMetadataInput): Promise<PublishWorkflowResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };
  const supabase = await createClient();
  const { error } = await supabase
    .from("workflows")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      tags: input.tags,
    })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, workflowId: input.id };
}

export interface PublishVersionInput {
  workflowId: string;
  version: string;
  changelog: string;
  jsonSchema: Json;
}

export async function publishWorkflowVersion(input: PublishVersionInput): Promise<PublishWorkflowResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };
  const supabase = await createClient();

  const { error: versionError } = await supabase.from("workflow_versions").insert({
    workflow_id: input.workflowId,
    version: input.version.trim(),
    changelog: input.changelog.trim() || null,
    json_schema: input.jsonSchema,
  });
  if (versionError) return { ok: false, error: versionError.message };

  const { error: updateError } = await supabase
    .from("workflows")
    .update({ version: input.version.trim(), json_schema: input.jsonSchema })
    .eq("id", input.workflowId);
  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true, workflowId: input.workflowId };
}

export async function deleteWorkflow(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.from("workflows").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  redirect("/dashboard");
}
