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

export function QaFilters({
  defaultQuery,
  defaultStatus,
}: {
  defaultQuery: string;
  defaultStatus: string;
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
          placeholder="Search questions by title or tag…"
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", e.currentTarget.value);
          }}
          onBlur={(e) => setParam("q", e.currentTarget.value)}
        />
      </div>
      <Select defaultValue={defaultStatus || "all"} onValueChange={(v) => setParam("status", v)}>
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All threads</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="solved">Solved</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
