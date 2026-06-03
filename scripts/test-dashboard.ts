import assert from "node:assert/strict";
import { summarizeAreas, summarizeAttention, daysUntil } from "../lib/dashboard";
import type { Datastore } from "../lib/types";

const asOf = new Date("2026-07-01T00:00:00.000Z");

const fixture = {
  areas: [
    {
      slug: "power",
      name: "Power",
      description: "Power systems",
      confidence: "high",
      provenance: [{ source_type: "manual_seed", source_ref: "test" }],
    },
  ],
  people: [],
  tasks: [
    {
      id: "overdue",
      code: "K-1",
      title: "Overdue",
      status: "open",
      priority: "high",
      area: "power",
      due_date: "2026-06-30",
      needs_review: false,
      confidence: "high",
      provenance: [{ source_type: "manual_seed", source_ref: "test" }],
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
    {
      id: "due-soon",
      code: "K-2",
      title: "Due soon",
      status: "open",
      priority: "normal",
      area: "power",
      due_date: "2026-07-10",
      needs_review: true,
      confidence: "medium",
      provenance: [{ source_type: "manual_seed", source_ref: "test" }],
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
    {
      id: "blocked",
      code: "K-3",
      title: "Blocked",
      status: "blocked",
      priority: "urgent",
      area: "power",
      needs_review: false,
      confidence: "low",
      provenance: [{ source_type: "manual_seed", source_ref: "test" }],
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
  ],
  meetings: [],
  decisions: [],
  milestones: [
    {
      id: "future",
      date: "2026-07-15",
      title: "Future milestone",
      type: "deadline",
      area: "power",
      confidence: "high",
      provenance: [{ source_type: "manual_seed", source_ref: "test" }],
    },
  ],
  updates: [],
} satisfies Datastore;

const summary = summarizeAttention(fixture, asOf, 14);
assert.equal(daysUntil("2026-07-10", asOf), 9);
assert.equal(summary.openTasks.length, 2);
assert.equal(summary.blockedTasks.length, 1);
assert.equal(summary.overdueTasks.length, 1);
assert.equal(summary.dueSoonTasks.length, 1);
assert.equal(summary.unownedHighPriorityTasks.length, 2);
assert.equal(summary.reviewTasks.length, 1);
assert.equal(summary.lowConfidenceTasks.length, 1);
assert.equal(summary.upcomingMilestones.length, 1);

const [area] = summarizeAreas(fixture, asOf);
assert.equal(area.openCount, 3);
assert.equal(area.highCount, 2);
assert.equal(area.blockedCount, 1);
assert.equal(area.nextMilestone?.id, "future");

console.log("Dashboard helper tests passed");
