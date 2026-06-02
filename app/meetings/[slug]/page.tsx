import { notFound } from "next/navigation";
import { CheckSquare, FileText, Gavel } from "lucide-react";

import { DecisionList, PlanningBadge, SiteFooter, SiteHeader, SourceDisclosure, TaskList, ConfidenceBadge } from "@/components/planning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";
import { getMeetingDetail } from "@/lib/records";

export async function generateStaticParams() {
  const datastore = await loadDatastore();
  return datastore.meetings.map((meeting) => ({ slug: meeting.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };
function EmptyPanel({ label }: { label: string }) { return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No {label} linked to this meeting yet.</p>; }
function StatCard({ label, value }: { label: string; value: number | string }) { return <Card><CardContent className="p-4"><div className="text-2xl font-semibold tabular-nums">{value}</div><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div></CardContent></Card>; }

export default async function MeetingDetailPage({ params }: PageProps) {
  const datastore = await loadDatastore();
  const { slug } = await params;
  const detail = getMeetingDetail(datastore, slug);
  if (!detail) notFound();

  const { meeting, actionItems, decisions } = detail;
  const attendeeNames = meeting.attendees.map((id) => datastore.people.find((person) => person.id === id)?.name ?? id);

  return (
    <div className="min-h-screen">
      <SiteHeader current="meetings" />
      <main className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-10 sm:px-8">
        <section className="grid grid-cols-4 gap-2 sm:gap-3" data-detail-stats="true"><StatCard label="date" value={formatDisplayDate(meeting.date)} /><StatCard label="attendees" value={attendeeNames.length} /><StatCard label="sections" value={meeting.sections.length} /><StatCard label="decisions" value={meeting.decisions.length} /></section>
        <div className="flex flex-wrap gap-2"><PlanningBadge tone="amber">{formatDisplayDate(meeting.date)}</PlanningBadge><ConfidenceBadge confidence={meeting.confidence} /></div>
        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card><CardHeader><CardTitle>Attendees</CardTitle><CardDescription>Rendered from stable person IDs where available.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2">{attendeeNames.map((name) => <PlanningBadge key={name} tone="blue">{name}</PlanningBadge>)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-5" aria-hidden="true" />Source refs</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground">{meeting.source_refs.length ? meeting.source_refs.map((ref) => <div key={ref} className="break-all rounded-lg border p-3 font-mono text-xs text-muted-foreground">{ref}</div>) : <EmptyPanel label="source refs" />}</CardContent></Card>
        </section>
        <section className="grid gap-4">{meeting.sections.map((section, index) => <Card key={`${section.heading}-${index}`}><CardHeader><CardTitle>{section.heading}</CardTitle></CardHeader><CardContent className="leading-7 text-muted-foreground">{section.body}</CardContent></Card>)}</section>
        <section className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckSquare className="size-5" aria-hidden="true" />Action items</CardTitle><CardDescription>{meeting.action_items.length} extracted task links.</CardDescription></CardHeader><CardContent>{actionItems.length ? <TaskList tasks={actionItems} areas={datastore.areas} people={datastore.people} showProvenance /> : <EmptyPanel label="action items" />}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="size-5" aria-hidden="true" />Linked decisions</CardTitle><CardDescription>{meeting.decisions.length} extracted decision links.</CardDescription></CardHeader><CardContent>{decisions.length ? <DecisionList decisions={decisions} areas={datastore.areas} showProvenance showSupersession /> : <EmptyPanel label="linked decisions" />}</CardContent></Card>
        </section>
        <SourceDisclosure provenance={meeting.provenance} />
      </main>
      <SiteFooter />
    </div>
  );
}
