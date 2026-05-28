import type { Area, Datastore, Milestone, Task } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export type AttentionSummary = {
  openTasks: Task[];
  blockedTasks: Task[];
  overdueTasks: Task[];
  dueSoonTasks: Task[];
  unownedHighPriorityTasks: Task[];
  reviewTasks: Task[];
  lowConfidenceTasks: Task[];
  upcomingMilestones: Milestone[];
};

export type AreaSummary = {
  area: Area;
  openCount: number;
  highCount: number;
  blockedCount: number;
  nextMilestone?: Milestone;
};

function dateValue(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getTime();
}

export function daysUntil(date: string, asOf = new Date()): number {
  const today = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  return Math.ceil((dateValue(date) - today) / DAY_MS);
}

export function summarizeAttention(datastore: Datastore, asOf = new Date(), dueSoonDays = 30): AttentionSummary {
  const activeTasks = datastore.tasks.filter((task) => task.status !== "done" && task.status !== "parked");
  const openTasks = activeTasks.filter((task) => task.status === "open" || task.status === "in_progress");
  const blockedTasks = activeTasks.filter((task) => task.status === "blocked");
  const overdueTasks = activeTasks.filter((task) => task.due_date && daysUntil(task.due_date, asOf) < 0);
  const dueSoonTasks = activeTasks.filter((task) => {
    if (!task.due_date) return false;
    const days = daysUntil(task.due_date, asOf);
    return days >= 0 && days <= dueSoonDays;
  });

  return {
    openTasks,
    blockedTasks,
    overdueTasks,
    dueSoonTasks,
    unownedHighPriorityTasks: activeTasks.filter((task) => !task.owner && (task.priority === "urgent" || task.priority === "high")),
    reviewTasks: activeTasks.filter((task) => task.needs_review),
    lowConfidenceTasks: activeTasks.filter((task) => task.confidence === "low"),
    upcomingMilestones: datastore.milestones
      .filter((milestone) => daysUntil(milestone.date, asOf) >= 0)
      .sort((a, b) => dateValue(a.date) - dateValue(b.date)),
  };
}

export function summarizeAreas(datastore: Datastore, asOf = new Date()): AreaSummary[] {
  return datastore.areas.map((area) => {
    const tasks = datastore.tasks.filter((task) => task.area === area.slug && task.status !== "done" && task.status !== "parked");
    const milestones = datastore.milestones
      .filter((milestone) => milestone.area === area.slug && daysUntil(milestone.date, asOf) >= 0)
      .sort((a, b) => dateValue(a.date) - dateValue(b.date));

    return {
      area,
      openCount: tasks.length,
      highCount: tasks.filter((task) => task.priority === "urgent" || task.priority === "high").length,
      blockedCount: tasks.filter((task) => task.status === "blocked").length,
      nextMilestone: milestones[0],
    };
  });
}

export function latestByDate<T extends { date: string }>(items: T[], limit: number): T[] {
  return [...items].sort((a, b) => dateValue(b.date) - dateValue(a.date)).slice(0, limit);
}
