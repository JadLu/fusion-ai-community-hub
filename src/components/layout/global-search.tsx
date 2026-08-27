"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Workflow, MessagesSquare, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

interface SearchResult {
  type: "workflow" | "qa_post" | "creator";
  id: string;
  title: string;
  snippet: string;
  href: string;
}

const TYPE_ICON = {
  workflow: Workflow,
  qa_post: MessagesSquare,
  creator: User,
} as const;

const TYPE_LABEL = {
  workflow: "Workflows",
  qa_post: "Q&A",
  creator: "Creators",
} as const;

export function GlobalSearch({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, open]);

  const grouped = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const result of results) {
      groups[result.type] ??= [];
      groups[result.type].push(result);
    }
    return groups;
  }, [results]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className={
          className ??
          "h-9 w-full max-w-sm justify-start gap-2 text-muted-foreground font-normal"
        }
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        {!iconOnly && (
          <>
            <span className="truncate">Search workflows, Q&amp;A, creators…</span>
            <CommandShortcut className="hidden sm:inline">Ctrl K</CommandShortcut>
          </>
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search workflows, Q&A threads, creators…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Searching…
            </div>
          )}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <CommandEmpty>No results for &ldquo;{query}&rdquo;.</CommandEmpty>
          )}
          {!loading && query.trim().length < 2 && (
            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
          )}
          {(Object.keys(grouped) as SearchResult["type"][]).map((type) => {
            const Icon = TYPE_ICON[type];
            return (
              <CommandGroup key={type} heading={TYPE_LABEL[type]}>
                {grouped[type].map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}-${result.title}`}
                    onSelect={() => go(result.href)}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium">{result.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {result.snippet}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
