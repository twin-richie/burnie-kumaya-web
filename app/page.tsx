import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Gavel, Map, Users } from "lucide-react";

import { DecisionList, GanttTimeline, MeetingCard, NextLeadsAgendaCard, SectionHeader, SiteFooter, SiteHeader, TaskTable, UpdateFeed } from "@/components/planning";
import { Card, CardContent } from "@/components/ui/card";
import { loadNextLeadsAgenda } from "@/lib/agenda";
import { loadDatastore } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";
import { latestByDate, summarizeAreas, summarizeAttention } from "@/lib/dashboard";
import { buildGanttMilestoneRows, MAN_BURN_DATE } from "@/lib/timeline";
import type { Task } from "@/lib/types";

const sections = [
  { key: "timeline", label: "Timeline" },
  { key: "tasks", label: "Tasks" },
  { key: "areas", label: "Area" },
  { key: "meetings", label: "Meetings" },
  { key: "decisions", label: "Decisions" },
  { key: "updates", label: "Updates" },
];

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

function fmtDate(date: string) {
  return formatDisplayDate(date);
}

function dueSort(a: Task, b: Task) {
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
  if (a.due_date) return -1;
  if (b.due_date) return 1;
  const rank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
  return rank[a.priority] - rank[b.priority];
}

function Section({ id, alt, children }: { id: string; alt?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={alt ? "scroll-mt-16 border-b border-border bg-muted/30" : "scroll-mt-16 border-b border-border"}>
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8" style={{ paddingTop: "var(--section-gap)", paddingBottom: "var(--section-gap)" }}>
        {children}
      </div>
    </section>
  );
}

