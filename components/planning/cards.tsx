import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Area, Decision, Meeting, Milestone, Person, Task, Update } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfidenceBadge, NeedsReviewBadge, PlanningBadge, PriorityBadge, StatusBadge } from "./badges";
import { ProvenanceList, RecordMeta } from "./provenance";

type Lookup = {
  areas?: Area[];
  people?: Person[];
};

function areaName(areaSlug: string | undefined, areas: Area[] = []) {
  if (!areaSlug) return undefined;
  return areas.find((area) => area.slug === areaSlug)?.name ?? areaSlug;
}

function personName(personId: string | undefined, people: Person[] = []) {
  if (!personId) return undefined;
  return people.find((person) => person.id === personId)?.name ?? personId;
}

export function TaskList({
  tasks,
  areas = [],
  people = [],
  limit,
  showProvenance = false,
}: { tasks: Task[]; limit?: number; showProvenance?: boolean } & Lookup) {
  const visibleTasks = limit ? tasks.slice(0, limit) : tasks;
  return (
    <div className="space-y-3">
      {visibleTasks.map((task) => (
        <Card key={task.id} className="border-stone-800 bg-stone-950/70 shadow-sm shadow-black/20">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <ConfidenceBadge confidence={task.confidence} />
                  <NeedsReviewBadge needsReview={task.needs_review} />
                </div>
                <h3 className="text-base font-semibold text-stone-100">{task.title}</h3>
                {task.next_action ? <p className="text-sm text-stone-300">Next: {task.next_action}</p> : null}
                {task.review_note ? <p className="text-sm text-red-200/80">Review: {task.review_note}</p> : null}
                {task.notes ? <p className="text-sm text-stone-500">Notes: {task.notes}</p> : null}
              </div>
              <div className="min-w-48 space-y-1 text-sm text-stone-400 md:text-right">
                <div>{areaName(task.area, areas)}</div>
                {task.owner ? <div>Owner: {personName(task.owner, people)}</div> : <div>Owner unassigned</div>}
                {task.due_date ? <div>Due {task.due_date}</div> : <div>No due date</div>}
                <div className="font-mono text-xs text-stone-600">{task.id}</div>
              </div>
            </div>
            {showProvenance ? <SourceDisclosure provenance={task.provenance} /> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AreaCard({ area, people = [], taskCount }: { area: Area; people?: Person[]; taskCount?: number }) {
  return (
    <Card className="h-full border-stone-800 bg-gradient-to-br from-stone-950 to-stone-900/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-stone-100">{area.name}</CardTitle>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-amber-300/70">{area.slug}</p>
          </div>
          <ConfidenceBadge confidence={area.confidence} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-stone-300">
        <p>{area.description}</p>
        <div className="flex flex-wrap gap-2">
          {area.lead ? <PlanningBadge tone="amber">Lead: {personName(area.lead, people)}</PlanningBadge> : <PlanningBadge>Lead TBD</PlanningBadge>}
          {typeof taskCount === "number" ? <PlanningBadge tone="blue">{taskCount} tasks</PlanningBadge> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function TimelineList({ milestones, areas = [] }: { milestones: Milestone[]; areas?: Area[] }) {
  return (
    <div className="space-y-3">
      {milestones.map((milestone) => (
        <div key={milestone.id} className="grid gap-3 rounded-xl border border-stone-800 bg-stone-950/70 p-4 md:grid-cols-[8rem_1fr]">
          <time className="font-mono text-sm text-amber-200">{milestone.date}</time>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PlanningBadge tone="blue">{milestone.type}</PlanningBadge>
              {milestone.area ? <PlanningBadge>{areaName(milestone.area, areas)}</PlanningBadge> : null}
              <ConfidenceBadge confidence={milestone.confidence} />
            </div>
            <h3 className="font-semibold text-stone-100">{milestone.title}</h3>
            {milestone.description ? <p className="text-sm text-stone-400">{milestone.description}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DecisionList({
  decisions,
  areas = [],
  showProvenance = false,
  showSupersession = false,
}: {
  decisions: Decision[];
  areas?: Area[];
  showProvenance?: boolean;
  showSupersession?: boolean;
}) {
  return (
    <div className="space-y-3">
      {decisions.map((decision) => (
        <Card key={decision.id} className="border-stone-800 bg-stone-950/70">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <PlanningBadge tone="amber">{decision.date}</PlanningBadge>
              {decision.area ? <PlanningBadge>{areaName(decision.area, areas)}</PlanningBadge> : null}
              <ConfidenceBadge confidence={decision.confidence} />
              {showSupersession && decision.superseded_by ? <PlanningBadge tone="red">superseded by {decision.superseded_by}</PlanningBadge> : null}
              {showSupersession && decision.supersedes ? <PlanningBadge tone="purple">supersedes {decision.supersedes}</PlanningBadge> : null}
              {showSupersession && !decision.superseded_by && !decision.supersedes ? <PlanningBadge tone="green">current / no supersession</PlanningBadge> : null}
            </div>
            <div>
              <h3 className="font-semibold text-stone-100">{decision.title}</h3>
              <p className="mt-1 text-sm text-stone-300">{decision.decision}</p>
              {decision.rationale ? <p className="mt-2 text-sm text-stone-500">Rationale: {decision.rationale}</p> : null}
              <p className="mt-2 font-mono text-xs text-stone-600">{decision.id}</p>
            </div>
            {showProvenance ? <SourceDisclosure provenance={decision.provenance} /> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Card className="border-stone-800 bg-stone-950/70">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <PlanningBadge tone="amber">{meeting.date}</PlanningBadge>
          <ConfidenceBadge confidence={meeting.confidence} />
        </div>
        <CardTitle className="text-stone-100">{meeting.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-stone-300">
        <p>{meeting.summary}</p>
        {meeting.attendees.length ? <p className="text-stone-400">Attendees: {meeting.attendees.join(", ")}</p> : null}
        {meeting.sections.length ? (
          <div className="space-y-3">
            {meeting.sections.map((section) => (
              <section key={section.heading}>
                <h4 className="font-semibold text-stone-200">{section.heading}</h4>
                <p className="mt-1 text-stone-400">{section.body}</p>
              </section>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function UpdateFeed({ updates }: { updates: Update[] }) {
  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <Card key={update.id} className="border-stone-800 bg-stone-950/70">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <PlanningBadge tone="amber">{update.date}</PlanningBadge>
              <ConfidenceBadge confidence={update.confidence} />
              <PlanningBadge>{update.source}</PlanningBadge>
            </div>
            <div>
              <h3 className="font-semibold text-stone-100">{update.title}</h3>
              <p className="mt-1 text-sm text-stone-300">{update.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {update.changed_objects.map((object) => (
                <PlanningBadge key={`${update.id}-${object.type}-${object.id}`} tone="blue">
                  {object.type}: {object.id}
                </PlanningBadge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SourceDisclosure({ provenance, className }: { provenance: Parameters<typeof ProvenanceList>[0]["provenance"]; className?: string }) {
  return (
    <details className={cn("rounded-xl border border-stone-800 bg-stone-950/50 p-3", className)}>
      <summary className="cursor-pointer text-sm font-medium text-stone-200">Sources</summary>
      <div className="mt-3">
        <ProvenanceList provenance={provenance} />
      </div>
    </details>
  );
}

export { RecordMeta };
