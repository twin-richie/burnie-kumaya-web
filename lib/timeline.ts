import type { Datastore, Milestone, Update } from "./types";

export const MAN_BURN_DATE = "2026-09-06";

export type GanttMilestoneRow = Pick<Milestone, "id" | "date" | "title" | "type" | "area" | "description" | "confidence"> & {
  offsetPercent: number;
  daysFromStart: number;
  isManBurn: boolean;
};

export function sortMilestonesByDate(milestones: Milestone[], direction: "asc" | "desc" = "asc") {
  return [...milestones].sort((a, b) => (direction === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.title.localeCompare(b.title));
}

export function sortUpdatesNewestFirst(updates: Update[]) {
  return [...updates].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

function isoDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function dayDifference(fromDate: string, toDate: string) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseDateOnly(toDate).getTime() - parseDateOnly(fromDate).getTime()) / millisecondsPerDay);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function manBurnMilestone(): Milestone {
  return {
    id: "milestone-burn-ends-2026",
    date: MAN_BURN_DATE,
    title: "Burn ends",
    type: "event",
    description: "Final marker for the 2026 burn timeline.",
    confidence: "high",
    provenance: [{ source_type: "user_instruction", source_ref: "telegram:richie:2026-06-02", source_date: "2026-06-02" }],
  };
}

export function buildGanttMilestoneRows(milestones: Milestone[], asOf = new Date()): GanttMilestoneRow[] {
  const startDate = isoDateOnly(asOf);
  const totalDaysRaw = dayDifference(startDate, MAN_BURN_DATE);
  const totalDays = Math.max(1, totalDaysRaw);
  const sourceMilestones = milestones.filter((milestone) => milestone.date >= startDate && milestone.date <= MAN_BURN_DATE);
  const includesManBurn = sourceMilestones.some((milestone) => milestone.date === MAN_BURN_DATE || milestone.id === "milestone-burn-ends-2026");
  const visibleMilestones = sortMilestonesByDate(includesManBurn ? sourceMilestones : [...sourceMilestones, manBurnMilestone()]);

  return visibleMilestones.map((milestone) => {
    const daysFromStart = clamp(dayDifference(startDate, milestone.date), 0, totalDays);
    const isManBurn = milestone.date === MAN_BURN_DATE || milestone.id === "milestone-burn-ends-2026";
    return {
      id: milestone.id,
      date: milestone.date,
      title: milestone.title,
      type: milestone.type,
      area: milestone.area,
      description: milestone.description,
      confidence: milestone.confidence,
      daysFromStart,
      offsetPercent: isManBurn && totalDaysRaw <= 0 ? 100 : Math.round((daysFromStart / totalDays) * 100),
      isManBurn,
    };
  });
}

export function groupMilestonesByTime(datastore: Datastore, asOf = new Date()) {
  const today = isoDateOnly(asOf);
  const upcoming = datastore.milestones.filter((milestone) => milestone.date >= today);
  const past = datastore.milestones.filter((milestone) => milestone.date < today);
  return {
    upcoming: sortMilestonesByDate(upcoming, "asc"),
    past: sortMilestonesByDate(past, "desc"),
  };
}

export function countMilestonesByType(milestones: Milestone[]) {
  return milestones.reduce<Record<Milestone["type"], number>>(
    (counts, milestone) => {
      counts[milestone.type] += 1;
      return counts;
    },
    { deadline: 0, event: 0, build: 0, logistics: 0, payment: 0, meeting: 0 },
  );
}
