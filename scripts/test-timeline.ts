import assert from "node:assert/strict";
import {
  MAN_BURN_DATE,
  SEASON_START_DATE,
  buildGanttMilestoneRows,
  buildUpcomingGanttMilestoneRows,
  countMilestonesByType,
  groupMilestonesByTime,
  sortMilestonesByDate,
  sortUpdatesNewestFirst,
} from "../lib/timeline";
import type { Datastore } from "../lib/types";

const provenance = [{ source_type: "manual_seed", source_ref: "test" }] as const;

const datastore = {
  areas: [],
  people: [],
  tasks: [],
  meetings: [],
  decisions: [],
  milestones: [
    { id: "past", date: "2026-05-01", title: "Past", type: "meeting", confidence: "high", provenance: [...provenance] },
    { id: "season-past", date: "2026-05-30", title: "Season Past", type: "event", confidence: "high", provenance: [...provenance] },
    { id: "future-b", date: "2026-07-15", title: "Future B", type: "payment", confidence: "medium", provenance: [...provenance] },
    { id: "future-a", date: "2026-07-01", title: "Future A", type: "deadline", confidence: "high", provenance: [...provenance] },
  ],
  updates: [
    { id: "old", date: "2026-05-01", title: "Old", summary: "Old", changed_objects: [], source: "test", confidence: "high", provenance: [...provenance] },
    { id: "new", date: "2026-06-01", title: "New", summary: "New", changed_objects: [], source: "test", confidence: "high", provenance: [...provenance] },
  ],
} satisfies Datastore;

assert.deepEqual(sortMilestonesByDate(datastore.milestones).map((milestone) => milestone.id), ["past", "season-past", "future-a", "future-b"]);
assert.deepEqual(sortMilestonesByDate(datastore.milestones, "desc").map((milestone) => milestone.id), ["future-b", "future-a", "season-past", "past"]);

const grouped = groupMilestonesByTime(datastore, new Date("2026-06-01T00:00:00.000Z"));
assert.deepEqual(grouped.upcoming.map((milestone) => milestone.id), ["future-a", "future-b"]);
assert.deepEqual(grouped.past.map((milestone) => milestone.id), ["season-past", "past"]);

const counts = countMilestonesByType(datastore.milestones);
assert.equal(counts.deadline, 1);
assert.equal(counts.payment, 1);
assert.equal(counts.meeting, 1);
assert.equal(counts.event, 1);

assert.deepEqual(sortUpdatesNewestFirst(datastore.updates).map((update) => update.id), ["new", "old"]);

assert.equal(MAN_BURN_DATE, "2026-09-06");
assert.equal(SEASON_START_DATE, "2026-05-25");

const ganttRows = buildGanttMilestoneRows(datastore.milestones);
assert.deepEqual(ganttRows.map((row) => row.id), ["season-past", "future-a", "future-b", "milestone-burn-ends-2026"]);
assert.equal(ganttRows[0].date, "2026-05-30");
assert.equal(ganttRows[0].offsetPercent, 5);
assert.equal(ganttRows[1].date, "2026-07-01");
assert.equal(ganttRows[1].offsetPercent, 36);
assert.equal(ganttRows[2].offsetPercent, 49);
assert.equal(ganttRows[ganttRows.length - 1].offsetPercent, 100);
assert.equal(ganttRows[ganttRows.length - 1].isManBurn, true);
assert.equal(ganttRows[ganttRows.length - 1].title, "Burn ends");

const upcomingGanttRows = buildUpcomingGanttMilestoneRows(datastore.milestones, "2026-06-01");
assert.deepEqual(upcomingGanttRows.map((row) => row.id), ["future-a", "future-b", "milestone-burn-ends-2026"]);
assert(!upcomingGanttRows.some((row) => row.id === "season-past"));

const noUpcomingGanttRowsAfterBurn = buildUpcomingGanttMilestoneRows(datastore.milestones, "2026-09-07");
assert.deepEqual(noUpcomingGanttRowsAfterBurn, []);

const ganttWithBurn = buildGanttMilestoneRows([]);
assert.deepEqual(ganttWithBurn.map((row) => row.id), ["milestone-burn-ends-2026"]);
assert.equal(ganttWithBurn[0].offsetPercent, 100);
assert.equal(ganttWithBurn[0].isManBurn, true);

console.log("Timeline and update helper tests passed");
