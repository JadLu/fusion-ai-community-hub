import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Deep-link import handler: GET /api/v1/import/:id
 *
 * Returns the sanitized workflow JSON for direct import into the local
 * Fusion AI desktop/web app. The app's custom protocol handler
 * (fusionai://import?...) or CLI (`fusion-ai import <id>`) fetches this
 * endpoint rather than scraping the workflow detail page.
 *
 * Only `published` workflows are importable by anonymous/CLI callers;
 * draft workflows require the owner's session (enforced by RLS on the
 * `workflows` select policy — an unauthenticated or non-owner request
 * simply won't find the row).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workflow, error } = await supabase
    .from("workflows")
    .select("id, title, version, json_schema, status, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: "Lookup failed." }, { status: 500 });
  }

  if (!workflow) {
    return NextResponse.json({ ok: false, error: `No importable workflow found for "${id}".` }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  return NextResponse.json({
    ok: true,
    id: workflow.id,
    title: workflow.title,
    version: workflow.version,
    format,
    workflow: workflow.json_schema,
    import_url: `fusionai://import?source=community-hub&workflow=${workflow.id}`,
  });
}
