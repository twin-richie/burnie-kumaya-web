import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Confidence, Task } from "@/lib/types";

type BadgeTone = "red" | "amber" | "blue" | "green" | "stone" | "purple";

const variantForTone: Record<BadgeTone, "default" | "secondary" | "outline" | "destructive"> = {
  red: "destructive",
  amber: "secondary",
  blue: "secondary",
  green: "outline",
  stone: "outline",
  purple: "secondary",
};

export function PlanningBadge({ children, tone = "stone", className }: { children: React.ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <Badge variant={variantForTone[tone]} className={cn("font-medium", className)}>
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
  return <PlanningBadge tone={tone[confidence]} className="opacity-30">confidence: {confidence}</PlanningBadge>;
}

export function NeedsReviewBadge({ needsReview, showClear = true }: { needsReview: boolean; showClear?: boolean }) {
  if (needsReview) return <PlanningBadge tone="red">needs review</PlanningBadge>;
  if (!showClear) return null;
  return <PlanningBadge tone="green">review clear</PlanningBadge>;
}
