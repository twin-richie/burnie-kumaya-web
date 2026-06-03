import assert from "node:assert/strict";
import { getAreaDetail, getAreaTaskCounts } from "../lib/areas";
import type { Datastore } from "../lib/types";

const provenance = [{ source_type: "manual_seed", source_ref: "meeting-a" }] as const;

const datastore = {
  areas: [
    {
      slug: "power",
      name: "Power",
      description: "Power systems",
      lead: "richie",
      confidence: "high",
      provenance: [...provenance],
    },
  ],
  people: [
    {
      id: "richie",
      name: "Richie",
      areas: ["power"],
      confidence: "high",
      provenance: [...provenance],
    },
  ],
  tasks: [
    {
      id: "task-open",
      code: "K-1",
      title: "Open task",
      status: "open",
      priority: "high",
      area: "power",
      owner: "richie",
      needs_review: false,
      confidence: "high",
      provenance: [...provenance],
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
    {
      id: "task-blocked",
      code: "K-2",
      title: "Blocked task",
      status: "blocked",
      priority: "urgent",
      area: "power",
      needs_review: true,
      confidence: "medium",
      provenance: [...provenance],
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
  ],
  meetings: [
    {
      slug: "meeting-a",
      date: "2026-05-25",
      title: "Meeting A",
      attendees: ["richie"],
      summary: "Discussed power.",
      sections: [],
      action_items: ["task-open"],
      decisions: ["decision-a"],
      source_refs: ["meeting-a"],
      confidence: "high",
      provenance: [...provenance],
    },
  ],
  decisions: [
    {
      id: "decision-a",
      date: "2026-05-25",
      title: "Decision A",
      decision: "Do it.",
      area: "power",
      confidence: "high",
      provenance: [...provenance],
    },
  ],
  milestones: [
    {
      id: "milestone-a",
      date: "2026-08-01",
      title: "Milestone A",
      type: "deadline",
      area: "power",
      confidence: "high",
      provenance: [...provenance],
    },
  ],
  updates: [
    {
      id: "update-a",
      date: "2026-06-01",
      title: "Update A",
      summary: "Changed power task.",
      changed_objects: [{ type: "task", id: "task-open", change: "Added" }],
      source: "test",
      confidence: "high",
      provenance: [...provenance],
    },
  ],
} satisfies Datastore;

const detail = getAreaDetail(datastore, "power");
assert.ok(detail);
assert.equal(detail.area.name, "Power");
assert.equal(detail.openTasks.length, 1);
assert.equal(detail.blockedTasks.length, 1);
assert.equal(detail.milestones.length, 1);
assert.equal(detail.decisions.length, 1);
assert.equal(detail.meetings.length, 1);
assert.equal(detail.updates.length, 1);
assert.equal(getAreaDetail(datastore, "missing"), undefined);

const counts = getAreaTaskCounts(datastore, "power");
assert.deepEqual(counts, { total: 2, active: 2, open: 1, blocked: 1, high: 2, needsReview: 1 });

console.log("Area helper tests passed");
