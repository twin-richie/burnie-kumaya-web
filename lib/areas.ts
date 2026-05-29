import type { Area, Datastore, Decision, Meeting, Milestone, Task, Update } from "./types";

export type AreaDetail = {
  area: Area;
  openTasks: Task[];
  blockedTasks: Task[];
  tasks: Task[];
  milestones: Milestone[];
  decisions: Decision[];
  meetings: Meeting[];
  updates: Update[];
};

function sourceRefsFor(records: Array<{ provenance: { source_ref: string }[] }>) {
  return new Set(records.flatMap((record) => record.provenance.map((source) => source.source_ref)));
}

function meetingMentionsRelatedRecord(meeting: Meeting, taskIds: Set<string>, decisionIds: Set<string>, refs: Set<string>) {
  if (meeting.action_items.some((id) => taskIds.has(id))) return true;
  if (meeting.decisions.some((id) => decisionIds.has(id))) return true;
  if (meeting.source_refs.some((ref) => refs.has(ref))) return true;
  if (meeting.provenance.some((source) => refs.has(source.source_ref))) return true;
  return false;
}

export function getAreaDetail(datastore: Datastore, slug: string): AreaDetail | undefined {
  const area = datastore.areas.find((candidate) => candidate.slug === slug);
  if (!area) return undefined;

  const tasks = datastore.tasks.filter((task) => task.area === slug);
  const activeTasks = tasks.filter((task) => task.status !== "done" && task.status !== "parked");
  const openTasks = activeTasks.filter((task) => task.status === "open" || task.status === "in_progress");
  const blockedTasks = activeTasks.filter((task) => task.status === "blocked");
  const milestones = datastore.milestones.filter((milestone) => milestone.area === slug).sort((a, b) => a.date.localeCompare(b.date));
  const decisions = datastore.decisions.filter((decision) => decision.area === slug).sort((a, b) => b.date.localeCompare(a.date));
  const updates = datastore.updates
    .filter((update) =>
      update.changed_objects.some((object) => {
        if (object.type === "area") return object.id === slug;
        if (object.type === "task") return tasks.some((task) => task.id === object.id);
        if (object.type === "decision") return decisions.some((decision) => decision.id === object.id);
        if (object.type === "milestone") return milestones.some((milestone) => milestone.id === object.id);
        return false;
      }),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const taskIds = new Set(tasks.map((task) => task.id));
  const decisionIds = new Set(decisions.map((decision) => decision.id));
  const refs = sourceRefsFor([area, ...tasks, ...decisions, ...milestones, ...updates]);
  const meetings = datastore.meetings
    .filter((meeting) => meetingMentionsRelatedRecord(meeting, taskIds, decisionIds, refs))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    area,
    openTasks,
    blockedTasks,
    tasks,
    milestones,
    decisions,
    meetings,
    updates,
  };
}

export function getAreaTaskCounts(datastore: Datastore, slug: string) {
  const tasks = datastore.tasks.filter((task) => task.area === slug);
  return {
    total: tasks.length,
    active: tasks.filter((task) => task.status !== "done" && task.status !== "parked").length,
    open: tasks.filter((task) => task.status === "open" || task.status === "in_progress").length,
    blocked: tasks.filter((task) => task.status === "blocked").length,
    high: tasks.filter((task) => task.priority === "urgent" || task.priority === "high").length,
    needsReview: tasks.filter((task) => task.needs_review).length,
  };
}
