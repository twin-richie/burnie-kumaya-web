import type { Datastore, Decision, Meeting, Task } from "./types";

export function sortMeetingsNewestFirst(meetings: Meeting[]) {
  return [...meetings].sort((a, b) => b.date.localeCompare(a.date));
}

export function sortDecisionsNewestFirst(decisions: Decision[]) {
  return [...decisions].sort((a, b) => b.date.localeCompare(a.date));
}

export function getMeetingDetail(datastore: Datastore, slug: string) {
  const meeting = datastore.meetings.find((candidate) => candidate.slug === slug);
  if (!meeting) return undefined;
  const actionItems = meeting.action_items
    .map((id) => datastore.tasks.find((task) => task.id === id))
    .filter((task): task is Task => Boolean(task));
  const decisions = meeting.decisions
    .map((id) => datastore.decisions.find((decision) => decision.id === id))
    .filter((decision): decision is Decision => Boolean(decision));
  return { meeting, actionItems, decisions };
}

export function decisionSupersessionLabel(decision: Decision) {
  if (decision.superseded_by) return `superseded by ${decision.superseded_by}`;
  if (decision.supersedes) return `supersedes ${decision.supersedes}`;
  return "current / no supersession";
}
