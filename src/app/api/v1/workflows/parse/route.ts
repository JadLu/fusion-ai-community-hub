import { NextResponse } from "next/server";
import {
  parseWorkflowConfig,
  sanitizeWorkflowConfig,
  WorkflowParseError,
} from "@/lib/sanitize";

export const runtime = "nodejs";

const MAX_UPLOAD_CHARS = 2_000_000; // ~2MB of source text

type ParseFormat = "json" | "yaml";

function detectFormat(filename: string | null, explicit: string | null): ParseFormat | null {
  const hint = (explicit ?? filename ?? "").toLowerCase();
  if (hint.endsWith(".yaml") || hint.endsWith(".yml") || hint === "yaml") return "yaml";
  if (hint.endsWith(".json") || hint === "json") return "json";
  return null;
}

function countNodes(value: unknown): number | undefined {
  if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).nodes)) {
    return ((value as Record<string, unknown>).nodes as unknown[]).length;
  }
  return undefined;
}

/**
 * Backend worker route: parses an uploaded .json/.yaml workflow config,
 * strips credentials (API keys, tokens, passwords, ...) via
 * sanitizeWorkflowConfig, and returns the cleaned payload plus a redaction
 * report. Called from /workflows/new for real-time sanitization preview
 * before the sanitized result is persisted.
 *
 * Accepts either multipart/form-data (`file` field) or
 * application/json ({ filename, content }).
 */
export async function POST(request: Request) {
  let filename: string | null = null;
  let content: string;

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { ok: false, error: "Missing `file` in form data." },
          { status: 400 },
        );
      }
      filename = file.name;
      content = await file.text();
    } else {
      const body = await request.json();
      filename = typeof body.filename === "string" ? body.filename : null;
      if (typeof body.content !== "string") {
        return NextResponse.json(
          { ok: false, error: "Request body must include a `content` string." },
          { status: 400 },
        );
      }
      content = body.content;
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read request body." },
      { status: 400 },
    );
  }

  if (content.length > MAX_UPLOAD_CHARS) {
    return NextResponse.json(
      { ok: false, error: `File exceeds the ${MAX_UPLOAD_CHARS.toLocaleString()} character limit.` },
      { status: 413 },
    );
  }

  const url = new URL(request.url);
  const format = detectFormat(filename, url.searchParams.get("format"));

  if (!format) {
    return NextResponse.json(
      { ok: false, error: "Could not determine format — expected a .json or .yaml/.yml filename." },
      { status: 400 },
    );
  }

  let parsed: unknown;
  try {
    parsed = parseWorkflowConfig(content, format);
  } catch (err) {
    const message = err instanceof WorkflowParseError ? err.message : "Failed to parse file.";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }

  if (parsed === null || typeof parsed !== "object") {
    return NextResponse.json(
      { ok: false, error: "Workflow config must be a JSON/YAML object at the top level." },
      { status: 422 },
    );
  }

  const { sanitized, redactions } = sanitizeWorkflowConfig(parsed);

  return NextResponse.json({
    ok: true,
    format,
    sanitized,
    redactions,
    meta: {
      filename,
      nodeCount: countNodes(sanitized),
      redactionCount: redactions.length,
    },
  });
}
