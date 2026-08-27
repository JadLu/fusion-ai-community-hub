"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function JsonViewer({ data, filename = "workflow.json" }: { data: unknown; filename?: string }) {
  const [copied, setCopied] = React.useState(false);
  const json = React.useMemo(() => JSON.stringify(data, null, 2), [data]);

  async function copy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">{filename}</span>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={download}>
            Download
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={copy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[420px]">
        <pre className="p-4 text-xs leading-relaxed">
          <code className="font-mono text-foreground">{json}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}
