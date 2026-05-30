import type { Datastore, Milestone, Update } from "./types";

export function sortMilestonesByDate(milestones: Milestone[], direction: "asc" | "desc" = "asc") {
  return [...milestones].sort((a, b) => (direction === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.title.localeCompare(b.title));
}

export function sortUpdatesNewestFirst(updates: Update[]) {
  return [...updates].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

function isoDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
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
