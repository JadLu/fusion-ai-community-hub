import Link from "next/link";
import { Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  showWordmark = true,
  className,
}: {
  href?: string;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md",
        className,
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-platform-blue to-platform-purple text-white shrink-0">
        <Workflow className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </span>
      {showWordmark && (
        <span className="text-[15px] font-bold tracking-tight text-foreground whitespace-nowrap">
          Fusion AI <span className="text-muted-foreground font-semibold">Community</span>
        </span>
      )}
    </Link>
  );
}
