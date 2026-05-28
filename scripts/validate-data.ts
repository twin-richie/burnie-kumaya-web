import path from "node:path";
import { getRecordSource, loadDatastore } from "../lib/data";
import type { Datastore } from "../lib/types";

type Issue = {
  path: string;
  message: string;
};

function addIssue(issues: Issue[], path: string, message: string): void {
  issues.push({ path, message });
}

function recordPath(collectionName: string, index: number, record: object, field?: string): string {
  const source = getRecordSource(record);
  const base = source ? `${source} (${collectionName}[${index}])` : `${collectionName}[${index}]`;
  return field ? `${base}.${field}` : base;
}

function indexById<T extends object>(items: T[], getId: (item: T) => string, label: string, issues: Issue[]): Set<string> {
  const seen = new Set<string>();

  items.forEach((item, index) => {
    const id = getId(item);
    if (seen.has(id)) {
      addIssue(issues, recordPath(label, index, item as object), `Duplicate ${label} id/slug "${id}"`);
      return;
    }
    seen.add(id);
  });

  return seen;
}

function requireRef(issues: Issue[], path: string, value: string | undefined, validIds: Set<string>, label: string): void {
  if (value && !validIds.has(value)) {
    addIssue(issues, path, `Unknown ${label} reference "${value}"`);
  }
}

function looksLikeId(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]*$/.test(value);
}

function validateAiMaintainedPlanningRecords(data: Datastore, issues: Issue[]): void {
  const collections = [
    ["tasks", data.tasks],
    ["decisions", data.decisions],
    ["milestones", data.milestones],
    ["updates", data.updates],
  ] as const;

  for (const [collectionName, records] of collections) {
    records.forEach((record, index) => {
      if (!record.confidence) {
        addIssue(issues, recordPath(collectionName, index, record, "confidence"), "AI-maintained planning records require confidence");
      }

      if (!record.provenance.length) {
        addIssue(issues, recordPath(collectionName, index, record, "provenance"), "AI-maintained planning records require at least one provenance entry");
      }
    });
  }
}

function validateReferences(data: Datastore): Issue[] {
  const issues: Issue[] = [];
  const areaSlugs = indexById(data.areas, (area) => area.slug, "areas", issues);
  const personIds = indexById(data.people, (person) => person.id, "people", issues);
  const taskIds = indexById(data.tasks, (task) => task.id, "tasks", issues);
  const meetingSlugs = indexById(data.meetings, (meeting) => meeting.slug, "meetings", issues);
  const decisionIds = indexById(data.decisions, (decision) => decision.id, "decisions", issues);
  const milestoneIds = indexById(data.milestones, (milestone) => milestone.id, "milestones", issues);
  const updateIds = indexById(data.updates, (update) => update.id, "updates", issues);

  data.areas.forEach((area, index) => {
    requireRef(issues, recordPath("areas", index, area, "lead"), area.lead, personIds, "person");
  });

  data.people.forEach((person, personIndex) => {
    person.areas.forEach((area, areaIndex) => {
      requireRef(issues, recordPath("people", personIndex, person, `areas[${areaIndex}]`), area, areaSlugs, "area");
    });
  });

  data.tasks.forEach((task, index) => {
    requireRef(issues, recordPath("tasks", index, task, "area"), task.area, areaSlugs, "area");
    requireRef(issues, recordPath("tasks", index, task, "owner"), task.owner, personIds, "person");
  });

  data.meetings.forEach((meeting, meetingIndex) => {
    meeting.attendees.forEach((attendee, attendeeIndex) => {
      if (looksLikeId(attendee) && !personIds.has(attendee)) {
        addIssue(
          issues,
          recordPath("meetings", meetingIndex, meeting, `attendees[${attendeeIndex}]`),
          `Unknown person reference "${attendee}". Use a known person id, or a plain attendee name with spaces/capitalization.`,
        );
      }
    });

    meeting.action_items.forEach((actionItem, actionIndex) => {
      if (looksLikeId(actionItem) && !taskIds.has(actionItem)) {
        addIssue(
          issues,
          recordPath("meetings", meetingIndex, meeting, `action_items[${actionIndex}]`),
          `Unknown task reference "${actionItem}". Use a known task id, or an inline action item description.`,
        );
      }
    });

    meeting.decisions.forEach((decision, decisionIndex) => {
      requireRef(issues, recordPath("meetings", meetingIndex, meeting, `decisions[${decisionIndex}]`), decision, decisionIds, "decision");
    });
  });

  data.decisions.forEach((decision, index) => {
    requireRef(issues, recordPath("decisions", index, decision, "area"), decision.area, areaSlugs, "area");
    requireRef(issues, recordPath("decisions", index, decision, "supersedes"), decision.supersedes, decisionIds, "decision");
    requireRef(issues, recordPath("decisions", index, decision, "superseded_by"), decision.superseded_by, decisionIds, "decision");
  });

  data.milestones.forEach((milestone, index) => {
    requireRef(issues, recordPath("milestones", index, milestone, "area"), milestone.area, areaSlugs, "area");
  });

  const idsByType = {
    area: areaSlugs,
    person: personIds,
    task: taskIds,
    meeting: meetingSlugs,
    decision: decisionIds,
    milestone: milestoneIds,
    update: updateIds,
  };

  data.updates.forEach((update, updateIndex) => {
    update.changed_objects.forEach((changedObject, objectIndex) => {
      const validIds = idsByType[changedObject.type];
      if (!validIds.has(changedObject.id)) {
        addIssue(
          issues,
          recordPath("updates", updateIndex, update, `changed_objects[${objectIndex}].id`),
          `Unknown ${changedObject.type} reference "${changedObject.id}"`,
        );
      }
    });
  });

  validateAiMaintainedPlanningRecords(data, issues);

  return issues;
}

async function main(): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");

  try {
    const data = await loadDatastore(dataDir);
    const issues = validateReferences(data);

    if (issues.length > 0) {
      console.error(`Data validation failed with ${issues.length} issue(s):`);
      for (const issue of issues) {
        console.error(`- ${issue.path}: ${issue.message}`);
      }
      process.exit(1);
    }

    console.log(
      `Data validation passed: ${data.areas.length} areas, ${data.people.length} people, ${data.tasks.length} tasks, ${data.meetings.length} meetings, ${data.decisions.length} decisions, ${data.milestones.length} milestones, ${data.updates.length} updates.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Data validation failed: ${message}`);
    process.exit(1);
  }
}

void main();
