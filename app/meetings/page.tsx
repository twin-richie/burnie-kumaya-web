import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { MeetingCard, PlanningBadge } from "@/components/planning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { sortMeetingsNewestFirst } from "@/lib/records";

export const metadata = {
  title: "Meetings · Burnie / Kumaya Planning Hub",
};

export default async function MeetingsPage() {
  const datastore = await loadDatastore();
  const meetings = sortMeetingsNewestFirst(datastore.meetings);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-amber-500/20 bg-stone-950/80 p-6 shadow-2xl shadow-black/30 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-amber-200 hover:text-amber-100" href="/">
              Burnie Ops
            </Link>
            <span className="text-stone-600">/</span>
            <PlanningBadge tone="amber">Meetings</PlanningBadge>
          </div>
          <div className="space-y-4">
            <PlanningBadge tone="amber">source summaries</PlanningBadge>
            <div>
              <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                <CalendarDays className="size-9 text-amber-400" aria-hidden="true" />
                Meetings
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
                Read-only meeting records sorted newest first, with summaries, extracted sections, linked action items, decisions, confidence, and source references preserved for traceability.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {meetings.map((meeting) => (
            <Link key={meeting.slug} className="group block" href={`/meetings/${meeting.slug}`}>
              <div className="transition group-hover:-translate-y-0.5">
                <MeetingCard meeting={meeting} />
              </div>
            </Link>
          ))}
        </section>

        <Card className="border-stone-800 bg-stone-950/70">
          <CardHeader>
            <CardTitle className="text-amber-100">Read-only source of truth</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-400">
            This page only renders meeting YAML and extracted records. Burnie updates source files directly; the site exposes no meeting editing controls.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
