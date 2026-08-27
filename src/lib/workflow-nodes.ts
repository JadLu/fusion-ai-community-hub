import type { Json } from "@/lib/supabase/database.types";

export interface WorkflowNodePreview {
  id: string;
  label: string;
  kind: "trigger" | "action" | "logic" | "output";
}

const TRIGGER_HINTS = /trigger|webhook|schedule|cron|new /i;
const LOGIC_HINTS = /logic|branch|condition|filter|map|route|validate|score|classify|forEach/i;
const OUTPUT_HINTS = /slack|notify|alert|escalate|email|output/i;

function inferKind(type: string): WorkflowNodePreview["kind"] {
  if (TRIGGER_HINTS.test(type)) return "trigger";
  if (OUTPUT_HINTS.test(type)) return "output";
  if (LOGIC_HINTS.test(type)) return "logic";
  return "action";
}

/**
 * Best-effort extraction of a node preview list from an uploaded workflow's
 * `json_schema` for the detail page's diagram — the schema is whatever the
 * uploader's config contained (see workflowSchemaPrompt.js conventions:
 * top-level `nodes` array with `id`/`type`/`label` per node), so this stays
 * defensive rather than assuming an exact shape.
 */
export function deriveNodePreview(jsonSchema: Json, limit = 12): WorkflowNodePreview[] {
  if (!jsonSchema || typeof jsonSchema !== "object" || Array.isArray(jsonSchema)) return [];
  const nodes = (jsonSchema as Record<string, unknown>).nodes;
  if (!Array.isArray(nodes)) return [];

  return nodes.slice(0, limit).flatMap((node, i): WorkflowNodePreview[] => {
    if (!node || typeof node !== "object") return [];
    const n = node as Record<string, unknown>;
    const type = typeof n.type === "string" ? n.type : "action";
    const label =
      (typeof n.label === "string" && n.label) ||
      (typeof n.name === "string" && n.name) ||
      type ||
      `Node ${i + 1}`;
    return [
      {
        id: typeof n.id === "string" ? n.id : `node-${i}`,
        label,
        kind: inferKind(type),
      },
    ];
  });
}
