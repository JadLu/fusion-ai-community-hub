"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";

const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "downloads", label: "Most downloaded" },
  { value: "upvotes", label: "Most upvoted" },
];

export function WorkflowFilters({
  defaultQuery,
  defaultCategory,
  defaultSort,
}: {
  defaultQuery: string;
  defaultCategory: string;
  defaultSort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          defaultValue={defaultQuery}
          placeholder="Search workflows by name, tag, or integration…"
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", e.currentTarget.value);
          }}
          onBlur={(e) => setParam("q", e.currentTarget.value)}
        />
      </div>
      <Select defaultValue={defaultCategory || "all"} onValueChange={(v) => setParam("category", v)}>
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={defaultSort || "trending"} onValueChange={(v) => setParam("sort", v)}>
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((sort) => (
            <SelectItem key={sort.value} value={sort.value}>
              {sort.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
