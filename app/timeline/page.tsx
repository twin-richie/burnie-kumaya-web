import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { PlanningBadge, TimelineList } from "@/components/planning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { countMilestonesByType, groupMilestonesByTime } from "@/lib/timeline";

export const metadata = {
  title: "Timeline · Burnie / Kumaya Planning Hub",
};

function EmptyPanel({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">No {label} milestones yet.</p>;
}

export default async function TimelinePage() {
  const datastore = await loadDatastore();
  const grouped = groupMilestonesByTime(datastore);
  const typeCounts = countMilestonesByType(datastore.milestones);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-amber-500/20 bg-stone-950/80 p-6 shadow-2xl shadow-black/30 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-amber-200 hover:text-amber-100" href="/">
              Burnie Ops
            </Link>
            <span className="text-stone-600">/</span>
            <PlanningBadge tone="amber">Timeline</PlanningBadge>
          </div>
          <div className="space-y-4">
            <PlanningBadge tone="amber">dated milestones</PlanningBadge>
            <div>
              <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                <CalendarClock className="size-9 text-amber-400" aria-hidden="true" />
                Timeline
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
                Upcoming and past camp milestones grouped by time. Every dated item keeps its type, area, description, confidence, and source provenance visible.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PlanningBadge tone="blue">{grouped.upcoming.length} upcoming</PlanningBadge>
              <PlanningBadge tone="stone">{grouped.past.length} past</PlanningBadge>
              <PlanningBadge tone="red">{typeCounts.deadline} deadlines</PlanningBadge>
              <PlanningBadge tone="green">{typeCounts.payment} payments</PlanningBadge>
              <PlanningBadge tone="purple">{typeCounts.event} events</PlanningBadge>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Upcoming</CardTitle>
              <CardDescription>Today and future milestones, soonest first.</CardDescription>
            </CardHeader>
            <CardContent>{grouped.upcoming.length ? <TimelineList milestones={grouped.upcoming} areas={datastore.areas} showProvenance /> : <EmptyPanel label="upcoming" />}</CardContent>
          </Card>

          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Past</CardTitle>
              <CardDescription>Historical milestones, newest first.</CardDescription>
            </CardHeader>
            <CardContent>{grouped.past.length ? <TimelineList milestones={grouped.past} areas={datastore.areas} showProvenance /> : <EmptyPanel label="past" />}</CardContent>
          </Card>
        </section>

        <Card className="border-stone-800 bg-stone-950/70">
          <CardHeader>
            <CardTitle className="text-amber-100">Read-only timeline</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-400">
            This view renders sourced milestone records only. It has no editing controls and avoids inferred dates unless they are explicitly represented in the YAML datastore.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
