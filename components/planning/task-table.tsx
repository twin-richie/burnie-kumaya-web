"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";

import type { Area, Person, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/dates";
import { ConfidenceBadge, NeedsReviewBadge, PlanningBadge, PriorityBadge, StatusBadge } from "./badges";
import { SourceDisclosure } from "./cards";

type SortColumn = "code" | "title" | "owner" | "priority" | "due-date" | "review";

type SortLink = {
  href: string;
  active: boolean;
  direction?: "asc" | "desc";
};

type SortLinks = Record<SortColumn, SortLink>;

type Lookup = {
  areas?: Area[];
  people?: Person[];
};

function areaName(areaSlug: string | undefined, areas: Area[] = []) {
  if (!areaSlug) return "Unassigned area";
  return areas.find((area) => area.slug === areaSlug)?.name ?? areaSlug;
}

function personName(personId: string | undefined, people: Person[] = []) {
  if (!personId) return "Unowned";
  return people.find((person) => person.id === personId)?.name ?? personId;
}

function pretty(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function ReviewCell({ task }: { task: Task }) {
  if (task.needs_review) return <PlanningBadge tone="amber">Yes</PlanningBadge>;
  return <span className="text-muted-foreground">No</span>;
}

function SortHeader({ label, sort }: { label: string; sort?: SortLink }) {
  const SortIcon = sort?.direction === "desc" ? ArrowDown : ArrowUp;
  const content = (
    <span className="inline-flex items-center gap-1.5">
      {label}
      {sort?.active && sort.direction ? (
        <SortIcon
          className="size-3.5 text-primary"
          data-sort-icon="true"
          data-sort-direction={sort.direction}
          aria-hidden="true"
        />
      ) : null}
      {sort?.active ? <span className="sr-only">sorted {sort.direction}</span> : null}
    </span>
  );

  if (!sort) return <span>{content}</span>;

  return (
    <Link href={sort.href} className="ring-focus -mx-2 rounded-md px-2 py-1 transition-colors hover:bg-accent hover:text-foreground">
      {content}
    </Link>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-3 last:border-0 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function TaskCodeBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex rounded-md border border-primary/20 bg-primary/5 px-2 py-1 font-mono text-xs font-semibold tabular-nums text-primary">
      {code}
    </span>
  );
}

function taskRisk(task: Task) {
  if (!task.owner && (task.priority === "urgent" || task.priority === "high")) return "unowned-high";
  if (task.needs_review) return "needs-review";
  return undefined;
}

export function TaskTable({
  tasks,
  areas = [],
  people = [],
  limit,
  showProvenance = false,
  sortLinks,
  toolbar,
}: { tasks: Task[]; limit?: number; showProvenance?: boolean; sortLinks?: SortLinks; toolbar?: React.ReactNode } & Lookup) {
  const visibleTasks = limit ? tasks.slice(0, limit) : tasks;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      <Card className="overflow-hidden shadow-xs" data-task-table="true">
        {toolbar ? <div className="border-b border-border bg-card p-4">{toolbar}</div> : null}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-sm">
              <caption className="sr-only">Tasks table</caption>
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium"><SortHeader label="ID" sort={sortLinks?.code} /></th>
                  <th scope="col" className="px-4 py-3 font-medium"><SortHeader label="Task name" sort={sortLinks?.title} /></th>
                  <th scope="col" className="px-4 py-3 font-medium"><SortHeader label="Owner" sort={sortLinks?.owner} /></th>
                  <th scope="col" className="px-4 py-3 font-medium"><SortHeader label="Priority" sort={sortLinks?.priority} /></th>
                  <th scope="col" className="px-4 py-3 font-medium"><SortHeader label="Due date" sort={sortLinks?.["due-date"]} /></th>
                  <th scope="col" className="px-4 py-3 font-medium"><SortHeader label="Review?" sort={sortLinks?.review} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {visibleTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    data-task-row-risk={taskRisk(task)}
                    className={cn("group cursor-pointer bg-card transition-colors hover:bg-accent/40", taskRisk(task) === "unowned-high" ? "bg-destructive/5" : undefined)}
                  >
                    <td className="px-4 py-3 align-middle"><TaskCodeBadge code={task.code} /></td>
                    <td className="px-4 py-3 align-middle">
                      <button
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        className="ring-focus -mx-1 block rounded px-1 text-left font-medium text-foreground underline-offset-4 group-hover:text-primary group-hover:underline"
                      >
                        {task.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-middle text-muted-foreground">{personName(task.owner, people)}</td>
                    <td className="px-4 py-3 align-middle"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3 align-middle font-mono text-xs text-muted-foreground">{formatDisplayDate(task.due_date)}</td>
                    <td className="px-4 py-3 align-middle"><ReviewCell task={task} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedTask ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="task-drawer-title">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            aria-label="Close task details"
            onClick={() => setSelectedTask(null)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedTask.status} />
                  <PriorityBadge priority={selectedTask.priority} />
                  <ConfidenceBadge confidence={selectedTask.confidence} />
                  <NeedsReviewBadge needsReview={selectedTask.needs_review} />
                </div>
                <div>
                  <div className="mb-2"><TaskCodeBadge code={selectedTask.code} /></div>
                  <h2 id="task-drawer-title" className="font-serif text-2xl font-semibold leading-tight text-foreground">{selectedTask.title}</h2>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedTask(null)} aria-label="Close task details">
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <dl className="rounded-lg border bg-background/40 px-4">
                <DetailRow label="Task ID" value={<TaskCodeBadge code={selectedTask.code} />} />
                <DetailRow label="Owner" value={personName(selectedTask.owner, people)} />
                <DetailRow label="Area" value={areaName(selectedTask.area, areas)} />
                <DetailRow label="Status" value={pretty(selectedTask.status)} />
                <DetailRow label="Priority" value={pretty(selectedTask.priority)} />
                <DetailRow label="Due date" value={formatDisplayDate(selectedTask.due_date, "No due date")} />
                <DetailRow label="Review?" value={selectedTask.needs_review ? "Yes" : "No"} />
                <DetailRow label="Created" value={formatDisplayDate(selectedTask.created_at)} />
                <DetailRow label="Updated" value={formatDisplayDate(selectedTask.updated_at)} />
              </dl>

              <div className="mt-5 space-y-4">
                {selectedTask.next_action ? <DetailCard title="Next action">{selectedTask.next_action}</DetailCard> : null}
                {selectedTask.review_note ? <DetailCard title="Review note" tone="warning">{selectedTask.review_note}</DetailCard> : null}
                {selectedTask.notes ? <DetailCard title="Notes">{selectedTask.notes}</DetailCard> : null}
                {showProvenance ? <SourceDisclosure provenance={selectedTask.provenance} /> : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DetailCard({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "warning" }) {
  return (
    <section className={cn("rounded-lg border bg-background/40 p-4", tone === "warning" ? "border-[hsl(var(--warning))]/40" : undefined)}>
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground">{children}</p>
    </section>
  );
}
