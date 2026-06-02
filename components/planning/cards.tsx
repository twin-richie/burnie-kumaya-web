import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NextLeadsAgenda } from "@/lib/agenda";
import { formatDisplayDate } from "@/lib/dates";
import type { GanttMilestoneRow } from "@/lib/timeline";
import type { Area, Decision, Meeting, Milestone, Person, Task, Update } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfidenceBadge, NeedsReviewBadge, PlanningBadge, PriorityBadge } from "./badges";
import { ProvenanceList, RecordMeta } from "./provenance";
import { SourceModalLink } from "./source-modal-link";

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

function groupedChangedObjects(update: Update) {
  const groups = new Map<string, Update["changed_objects"]>();
  update.changed_objects.forEach((object) => {
    const group = groups.get(object.type) ?? [];
    group.push(object);
    groups.set(object.type, group);
  });
  return Array.from(groups.entries()).map(([type, objects]) => ({ type, objects }));
}

export function TaskList({
  tasks,
  people = [],
  limit,
  showProvenance = false,
}: { tasks: Task[]; limit?: number; showProvenance?: boolean } & Lookup) {
  const visibleTasks = limit ? tasks.slice(0, limit) : tasks;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card" data-task-list-table="true">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">Tasks table</caption>
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Task name</th>
              <th scope="col" className="px-4 py-3 font-medium">Owner</th>
              <th scope="col" className="px-4 py-3 font-medium">Priority</th>
              <th scope="col" className="px-4 py-3 font-medium">Due date</th>
              <th scope="col" className="px-4 py-3 font-medium">Review?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {visibleTasks.map((task) => (
              <tr key={task.id} className="bg-card transition-colors hover:bg-accent/40">
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-foreground">{task.title}</div>
                  {showProvenance ? <div className="mt-2"><SourceDisclosure provenance={task.provenance} /></div> : null}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">{personName(task.owner, people) ?? "Unowned"}</td>
                <td className="px-4 py-3 align-top"><PriorityBadge priority={task.priority} /></td>
                <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{formatDisplayDate(task.due_date)}</td>
                <td className="px-4 py-3 align-top">{task.needs_review ? <NeedsReviewBadge needsReview={task.needs_review} /> : <span className="text-muted-foreground">No</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AreaCard({ area, people = [], taskCount }: { area: Area; people?: Person[]; taskCount?: number }) {
  return (
    <Card className="h-full ">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-foreground">{area.name}</CardTitle>
          </div>
          <ConfidenceBadge confidence={area.confidence} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{area.description}</p>
        <div className="flex flex-wrap gap-2">
          {area.lead ? <PlanningBadge tone="amber">Lead: {personName(area.lead, people)}</PlanningBadge> : <PlanningBadge>Lead TBD</PlanningBadge>}
          {typeof taskCount === "number" ? <PlanningBadge tone="blue">{taskCount} tasks</PlanningBadge> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function milestoneTone(type: Milestone["type"]) {
  const tone: Record<Milestone["type"], Parameters<typeof PlanningBadge>[0]["tone"]> = {
    deadline: "red",
    event: "purple",
    build: "amber",
    logistics: "blue",
    payment: "green",
    meeting: "stone",
  };
  return tone[type];
}

export function TimelineList({ milestones, areas = [], showProvenance = false }: { milestones: Milestone[]; areas?: Area[]; showProvenance?: boolean }) {
  return (
    <div className="space-y-3">
      {milestones.map((milestone) => (
        <div key={milestone.id} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[8rem_1fr]" data-milestone-item="true">
          <time className="font-mono text-sm text-muted-foreground">{formatDisplayDate(milestone.date)}</time>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">{milestone.title}</h3>
              {milestone.description ? <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2" data-milestone-metadata="true">
              <PlanningBadge tone={milestoneTone(milestone.type)}>{milestone.type}</PlanningBadge>
              {milestone.area ? <PlanningBadge>{areaName(milestone.area, areas)}</PlanningBadge> : null}
              <ConfidenceBadge confidence={milestone.confidence} />
              {showProvenance ? <SourceModalLink provenance={milestone.provenance} /> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatShortDate(date: string) {
  return formatDisplayDate(date);
}

export function GanttTimeline({ rows, areas = [], compact = false }: { rows: GanttMilestoneRow[]; areas?: Area[]; compact?: boolean }) {
  const axisRows = rows.map((row) => ({ id: row.id, date: row.date, label: formatShortDate(row.date), offsetPercent: row.offsetPercent }));
  const totalDays = Math.max(1, rows.at(-1)?.daysFromStart ?? 1);
  const weekTicks = Array.from({ length: Math.floor(totalDays / 7) + 1 }, (_, week) => {
    const day = week * 7;
    return { day, offsetPercent: Math.round((day / totalDays) * 10000) / 100 };
  });

  return (
    <div className="space-y-5" data-gantt-overview-style="true">
      <div className="px-1 pb-2 pt-9">
        <div className="relative mb-7 h-4" data-gantt-date-axis="true">
          {axisRows.map((tick) => (
            <div key={`${tick.id}-date-tick`} className="absolute top-0 -translate-x-1/2 text-xs font-medium tabular-nums text-muted-foreground" style={{ left: `${tick.offsetPercent}%` }}>
              <span className="whitespace-nowrap">{tick.label}</span>
            </div>
          ))}
        </div>
        <div className="relative h-1.5 rounded-full bg-border">
          <div className="pointer-events-none absolute inset-y-[-18px] inset-x-0" data-gantt-week-grid="true">
            {weekTicks.map((tick) => (
              <span key={`week-${tick.day}`} className="absolute inset-y-0 w-px bg-border/40" style={{ left: `${tick.offsetPercent}%` }} aria-hidden="true" data-gantt-week-tick="true" />
            ))}
          </div>
          <div className="absolute inset-y-[-3px] rounded-full bg-primary/30 ring-1 ring-primary/40" style={{ left: `${Math.max(0, Math.min(100, rows.find((row) => row.date >= "2026-08-30")?.offsetPercent ?? 92))}%`, right: 0 }} title="Burn week" />
          {rows.map((row) => (
            <div key={`${row.id}-marker`} className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${row.offsetPercent}%` }}>
              <span className={row.isManBurn ? "block size-3 rounded-full border-2 border-card bg-primary shadow-sm" : "block size-3 rounded-full border-2 border-card bg-[hsl(var(--terracotta))] shadow-sm"} />
              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                {formatShortDate(row.date)} · {row.title}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
          <span>Today</span>
          <span>Pre-build</span>
          <span className="text-primary">Burn week · Man burns {formatDisplayDate("2026-09-05")}</span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-xs transition-colors hover:bg-accent/50">
            <div className="w-16 shrink-0 text-center">
              <div className="text-sm font-semibold tabular-nums">{formatShortDate(row.date)}</div>
              <div className="text-xs text-muted-foreground tabular-nums">{row.daysFromStart}d</div>
            </div>
            <div className="h-9 w-px bg-border" />
            <div className="min-w-0 flex-1">
              <div className="font-medium group-hover:text-primary">{row.title}</div>
              {!compact && row.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.description}</p> : null}
            </div>
            <div className="hidden flex-wrap justify-end gap-2 sm:flex">
              {!row.isManBurn ? <PlanningBadge tone={milestoneTone(row.type)}>{row.type}</PlanningBadge> : null}
              {row.area ? <PlanningBadge>{areaName(row.area, areas)}</PlanningBadge> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DecisionList({
  decisions,
  areas = [],
  showProvenance = false,
  showSupersession = false,
  variant = "divided",
}: {
  decisions: Decision[];
  areas?: Area[];
  showProvenance?: boolean;
  showSupersession?: boolean;
  variant?: "divided" | "borderless";
}) {
  return (
    <ul className={variant === "borderless" ? "space-y-5" : "divide-y divide-border/80"} data-decision-list={variant}>
      {decisions.map((decision) => (
        <li key={decision.id} className="py-5 first:pt-0 last:pb-0">
          <div className={variant === "borderless" ? "space-y-3 rounded-xl bg-card/30 p-4" : "space-y-3"}>
            <div>
              <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-xl" data-decision-title="true">{decision.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{decision.decision}</p>
              {decision.rationale ? <p className="mt-2 text-sm text-muted-foreground">Rationale: {decision.rationale}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2" data-decision-metadata="true">
              {decision.area ? (
                <Link href={`/areas/${decision.area}`} data-decision-area-link="true" className="ring-focus rounded-full transition-opacity hover:opacity-80">
                  <PlanningBadge>{areaName(decision.area, areas)}</PlanningBadge>
                </Link>
              ) : null}
              <ConfidenceBadge confidence={decision.confidence} />
              {showSupersession && decision.superseded_by ? <PlanningBadge tone="red">superseded</PlanningBadge> : null}
              <time className="text-xs text-muted-foreground opacity-60">{formatDisplayDate(decision.date)}</time>
              {showProvenance ? <SourceModalLink provenance={decision.provenance} /> : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function NextLeadsAgendaCard({ agenda }: { agenda: NextLeadsAgenda }) {
  return (
    <Card className="shadow-xs" data-next-leads-agenda-card="true">
      <CardHeader>
        <CardTitle className="text-foreground" data-next-leads-agenda-title="true">{agenda.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p className="max-w-[75ch] leading-6">{agenda.summary}</p>
        <ol className="space-y-3 pl-5" data-next-leads-agenda-items="true">
          {agenda.items.map((item) => (
            <li key={item} className="list-decimal leading-6 marker:text-muted-foreground/60">
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-2" data-next-leads-agenda-metadata="true">
          <PlanningBadge tone="amber">updated {formatDisplayDate(agenda.updated_at)}</PlanningBadge>
          <PlanningBadge>{agenda.updated_by}</PlanningBadge>
          <ConfidenceBadge confidence={agenda.confidence} />
        </div>
      </CardContent>
    </Card>
  );
}

export function MeetingCard({ meeting, variant = "card" }: { meeting: Meeting; variant?: "card" | "summary" }) {
  if (variant === "summary") {
    return (
      <article className="w-full rounded-xl bg-card p-5 shadow-xs" data-meeting-summary="true">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">{meeting.title}</h3>
          <time className="shrink-0 text-sm text-muted-foreground opacity-60">{formatDisplayDate(meeting.date)}</time>
        </div>
        <p className="mt-4 max-w-[75ch] text-sm leading-6 text-muted-foreground">{meeting.summary}</p>
      </article>
    );
  }

  return (
    <Card data-meeting-card="true">
      <CardHeader>
        <CardTitle className="text-foreground" data-meeting-title="true">{meeting.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p data-meeting-summary-copy="true">{meeting.summary}</p>
        {meeting.attendees.length ? <p className="text-muted-foreground">Attendees: {meeting.attendees.join(", ")}</p> : null}
        {meeting.sections.length ? (
          <div className="space-y-3">
            {meeting.sections.map((section) => (
              <section key={section.heading}>
                <h4 className="font-semibold text-foreground">{section.heading}</h4>
                <p className="mt-1 text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2" data-meeting-metadata="true">
          <PlanningBadge tone="amber">{formatDisplayDate(meeting.date)}</PlanningBadge>
          <ConfidenceBadge confidence={meeting.confidence} />
        </div>
      </CardContent>
    </Card>
  );
}

export function UpdateFeed({ updates, showProvenance = false, variant = "card" }: { updates: Update[]; showProvenance?: boolean; variant?: "card" | "flush" }) {
  const itemClassName = variant === "flush" ? "space-y-3 py-1" : "space-y-3 p-4";
  const content = (update: Update) => (
    <div className={itemClassName}>
      <div>
        <h3 className="text-xl font-semibold text-foreground sm:text-2xl" data-update-title="true">{update.title}</h3>
        <p className="mt-1 max-w-[75ch] text-sm text-muted-foreground">{update.summary}</p>
      </div>
      <div>
        {update.changed_objects.length ? (
          <div className="space-y-4">
            {groupedChangedObjects(update).map((group) => (
              <section key={`${update.id}-${group.type}`} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <PlanningBadge tone="blue">{group.type}</PlanningBadge>
                </div>
                <ul className="divide-y divide-border/80">
                  {group.objects.map((object) => (
                    <li key={`${update.id}-${object.type}-${object.id}`} className="flex gap-2 py-2 text-sm text-muted-foreground first:pt-0 last:pb-0">
                      <span aria-hidden="true" className="mt-0.5 shrink-0">•</span>
                      <span>{object.change}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No changed object references recorded.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2" data-update-metadata="true">
        <PlanningBadge tone="amber">{formatDisplayDate(update.date)}</PlanningBadge>
        <ConfidenceBadge confidence={update.confidence} />
        <PlanningBadge>{update.source}</PlanningBadge>
        {showProvenance ? <SourceModalLink provenance={update.provenance} /> : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-4" data-overview-update-feed={variant === "flush" ? "true" : undefined}>
      {updates.map((update) => (
        variant === "flush" ? (
          <article key={update.id} data-update-item="true">{content(update)}</article>
        ) : (
          <Card key={update.id} data-update-item="true">
            <CardContent>{content(update)}</CardContent>
          </Card>
        )
      ))}
    </div>
  );
}

export function SourceDisclosure({ provenance, className }: { provenance: Parameters<typeof ProvenanceList>[0]["provenance"]; className?: string }) {
  return (
    <details className={cn("rounded-lg border p-3", className)}>
      <summary className="cursor-pointer text-sm font-medium text-foreground">Sources</summary>
      <div className="mt-3">
        <ProvenanceList provenance={provenance} />
      </div>
    </details>
  );
}

export { RecordMeta };
