import { daysUntil } from "./dashboard";
import type { Confidence, Task } from "./types";

export const taskStatuses = ["open", "in_progress", "blocked", "done", "parked"] as const satisfies readonly Task["status"][];
export const taskPriorities = ["urgent", "high", "normal", "low"] as const satisfies readonly Task["priority"][];
export const taskConfidences = ["high", "medium", "low"] as const satisfies readonly Confidence[];
export const taskDueStates = ["overdue", "due-soon", "dated", "no-date"] as const;
export const taskReviewStates = ["needs-review", "clear"] as const;
export const taskSorts = ["attention", "due-date", "priority", "updated"] as const;

export type TaskDueState = (typeof taskDueStates)[number];
export type TaskReviewState = (typeof taskReviewStates)[number];
export type TaskSort = (typeof taskSorts)[number];

export type TaskFilters = {
  status?: Task["status"];
  priority?: Task["priority"];
  area?: string;
  owner?: string;
  due?: TaskDueState;
  review?: TaskReviewState;
  confidence?: Confidence;
  sort: TaskSort;
};

const priorityRank: Record<Task["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const statusRank: Record<Task["status"], number> = {
  blocked: 0,
  in_progress: 1,
  open: 2,
  parked: 3,
  done: 4,
};

function scalar(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function oneOf<T extends readonly string[]>(value: string | undefined, options: T): T[number] | undefined {
  return value && options.includes(value) ? value : undefined;
}

export function parseTaskFilters(params: Record<string, string | string[] | undefined>): TaskFilters {
  return {
    status: oneOf(scalar(params.status), taskStatuses),
    priority: oneOf(scalar(params.priority), taskPriorities),
    area: scalar(params.area) || undefined,
    owner: scalar(params.owner) || undefined,
    due: oneOf(scalar(params.due), taskDueStates),
    review: oneOf(scalar(params.review), taskReviewStates),
    confidence: oneOf(scalar(params.confidence), taskConfidences),
    sort: oneOf(scalar(params.sort), taskSorts) ?? "attention",
  };
}

export function taskDueState(task: Task, asOf = new Date(), dueSoonDays = 30): TaskDueState {
  if (!task.due_date) return "no-date";
  const days = daysUntil(task.due_date, asOf);
  if (days < 0) return "overdue";
  if (days <= dueSoonDays) return "due-soon";
  return "dated";
}

export function taskAttentionScore(task: Task, asOf = new Date()): number {
  let score = 0;
  if (task.status === "blocked") score += 100;
  if (task.due_date && daysUntil(task.due_date, asOf) < 0) score += 90;
  if (!task.owner && (task.priority === "urgent" || task.priority === "high")) score += 70;
  if (task.due_date) {
    const days = daysUntil(task.due_date, asOf);
    if (days >= 0 && days <= 30) score += 50 - days;
  }
  if (task.needs_review) score += 35;
  if (task.confidence === "low") score += 25;
  if (task.confidence === "medium") score += 10;
  score += 12 - priorityRank[task.priority] * 3;
  score += 5 - statusRank[task.status];
  return score;
}

export function filterTasks(tasks: Task[], filters: TaskFilters, asOf = new Date()): Task[] {
  return tasks
    .filter((task) => !filters.status || task.status === filters.status)
    .filter((task) => !filters.priority || task.priority === filters.priority)
    .filter((task) => !filters.area || task.area === filters.area)
    .filter((task) => {
      if (!filters.owner) return true;
      if (filters.owner === "unowned") return !task.owner;
      return task.owner === filters.owner;
    })
    .filter((task) => !filters.due || taskDueState(task, asOf) === filters.due)
    .filter((task) => {
      if (!filters.review) return true;
      return filters.review === "needs-review" ? task.needs_review : !task.needs_review;
    })
    .filter((task) => !filters.confidence || task.confidence === filters.confidence)
    .sort((a, b) => compareTasks(a, b, filters.sort, asOf));
}

function compareTasks(a: Task, b: Task, sort: TaskSort, asOf: Date): number {
  if (sort === "due-date") {
    const aDue = a.due_date ?? "9999-12-31";
    const bDue = b.due_date ?? "9999-12-31";
    return aDue.localeCompare(bDue) || compareTasks(a, b, "attention", asOf);
  }
  if (sort === "priority") {
    return priorityRank[a.priority] - priorityRank[b.priority] || compareTasks(a, b, "attention", asOf);
  }
  if (sort === "updated") {
    return b.updated_at.localeCompare(a.updated_at) || compareTasks(a, b, "attention", asOf);
  }
  return taskAttentionScore(b, asOf) - taskAttentionScore(a, asOf) || a.title.localeCompare(b.title);
}

export function activeFilterCount(filters: TaskFilters): number {
  return [filters.status, filters.priority, filters.area, filters.owner, filters.due, filters.review, filters.confidence].filter(Boolean).length;
}
