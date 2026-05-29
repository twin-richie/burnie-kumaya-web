import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Confidence, Task } from "@/lib/types";

type BadgeTone = "red" | "amber" | "blue" | "green" | "stone" | "purple";

const toneClass: Record<BadgeTone, string> = {
  red: "border-red-500/40 bg-red-500/10 text-red-200",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  blue: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  stone: "border-stone-500/40 bg-stone-500/10 text-stone-200",
  purple: "border-violet-500/40 bg-violet-500/10 text-violet-200",
};

export function PlanningBadge({ children, tone = "stone", className }: { children: React.ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", toneClass[tone], className)}>
      {children}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: Task["status"] }) {
  const tone: Record<Task["status"], BadgeTone> = {
    open: "stone",
    in_progress: "blue",
    blocked: "red",
    done: "green",
    parked: "purple",
  };
  return <PlanningBadge tone={tone[status]}>{status.replace("_", " ")}</PlanningBadge>;
}

export function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const tone: Record<Task["priority"], BadgeTone> = {
    urgent: "red",
    high: "amber",
    normal: "stone",
    low: "green",
  };
  return <PlanningBadge tone={tone[priority]}>{priority}</PlanningBadge>;
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const tone: Record<Confidence, BadgeTone> = {
    high: "green",
    medium: "amber",
    low: "red",
  };
  return <PlanningBadge tone={tone[confidence]}>confidence: {confidence}</PlanningBadge>;
}

export function NeedsReviewBadge({ needsReview, showClear = true }: { needsReview: boolean; showClear?: boolean }) {
  if (needsReview) return <PlanningBadge tone="red">needs review</PlanningBadge>;
  if (!showClear) return null;
  return <PlanningBadge tone="green">review clear</PlanningBadge>;
}
