import { cn } from "@/lib/utils";
import type { WorkflowCategory } from "@/lib/types";

const CATEGORY_STYLES: Record<WorkflowCategory, string> = {
  Sales: "bg-platform-blue/10 text-platform-blue border-platform-blue/20",
  Dev: "bg-platform-purple/10 text-platform-purple border-platform-purple/20",
  Marketing: "bg-platform-pink/10 text-platform-pink border-platform-pink/20",
  Support: "bg-platform-orange/10 text-platform-orange border-platform-orange/20",
  Ops: "bg-platform-rose/10 text-platform-rose border-platform-rose/20",
  Data: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const style = CATEGORY_STYLES[category as WorkflowCategory] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "category-label inline-flex items-center rounded-full border px-2 py-1",
        style,
        className,
      )}
    >
      {category}
    </span>
  );
}
