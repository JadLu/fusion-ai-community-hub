import { load as loadYaml } from "js-yaml";

export interface Redaction {
  /** Dot/bracket path to the redacted field, e.g. `nodes[2].auth.headers.Authorization`. */
  path: string;
  reason: string;
}

export interface SanitizeResult {
  sanitized: unknown;
  redactions: Redaction[];
}

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 64;

/** Field names that are always treated as secret, regardless of their value shape. */
const SENSITIVE_KEY_PATTERN =
  /(api[-_]?key|secret|token|password|passwd|pwd|authorization|access[-_]?key|private[-_]?key|client[-_]?secret|credential|bearer|refresh[-_]?token|session[-_]?id|cookie|signing[-_]?key)/i;

/** Value shapes recognized as credentials even under an innocuous field name. */
const SENSITIVE_VALUE_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: "OpenAI-style secret key", pattern: /^sk-[A-Za-z0-9]{20,}$/ },
  { name: "AWS access key ID", pattern: /^AKIA[0-9A-Z]{16}$/ },
  { name: "GitHub token", pattern: /^gh[pousr]_[A-Za-z0-9]{20,}$/ },
  { name: "Slack token", pattern: /^xox[baprs]-[A-Za-z0-9-]+$/ },
  { name: "Bearer authorization header", pattern: /^Bearer\s+\S+/i },
  {
    name: "JSON Web Token",
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  },
  {
    name: "PEM private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
];

export class WorkflowParseError extends Error {}

/** Parses uploaded workflow config text as JSON or YAML. Throws WorkflowParseError on failure. */
export function parseWorkflowConfig(
  raw: string,
  format: "json" | "yaml",
): unknown {
  try {
    if (format === "json") {
      return JSON.parse(raw);
    }
    return loadYaml(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown parse error";
    throw new WorkflowParseError(`Could not parse ${format.toUpperCase()}: ${message}`);
  }
}

function matchesSensitiveValue(value: string): string | null {
  for (const { name, pattern } of SENSITIVE_VALUE_PATTERNS) {
    if (pattern.test(value)) return name;
  }
  return null;
}

function walk(value: unknown, path: string, depth: number, redactions: Redaction[]): unknown {
  if (depth > MAX_DEPTH) return value;

  if (Array.isArray(value)) {
    return value.map((item, i) => walk(item, `${path}[${i}]`, depth + 1, redactions));
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;

      if (SENSITIVE_KEY_PATTERN.test(key)) {
        out[key] = REDACTED;
        redactions.push({ path: childPath, reason: `field name matches "${key}"` });
        continue;
      }

      if (typeof child === "string") {
        const valueMatch = matchesSensitiveValue(child);
        if (valueMatch) {
          out[key] = REDACTED;
          redactions.push({ path: childPath, reason: `value looks like a ${valueMatch}` });
          continue;
        }
      }

      out[key] = walk(child, childPath, depth + 1, redactions);
    }
    return out;
  }

  return value;
}

/**
 * Recursively strips credentials from a parsed workflow config before it is
 * persisted. A field is redacted if either its key name (api_key, secret,
 * Authorization, ...) or its value shape (sk-..., AKIA..., a JWT, ...)
 * matches a known credential pattern — an innocuous-looking custom field
 * (e.g. a header literally named "X-Internal-Token") is redacted by name,
 * while an arbitrary opaque ID under a generic key name is left alone.
 */
export function sanitizeWorkflowConfig(input: unknown): SanitizeResult {
  const redactions: Redaction[] = [];
  const sanitized = walk(input, "", 0, redactions);
  return { sanitized, redactions };
}