function SeasonRail({ rows, today }: { rows: ReturnType<typeof buildGanttMilestoneRows>; today: string }) {
  const toBurn = Math.max(1, daysBetween(today, MAN_BURN_DATE));
  const pct = (date: string) => Math.max(0, Math.min(100, (daysBetween(today, date) / toBurn) * 100));
  const burnStart = pct("2026-08-31");
  const dayGrid = Array.from({ length: toBurn + 1 }, (_, day) => ({ day, offsetPercent: Math.round((day / toBurn) * 10000) / 100 }));

  return (
    <div className="px-1 pb-2 pt-7">
      <div className="relative h-1.5 rounded-full bg-border">
        <div className="pointer-events-none absolute inset-y-[-18px] inset-x-0" data-overview-gantt-day-grid="true">
          {dayGrid.map((tick) => (
            <span key={`overview-day-${tick.day}`} className="absolute inset-y-0 w-px bg-border/35" style={{ left: `${tick.offsetPercent}%` }} aria-hidden="true" />
          ))}
        </div>
        <div className="absolute inset-y-[-3px] rounded-full bg-primary/30 ring-1 ring-primary/40" style={{ left: `${burnStart}%`, right: 0 }} title="Burn week" />
        {rows.map((row) => (
          <div key={row.id} className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${row.offsetPercent}%` }} title={`${row.title} · ${fmtDate(row.date)}`} aria-label={`${row.title} · ${fmtDate(row.date)}`}>
            <span className={row.isManBurn ? "block size-3 rounded-full border-2 border-card bg-primary shadow-sm" : "block size-3 rounded-full border-2 border-card bg-[hsl(var(--terracotta))] shadow-sm"} />
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              {fmtDate(row.date)} · {row.title}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
        <span>Today</span>
        <span className="text-primary">Burn week</span>
      </div>
    </div>
  );
}

function AttentionDashboard({ attention, latestUpdate }: { attention: ReturnType<typeof summarizeAttention>; latestUpdate?: { title: string; date: string } }) {
  const cards = [
    {
      label: "Due soon",
      value: attention.dueSoonTasks.length,
      detail: attention.dueSoonTasks[0]?.title ?? "No dated work in the next 30 days",
      href: "/tasks?due=due-soon",
      key: "due-soon",
    },
    {
      label: "Unowned high priority",
      value: attention.unownedHighPriorityTasks.length,
      detail: attention.unownedHighPriorityTasks[0]?.title ?? "Every urgent/high item has an owner",
      href: "/tasks?owner=unowned",
      key: "unowned-high",
    },
    {
      label: "Needs review",
      value: attention.reviewTasks.length,
      detail: attention.reviewTasks[0]?.title ?? "No records are asking for review",
      href: "/tasks?review=needs-review",
      key: "needs-review",
    },
    {
      label: "Latest update",
      value: latestUpdate ? formatDisplayDate(latestUpdate.date) : "—",
      detail: latestUpdate?.title ?? "No updates yet",
      href: "/updates",
      key: "latest-update",
    },
  ];

  return (
    <div data-attention-dashboard="true" className="mt-8 py-1">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary"><AlertTriangle className="size-4" aria-hidden="true" /> Camp lead attention</div>
          <p className="mt-1 max-w-[70ch] text-sm leading-6 text-muted-foreground">Start here: the records most likely to need a decision, owner, review, or follow-up.</p>
        </div>
        <Link href="/tasks" className="ring-focus text-sm font-medium text-primary hover:underline">Open task triage →</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.key} href={card.href} data-attention-risk-link={card.key} className="ring-focus group flex min-h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{card.label}</span>
              <span className="text-2xl font-semibold tabular-nums text-primary">{card.value}</span>
            </div>
            <p className="mt-5 line-clamp-2 max-w-[32ch] text-sm leading-6 text-muted-foreground group-hover:text-foreground">{card.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  const datastore = await loadDatastore();
  const nextLeadsAgenda = await loadNextLeadsAgenda();
  const today = isoToday();
  const attention = summarizeAttention(datastore);
  const areaSummaries = summarizeAreas(datastore);
  const latestMeetings = latestByDate(datastore.meetings, 1);
  const latestUpdate = latestByDate(datastore.updates, 1);
  const ganttRows = buildGanttMilestoneRows(datastore.milestones);
  const topTasks = [...datastore.tasks].filter((task) => task.status !== "done").sort(dueSort).slice(0, 10);
  const upcomingRows = ganttRows.filter((row) => daysBetween(today, row.date) >= 0).slice(0, 4);
  const toBurn = daysBetween(today, MAN_BURN_DATE);

  return (
    <div className="min-h-screen">
      <SiteHeader sections={sections} />

      <Section id="timeline">
        <SectionHeader eyebrow="Timeline" icon={CalendarClock} count={`${upcomingRows.length} upcoming`} title="Milestones from now through the burn" blurb="Key dates plotted from today to September 6. Hover markers for the date and event name. Task due dates surface here too." href="/timeline" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="shadow-xs">
            <CardContent className="p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted-foreground">Season at a glance</span>
                <span className="text-sm tabular-nums text-primary">{toBurn} days left</span>
              </div>
              <SeasonRail rows={ganttRows} today={today} />
            </CardContent>
          </Card>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Up next</div>
            <div className="space-y-2">
              {upcomingRows.map((row) => (
                <Link key={row.id} href="/timeline" className="ring-focus group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-xs transition-colors hover:bg-accent/50">
                  <div className="w-16 shrink-0 text-center"><div className="text-sm font-semibold tabular-nums">{fmtDate(row.date)}</div><div className="text-xs text-muted-foreground tabular-nums">{daysBetween(today, row.date)}d</div></div>
                  <div className="h-9 w-px bg-border" />
                  <div className="min-w-0 flex-1"><div className="font-medium group-hover:text-primary">{row.title}</div></div>
                  <ArrowRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="tasks" alt>
        <SectionHeader eyebrow="Tasks" icon={CheckCircle2} count={`${attention.openTasks.length} open`} title="Open work, sorted by what's due soonest" blurb="The ten most pressing items. Dated work leads, then by priority and review state. Open the dashboard to filter every task by status, area, owner and more." href="/tasks" />
        <AttentionDashboard attention={attention} latestUpdate={latestUpdate[0]} />
        <div className="mt-6"><TaskTable tasks={topTasks} areas={datastore.areas} people={datastore.people} limit={10} /><p className="mt-3 text-sm text-muted-foreground">Showing 10 of {attention.openTasks.length} open tasks · <Link href="/tasks" className="font-medium text-primary hover:underline">see all →</Link></p></div>
      </Section>

      <Section id="areas">
        <SectionHeader eyebrow="Area" icon={Map} count={`${areaSummaries.length} domains`} title="The planning domains and who leads them" blurb="Each area carries a lead, active task pressure, and its own decisions. Click any area for the full breakdown." href="/areas" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-overview-area-grid="true">
          {datastore.areas.map((area) => {
            const lead = area.lead ? datastore.people.find((person) => person.id === area.lead)?.name ?? area.lead : "Lead TBD";
            const taskCount = datastore.tasks.filter((task) => task.area === area.slug && task.status !== "done").length;

            return (
              <Link
                key={area.slug}
                href={`/areas/${area.slug}`}
                data-overview-area-card="true"
                className="group flex min-h-48 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">{area.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{area.description}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-wide text-muted-foreground">
                  <span>{lead}</span>
                  <span>{taskCount} open tasks</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section id="meetings" alt>
        <SectionHeader eyebrow="Meetings" icon={Users} count={`${datastore.meetings.length} notes`} title="Committee notes, kept source-true" blurb="Meeting records with summaries, extracted sections, and the tasks and decisions they generated." href="/meetings" />
        <div className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <NextLeadsAgendaCard agenda={nextLeadsAgenda} />
          {latestMeetings.map((meeting) => <MeetingCard key={meeting.slug} meeting={meeting} variant="summary" />)}
        </div>
      </Section>

      <Section id="decisions">
        <SectionHeader eyebrow="Decisions" icon={Gavel} count={`${datastore.decisions.length} logged`} title="Durable calls, with the reasoning attached" blurb="An append-only log. Each decision keeps its rationale, area, confidence and provenance, with supersession tracked rather than overwritten." href="/decisions" />
        <div className="mt-8"><DecisionList decisions={datastore.decisions.slice(0, 6)} areas={datastore.areas} showSupersession /></div>
      </Section>

      <Section id="updates" alt>
        <SectionHeader eyebrow="Updates" icon={Activity} count={`${datastore.updates.length} entries`} title="What Burnie changed, and when" blurb="A changelog of data updates so the plan stays auditable over the season." href="/updates" />
        <div className="mt-8 w-full max-w-[700px]"><UpdateFeed updates={latestUpdate} variant="flush" /></div>
      </Section>

      <SiteFooter />
    </div>
  );
}
