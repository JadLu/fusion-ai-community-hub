"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ImportButton({ workflowId }: { workflowId: string }) {
  const [loading, setLoading] = React.useState(false);

  async function handleImport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/import/${workflowId}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Import failed. Try again in a moment.");
        return;
      }
      window.location.href = data.import_url;
      toast.success(`Importing "${data.title}" into Fusion AI…`);
    } catch {
      toast.error("Could not reach the import service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" size="lg" className="gap-2" onClick={handleImport} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      1-Click Import
    </Button>
  );
}
