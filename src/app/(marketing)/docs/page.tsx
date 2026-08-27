import type { Metadata } from "next";
import { JsonViewer } from "@/components/shared/json-viewer";

export const metadata: Metadata = { title: "Documentation" };

const TOC = [
  { href: "#overview", label: "Overview" },
  { href: "#deep-link-imports", label: "Deep-link imports" },
  { href: "#json-schema", label: "JSON schema" },
  { href: "#sanitization", label: "Credential sanitization" },
  { href: "#cli", label: "CLI commands" },
];

const sampleSchema = {
  id: "shopify-order-sync",
  title: "Shopify → NetSuite Order Sync",
  version: "v2.1",
  nodes: [
    { id: "n1", type: "trigger", label: "Shopify: New Order" },
    { id: "n2", type: "action", label: "NetSuite: Create Order" },
  ],
};

export default function DocsPage() {
  return (
    <div className="container grid grid-cols-1 gap-10 py-10 lg:grid-cols-[200px_1fr]">
      <nav className="hidden lg:block">
        <div className="sticky top-24 space-y-1">
          <p className="category-label mb-2 text-muted-foreground">On this page</p>
          {TOC.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-2xl space-y-14">
        <section id="overview" className="space-y-3 scroll-mt-24">
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
          <p className="text-muted-foreground">
            Everything you need to import workflows into Fusion AI, understand the workflow JSON
            schema, and automate uploads via the CLI.
          </p>
        </section>

        <section id="deep-link-imports" className="space-y-3 scroll-mt-24">
          <h2 className="text-xl font-bold tracking-tight">Deep-link imports</h2>
          <p className="text-sm text-muted-foreground">
            Every workflow detail page exposes a 1-click import button that calls{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GET /api/v1/import/:id</code>{" "}
            and redirects to a <code className="rounded bg-muted px-1.5 py-0.5 text-xs">fusionai://import</code>{" "}
            deep link, which your local Fusion AI desktop or web app registers a handler for. Draft
            workflows are only importable by their owner — the endpoint relies on the same Row Level
            Security policy that governs the workflows table, so an unauthenticated or non-owner
            request simply returns 404 rather than leaking existence of a private workflow.
          </p>
        </section>

        <section id="json-schema" className="space-y-3 scroll-mt-24">
          <h2 className="text-xl font-bold tracking-tight">JSON schema</h2>
          <p className="text-sm text-muted-foreground">
            Workflows are stored as a JSON document with a top-level <code className="rounded bg-muted px-1.5 py-0.5 text-xs">nodes</code> array.
            Each node has a stable <code className="rounded bg-muted px-1.5 py-0.5 text-xs">id</code>, a{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">type</code> (trigger, action, logic, or output), and a human-readable{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">label</code>.
          </p>
          <JsonViewer data={sampleSchema} filename="example.json" />
        </section>

        <section id="sanitization" className="space-y-3 scroll-mt-24">
          <h2 className="text-xl font-bold tracking-tight">Credential sanitization</h2>
          <p className="text-sm text-muted-foreground">
            Every upload to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/v1/workflows/parse</code> is
            recursively scanned before it reaches the database. A field is redacted if either its key
            name (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">api_key</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">secret</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization</code>, …) or its
            value shape (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">sk-…</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">AKIA…</code>, a JWT, a PEM block,
            …) matches a known credential pattern. The response includes a redaction report listing
            every field that was stripped and why.
          </p>
        </section>

        <section id="cli" className="space-y-3 scroll-mt-24">
          <h2 className="text-xl font-bold tracking-tight">CLI commands</h2>
          <p className="text-sm text-muted-foreground">
            Generate an API key under{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Settings → API Keys</code>, then:
          </p>
          <pre className="overflow-x-auto rounded-xl border border-border bg-card p-4 text-xs">
            <code className="font-mono">{`fusion-ai login --api-key <key>
fusion-ai import shopify-order-sync
fusion-ai publish ./my-workflow.json --category Dev`}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}
