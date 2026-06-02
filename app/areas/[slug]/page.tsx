import { notFound } from "next/navigation";
import { AlertTriangle, ClipboardList } from "lucide-react";

import { DecisionList, MeetingCard, PlanningBadge, SiteFooter, SiteHeader, SourceDisclosure, TaskList, TimelineList, UpdateFeed, ConfidenceBadge } from "@/components/planning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAreaDetail, getAreaTaskCounts } from "@/lib/areas";
import { loadDatastore } from "@/lib/data";

export async function generateStaticParams() {
  const datastore = await loadDatastore();
  return datastore.areas.map((area) => ({ slug: area.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };
function EmptyPanel({ label }: { label: string }) { return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No {label} for this area yet.</p>; }
function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: string }) { return <Card><CardContent className="p-4"><div className={`text-2xl font-semibold tabular-nums ${tone ?? ""}`}>{value}</div><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div></CardContent></Card>; }

export default async function AreaDetailPage({ params }: PageProps) {
  const datastore = await loadDatastore();
  const { slug } = await params;
  const detail = getAreaDetail(datastore, slug);
  if (!detail) notFound();

  const counts = getAreaTaskCounts(datastore, slug);
  const lead = detail.area.lead ? datastore.people.find((person) => person.id === detail.area.lead) : undefined;

  return (
    <div className="min-h-screen">
      <SiteHeader current="areas" />
      <main className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-10 sm:px-8">
        <section className="grid grid-cols-4 gap-2 sm:gap-3" data-detail-stats="true"><StatCard label="active tasks" value={counts.active} /><StatCard label="blocked" value={counts.blocked} tone={counts.blocked ? "text-destructive" : undefined} /><StatCard label="needs review" value={counts.needsReview} tone={counts.needsReview ? "text-[hsl(var(--warning))]" : undefined} /><StatCard label="lead" value={lead?.name ?? "TBD"} /></section>
        <div className="flex flex-wrap gap-2">
          {lead ? <PlanningBadge tone="amber">Lead: {lead.name}</PlanningBadge> : <PlanningBadge>Lead TBD</PlanningBadge>}
          <ConfidenceBadge confidence={detail.area.confidence} />
        </div>
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="size-5" aria-hidden="true" />Open tasks</CardTitle><CardDescription>{detail.openTasks.length} open or in-progress tasks in this area.</CardDescription></CardHeader><CardContent>{detail.openTasks.length ? <TaskList tasks={detail.openTasks} areas={datastore.areas} people={datastore.people} showProvenance /> : <EmptyPanel label="open tasks" />}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5" aria-hidden="true" />Blocked tasks</CardTitle></CardHeader><CardContent>{detail.blockedTasks.length ? <TaskList tasks={detail.blockedTasks} areas={datastore.areas} people={datastore.people} showProvenance /> : <EmptyPanel label="blocked tasks" />}</CardContent></Card>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Milestones</CardTitle></CardHeader><CardContent>{detail.milestones.length ? <TimelineList milestones={detail.milestones} areas={datastore.areas} /> : <EmptyPanel label="milestones" />}</CardContent></Card>
          <Card><CardHeader><CardTitle>Decisions</CardTitle></CardHeader><CardContent>{detail.decisions.length ? <DecisionList decisions={detail.decisions} areas={datastore.areas} /> : <EmptyPanel label="decisions" />}</CardContent></Card>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Related meetings</CardTitle></CardHeader><CardContent className="space-y-3">{detail.meetings.length ? detail.meetings.map((meeting) => <MeetingCard key={meeting.slug} meeting={meeting} />) : <EmptyPanel label="related meetings" />}</CardContent></Card>
          <Card><CardHeader><CardTitle>Updates</CardTitle></CardHeader><CardContent>{detail.updates.length ? <UpdateFeed updates={detail.updates} /> : <EmptyPanel label="updates" />}</CardContent></Card>
        </section>
        <SourceDisclosure provenance={detail.area.provenance} />
      </main>
      <SiteFooter />
    </div>
  );
}
