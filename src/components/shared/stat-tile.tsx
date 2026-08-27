import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  icon: Icon,
  accent = "text-platform-blue",
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1.5">
          <p className="category-label text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-current/10 shrink-0", accent)}>
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
