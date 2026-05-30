import assert from "node:assert/strict";
import { decisionSupersessionLabel, getMeetingDetail, sortDecisionsNewestFirst, sortMeetingsNewestFirst } from "../lib/records";
import type { Datastore } from "../lib/types";

const provenance = [{ source_type: "manual_seed", source_ref: "test" }] as const;

const datastore = {
  areas: [],
  people: [],
  tasks: [
    {
      id: "task-a",
      title: "Task A",
      status: "open",
      priority: "high",
      area: "power",
      needs_review: false,
      confidence: "high",
      provenance: [...provenance],
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
    },
  ],
  meetings: [
    {
      slug: "old",
      date: "2026-05-01",
      title: "Old meeting",
      attendees: [],
      summary: "Old",
      sections: [],
      action_items: [],
      decisions: [],
      source_refs: [],
      confidence: "medium",
      provenance: [...provenance],
    },
    {
      slug: "new",
      date: "2026-06-01",
      title: "New meeting",
      attendees: ["richie"],
      summary: "New",
      sections: [{ heading: "Topic", body: "Discussed work." }],
      action_items: ["task-a", "missing-task"],
      decisions: ["decision-a", "missing-decision"],
      source_refs: ["test"],
      confidence: "high",
      provenance: [...provenance],
    },
  ],
  decisions: [
    {
      id: "decision-old",
      date: "2026-05-01",
      title: "Old decision",
      decision: "Old choice.",
      confidence: "medium",
      provenance: [...provenance],
      superseded_by: "decision-a",
    },
    {
      id: "decision-a",
      date: "2026-06-01",
      title: "Decision A",
      decision: "Do it.",
      area: "power",
      rationale: "Because it helps.",
      confidence: "high",
      provenance: [...provenance],
      supersedes: "decision-old",
    },
  ],
  milestones: [],
  updates: [],
} satisfies Datastore;

assert.deepEqual(sortMeetingsNewestFirst(datastore.meetings).map((meeting) => meeting.slug), ["new", "old"]);
assert.deepEqual(sortDecisionsNewestFirst(datastore.decisions).map((decision) => decision.id), ["decision-a", "decision-old"]);

const detail = getMeetingDetail(datastore, "new");
assert.ok(detail);
assert.equal(detail.meeting.title, "New meeting");
assert.deepEqual(detail.actionItems.map((task) => task.id), ["task-a"]);
assert.deepEqual(detail.decisions.map((decision) => decision.id), ["decision-a"]);
assert.equal(getMeetingDetail(datastore, "missing"), undefined);

assert.equal(decisionSupersessionLabel(datastore.decisions[0]), "superseded by decision-a");
assert.equal(decisionSupersessionLabel(datastore.decisions[1]), "supersedes decision-old");

console.log("Meeting and decision helper tests passed");
