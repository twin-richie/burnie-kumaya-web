import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckSquare, FileText, Gavel } from "lucide-react";

import { DecisionList, PlanningBadge, SourceDisclosure, TaskList } from "@/components/planning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { getMeetingDetail } from "@/lib/records";

export async function generateStaticParams() {
  const datastore = await loadDatastore();
  return datastore.meetings.map((meeting) => ({ slug: meeting.slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

function EmptyPanel({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">No {label} linked to this meeting yet.</p>;
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const datastore = await loadDatastore();
  const { slug } = await params;
  const detail = getMeetingDetail(datastore, slug);
  if (!detail) notFound();

  const { meeting, actionItems, decisions } = detail;
  const attendeeNames = meeting.attendees.map((id) => datastore.people.find((person) => person.id === id)?.name ?? id);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-amber-500/20 bg-stone-950/80 p-6 shadow-2xl shadow-black/30 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-amber-200 hover:text-amber-100" href="/">
              Burnie Ops
            </Link>
            <span className="text-stone-600">/</span>
            <Link className="text-stone-300 hover:text-stone-100" href="/meetings">
              Meetings
            </Link>
            <span className="text-stone-600">/</span>
            <PlanningBadge tone="amber">{meeting.slug}</PlanningBadge>
          </div>
          <div className="space-y-4">
            <PlanningBadge tone="amber">meeting detail</PlanningBadge>
            <div>
              <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                <CalendarDays className="size-9 text-amber-400" aria-hidden="true" />
                {meeting.title}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">{meeting.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PlanningBadge tone="amber">{meeting.date}</PlanningBadge>
              <PlanningBadge tone="green">confidence: {meeting.confidence}</PlanningBadge>
              <PlanningBadge tone="blue">{attendeeNames.length} attendees</PlanningBadge>
              <PlanningBadge tone="stone">{meeting.slug}</PlanningBadge>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Attendees</CardTitle>
              <CardDescription>Rendered from stable person IDs where available.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {attendeeNames.map((name) => (
                <PlanningBadge key={name} tone="blue">{name}</PlanningBadge>
              ))}
            </CardContent>
          </Card>

          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-100">
                <FileText className="size-5" aria-hidden="true" />
                Source refs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-stone-300">
              {meeting.source_refs.length ? meeting.source_refs.map((ref) => <div key={ref} className="break-all rounded-lg border border-stone-800 bg-stone-950/70 p-3 font-mono text-xs text-stone-400">{ref}</div>) : <EmptyPanel label="source refs" />}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4">
          {meeting.sections.map((section, index) => (
            <Card key={`${section.heading}-${index}`} className="border-stone-800 bg-stone-950/75">
              <CardHeader>
                <CardTitle className="text-amber-100">{section.heading}</CardTitle>
              </CardHeader>
              <CardContent className="leading-7 text-stone-300">{section.body}</CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-100">
                <CheckSquare className="size-5" aria-hidden="true" />
                Action items
              </CardTitle>
              <CardDescription>{meeting.action_items.length} extracted task links.</CardDescription>
            </CardHeader>
            <CardContent>{actionItems.length ? <TaskList tasks={actionItems} areas={datastore.areas} people={datastore.people} showProvenance /> : <EmptyPanel label="action items" />}</CardContent>
          </Card>

          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-100">
                <Gavel className="size-5" aria-hidden="true" />
                Linked decisions
              </CardTitle>
              <CardDescription>{meeting.decisions.length} extracted decision links.</CardDescription>
            </CardHeader>
            <CardContent>{decisions.length ? <DecisionList decisions={decisions} areas={datastore.areas} showProvenance showSupersession /> : <EmptyPanel label="linked decisions" />}</CardContent>
          </Card>
        </section>

        <SourceDisclosure provenance={meeting.provenance} />
      </div>
    </main>
  );
}
