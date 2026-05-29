import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ClipboardList, MapPinned } from "lucide-react";

import { DecisionList, MeetingCard, PlanningBadge, SourceDisclosure, TaskList, TimelineList, UpdateFeed } from "@/components/planning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAreaDetail, getAreaTaskCounts } from "@/lib/areas";
import { loadDatastore } from "@/lib/data";

export async function generateStaticParams() {
  const datastore = await loadDatastore();
  return datastore.areas.map((area) => ({ slug: area.slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

function EmptyPanel({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">No {label} for this area yet.</p>;
}

function StatCard({ label, value, tone = "stone" }: { label: string; value: number; tone?: "stone" | "amber" | "red" | "green" }) {
  return (
    <Card className="border-stone-800 bg-stone-900/70">
      <CardContent className="p-4">
        <div className={tone === "red" ? "text-2xl font-bold text-red-200" : tone === "amber" ? "text-2xl font-bold text-amber-200" : tone === "green" ? "text-2xl font-bold text-emerald-200" : "text-2xl font-bold text-stone-50"}>{value}</div>
        <p className="text-xs text-stone-500">{label}</p>
      </CardContent>
    </Card>
  );
}

export default async function AreaDetailPage({ params }: PageProps) {
  const datastore = await loadDatastore();
  const { slug } = await params;
  const detail = getAreaDetail(datastore, slug);
  if (!detail) notFound();

  const counts = getAreaTaskCounts(datastore, slug);
  const lead = detail.area.lead ? datastore.people.find((person) => person.id === detail.area.lead) : undefined;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-amber-500/20 bg-stone-950/80 p-6 shadow-2xl shadow-black/30 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-amber-200 hover:text-amber-100" href="/">
              Burnie Ops
            </Link>
            <span className="text-stone-600">/</span>
            <Link className="text-stone-300 hover:text-stone-100" href="/areas">
              Areas
            </Link>
            <span className="text-stone-600">/</span>
            <PlanningBadge tone="amber">{detail.area.slug}</PlanningBadge>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <PlanningBadge tone="amber">area detail</PlanningBadge>
              <div>
                <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                  <MapPinned className="size-9 text-amber-400" aria-hidden="true" />
                  {detail.area.name}
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">{detail.area.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {lead ? <PlanningBadge tone="amber">Lead: {lead.name}</PlanningBadge> : <PlanningBadge>Lead TBD</PlanningBadge>}
                <PlanningBadge tone="green">confidence: {detail.area.confidence}</PlanningBadge>
                <PlanningBadge tone="stone">{detail.area.slug}</PlanningBadge>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="active tasks" value={counts.active} />
              <StatCard label="blocked" value={counts.blocked} tone={counts.blocked ? "red" : "green"} />
              <StatCard label="needs review" value={counts.needsReview} tone={counts.needsReview ? "amber" : "green"} />
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-100">
                <ClipboardList className="size-5" aria-hidden="true" />
                Open tasks
              </CardTitle>
              <CardDescription>{detail.openTasks.length} open or in-progress tasks in this area.</CardDescription>
            </CardHeader>
            <CardContent>{detail.openTasks.length ? <TaskList tasks={detail.openTasks} areas={datastore.areas} people={datastore.people} showProvenance /> : <EmptyPanel label="open tasks" />}</CardContent>
          </Card>

          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-100">
                <AlertTriangle className="size-5" aria-hidden="true" />
                Blocked tasks
              </CardTitle>
            </CardHeader>
            <CardContent>{detail.blockedTasks.length ? <TaskList tasks={detail.blockedTasks} areas={datastore.areas} people={datastore.people} showProvenance /> : <EmptyPanel label="blocked tasks" />}</CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Milestones</CardTitle>
            </CardHeader>
            <CardContent>{detail.milestones.length ? <TimelineList milestones={detail.milestones} areas={datastore.areas} /> : <EmptyPanel label="milestones" />}</CardContent>
          </Card>
          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Decisions</CardTitle>
            </CardHeader>
            <CardContent>{detail.decisions.length ? <DecisionList decisions={detail.decisions} areas={datastore.areas} /> : <EmptyPanel label="decisions" />}</CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Related meetings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">{detail.meetings.length ? detail.meetings.map((meeting) => <MeetingCard key={meeting.slug} meeting={meeting} />) : <EmptyPanel label="related meetings" />}</CardContent>
          </Card>
          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Updates</CardTitle>
            </CardHeader>
            <CardContent>{detail.updates.length ? <UpdateFeed updates={detail.updates} /> : <EmptyPanel label="updates" />}</CardContent>
          </Card>
        </section>

        <SourceDisclosure provenance={detail.area.provenance} />
      </div>
    </main>
  );
}
