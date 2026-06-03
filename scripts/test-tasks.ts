import assert from "node:assert/strict";
import { activeFilterCount, filterTasks, parseTaskFilters, taskAttentionScore, taskDueState } from "../lib/tasks";
import type { Task } from "../lib/types";

const asOf = new Date("2026-07-01T00:00:00.000Z");

const base: Pick<Task, "area" | "needs_review" | "confidence" | "provenance" | "created_at" | "updated_at"> = {
  area: "power",
  needs_review: false,
  confidence: "high",
  provenance: [{ source_type: "manual_seed", source_ref: "test" }],
  created_at: "2026-06-01",
  updated_at: "2026-06-01",
};

const tasks = [
  {
    ...base,
    id: "blocked-urgent",
    code: "K-1",
    title: "Blocked urgent",
    status: "blocked",
    priority: "urgent",
    owner: "richie",
    due_date: "2026-06-30",
  },
  {
    ...base,
    id: "unowned-review",
    code: "K-2",
    title: "Unowned review",
    status: "open",
    priority: "high",
    needs_review: true,
    confidence: "medium",
  },
  {
    ...base,
    id: "future-low",
    code: "K-3",
    title: "Future low",
    status: "in_progress",
    priority: "low",
    owner: "anton",
    due_date: "2026-08-15",
    area: "events",
    confidence: "low",
    updated_at: "2026-06-15",
  },
] satisfies Task[];

assert.equal(taskDueState(tasks[0], asOf), "overdue");
assert.equal(taskDueState(tasks[1], asOf), "no-date");
assert.equal(taskDueState(tasks[2], asOf), "dated");
assert.ok(taskAttentionScore(tasks[0], asOf) > taskAttentionScore(tasks[2], asOf));

const filters = parseTaskFilters({ status: "open", owner: "unowned", review: "needs-review", sort: "priority-asc" });
assert.equal(activeFilterCount(filters), 3);
assert.equal(filterTasks(tasks, filters, asOf).map((task) => task.id).join(","), "unowned-review");

assert.equal(filterTasks(tasks, parseTaskFilters({ due: "overdue" }), asOf).length, 1);
assert.equal(filterTasks(tasks, parseTaskFilters({ area: "events", confidence: "low" }), asOf)[0]?.id, "future-low");
assert.equal(filterTasks(tasks, parseTaskFilters({ owner: "unowned" }), asOf)[0]?.id, "unowned-review");
assert.equal(parseTaskFilters({ status: "bogus", sort: "bogus" }).sort, "attention");
assert.equal(parseTaskFilters({ sort: "priority" }).sort, "priority-asc");
assert.equal(filterTasks(tasks, parseTaskFilters({ sort: "title-desc" }), asOf)[0]?.id, "unowned-review");

console.log("Task filter helper tests passed");
