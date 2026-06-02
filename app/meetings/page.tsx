import Link from "next/link";

import { CategoryStats, MeetingCard, NextLeadsAgendaCard, SiteFooter, SiteHeader } from "@/components/planning";
import { loadNextLeadsAgenda } from "@/lib/agenda";
import { loadDatastore } from "@/lib/data";
import { sortMeetingsNewestFirst } from "@/lib/records";

export const metadata = { title: "Meetings · Burnie / Kumaya Planning Hub" };

export default async function MeetingsPage() {
  const datastore = await loadDatastore();
  const nextLeadsAgenda = await loadNextLeadsAgenda();
  const meetings = sortMeetingsNewestFirst(datastore.meetings);

  return (
    <div className="min-h-screen">
      <SiteHeader current="meetings" />
      <main className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-10 sm:px-8">
        <CategoryStats stats={[{ value: meetings.length, label: "notes", accent: true }, { value: meetings.reduce((sum, meeting) => sum + meeting.attendees.length, 0), label: "attendees" }]} />
        <NextLeadsAgendaCard agenda={nextLeadsAgenda} />
        <section className="space-y-4" data-meetings-list="full-width">
          {meetings.map((meeting) => <Link key={meeting.slug} className="group block transition hover:-translate-y-0.5" href={`/meetings/${meeting.slug}`}><MeetingCard meeting={meeting} /></Link>)}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
