import assert from "node:assert/strict";
import { countMilestonesByType, groupMilestonesByTime, sortMilestonesByDate, sortUpdatesNewestFirst } from "../lib/timeline";
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
    { id: "future-b", date: "2026-07-15", title: "Future B", type: "payment", confidence: "medium", provenance: [...provenance] },
    { id: "future-a", date: "2026-07-01", title: "Future A", type: "deadline", confidence: "high", provenance: [...provenance] },
  ],
  updates: [
    { id: "old", date: "2026-05-01", title: "Old", summary: "Old", changed_objects: [], source: "test", confidence: "high", provenance: [...provenance] },
    { id: "new", date: "2026-06-01", title: "New", summary: "New", changed_objects: [], source: "test", confidence: "high", provenance: [...provenance] },
  ],
} satisfies Datastore;

assert.deepEqual(sortMilestonesByDate(datastore.milestones).map((milestone) => milestone.id), ["past", "future-a", "future-b"]);
assert.deepEqual(sortMilestonesByDate(datastore.milestones, "desc").map((milestone) => milestone.id), ["future-b", "future-a", "past"]);

const grouped = groupMilestonesByTime(datastore, new Date("2026-06-01T00:00:00.000Z"));
assert.deepEqual(grouped.upcoming.map((milestone) => milestone.id), ["future-a", "future-b"]);
assert.deepEqual(grouped.past.map((milestone) => milestone.id), ["past"]);

const counts = countMilestonesByType(datastore.milestones);
assert.equal(counts.deadline, 1);
assert.equal(counts.payment, 1);
assert.equal(counts.meeting, 1);
assert.equal(counts.event, 0);

assert.deepEqual(sortUpdatesNewestFirst(datastore.updates).map((update) => update.id), ["new", "old"]);

console.log("Timeline and update helper tests passed");
