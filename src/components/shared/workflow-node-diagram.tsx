import { ArrowRight, Zap, GitBranch, Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodePreview } from "@/lib/workflow-nodes";

const KIND_STYLE: Record<WorkflowNodePreview["kind"], { icon: typeof Zap; className: string }> = {
  trigger: { icon: Zap, className: "border-platform-blue/30 bg-platform-blue/10 text-platform-blue" },
  logic: { icon: GitBranch, className: "border-platform-purple/30 bg-platform-purple/10 text-platform-purple" },
  action: { icon: Play, className: "border-platform-orange/30 bg-platform-orange/10 text-platform-orange" },
  output: {
    icon: CheckCircle2,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

export function WorkflowNodeDiagram({ nodes }: { nodes: WorkflowNodePreview[] }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 overflow-x-auto rounded-xl border border-border bg-secondary/20 p-5"
      role="img"
      aria-label={`Workflow node diagram: ${nodes.map((n) => n.label).join(" → ")}`}
    >
      {nodes.map((node, i) => {
        const { icon: Icon, className } = KIND_STYLE[node.kind];
        return (
          <div key={node.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex min-w-[168px] items-center gap-2 rounded-lg border px-3 py-2.5 shadow-sm",
                className,
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="text-xs font-semibold text-foreground">{node.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
