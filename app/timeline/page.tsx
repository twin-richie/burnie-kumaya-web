import { CategoryStats, GanttTimeline, SiteFooter, SiteHeader, TimelineList } from "@/components/planning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";
import { buildGanttMilestoneRows, countMilestonesByType, groupMilestonesByTime, MAN_BURN_DATE } from "@/lib/timeline";

export const metadata = { title: "Timeline · Burnie / Kumaya Planning Hub" };

function EmptyPanel({ label }: { label: string }) { return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No {label} milestones yet.</p>; }

export default async function TimelinePage() {
  const datastore = await loadDatastore();
  const grouped = groupMilestonesByTime(datastore);
  const typeCounts = countMilestonesByType(datastore.milestones);
  const ganttRows = buildGanttMilestoneRows(datastore.milestones);

  return (
    <div className="min-h-screen">
      <SiteHeader current="timeline" />
      <main className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-10 sm:px-8">
        <CategoryStats stats={[{ value: grouped.upcoming.length, label: "upcoming", accent: true }, { value: grouped.past.length, label: "past" }, { value: typeCounts.deadline, label: "deadlines", tone: "text-destructive" }, { value: formatDisplayDate(MAN_BURN_DATE), label: "man burns", tone: "text-primary" }]} />
        <section data-timeline-upcoming-section="true">
          <Card className="shadow-xs" data-timeline-panel="true">
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription className="max-w-[75ch]">Milestones from now to September 6. Hover rail markers for the date and event name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <GanttTimeline rows={ganttRows} areas={datastore.areas} />
              <div data-timeline-upcoming-list="true">
                {grouped.upcoming.length ? <TimelineList milestones={grouped.upcoming} areas={datastore.areas} showProvenance /> : <EmptyPanel label="upcoming" />}
              </div>
            </CardContent>
          </Card>
        </section>
        <section data-timeline-past-section="true">
          <Card>
            <CardHeader>
              <CardTitle>Past</CardTitle>
              <CardDescription>Historical milestones, newest first.</CardDescription>
            </CardHeader>
            <CardContent>{grouped.past.length ? <TimelineList milestones={grouped.past} areas={datastore.areas} showProvenance /> : <EmptyPanel label="past" />}</CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
