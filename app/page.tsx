import Link from "next/link";
import { AlertTriangle, CalendarClock, ClipboardList, Eye, Flag, ShieldAlert } from "lucide-react";

import { AreaCard, DecisionList, MeetingCard, PlanningBadge, TaskList, TimelineList, UpdateFeed } from "@/components/planning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { latestByDate, summarizeAreas, summarizeAttention } from "@/lib/dashboard";

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof ClipboardList }) {
  return (
    <Card className="border-stone-800 bg-stone-950/75 shadow-sm shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-stone-300">{label}</CardTitle>
        <Icon className="size-4 text-amber-400" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-stone-50">{value}</div>
        <p className="text-xs text-stone-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default async function Home() {
  const datastore = await loadDatastore();
  const attention = summarizeAttention(datastore);
  const areaSummaries = summarizeAreas(datastore);
  const latestMeeting = latestByDate(datastore.meetings, 1)[0];
  const recentDecisions = latestByDate(datastore.decisions, 4);
  const recentUpdates = latestByDate(datastore.updates, 3);
  const attentionTasks = [
    ...attention.overdueTasks,
    ...attention.blockedTasks,
    ...attention.unownedHighPriorityTasks,
    ...attention.dueSoonTasks,
    ...attention.reviewTasks,
    ...attention.lowConfidenceTasks,
  ].filter((task, index, tasks) => tasks.findIndex((candidate) => candidate.id === task.id) === index);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="overflow-hidden rounded-3xl border border-amber-500/20 bg-stone-950/80 shadow-2xl shadow-black/30">
          <div className="border-b border-amber-500/10 px-6 py-4">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-stone-400">
              <div className="mr-3 flex items-center gap-2 font-semibold text-amber-200">
                <Flag className="size-4 text-amber-400" aria-hidden="true" />
                Burnie Ops
              </div>
              {[
                { label: "Dashboard", href: "/" },
                { label: "Tasks", href: "/tasks" },
                { label: "Areas", href: "#camp-areas" },
                { label: "Meetings", href: "#latest-meeting" },
                { label: "Decisions", href: "#recent-decisions" },
                { label: "Timeline", href: "#timeline" },
                { label: "Updates", href: "#updates" },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <PlanningBadge tone={item.label === "Dashboard" ? "amber" : "stone"}>
                    {item.label}
                  </PlanningBadge>
                </Link>
              ))}
            </nav>
          </div>
          <section className="grid gap-8 px-6 py-10 lg:grid-cols-[1.25fr_0.75fr] lg:px-10">
            <div className="space-y-5">
              <PlanningBadge tone="amber">read-only · YAML-backed · provenance-first</PlanningBadge>
              <div>
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                  Kumaya attention dashboard
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
                  The current camp-planning state from Burnie’s structured YAML: urgent work, review queues, upcoming dates, and source-backed decisions.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PlanningBadge tone="red">{attention.overdueTasks.length} overdue</PlanningBadge>
                <PlanningBadge tone="amber">{attention.unownedHighPriorityTasks.length} unowned high-priority</PlanningBadge>
                <PlanningBadge tone="blue">{attention.dueSoonTasks.length} due soon</PlanningBadge>
                <PlanningBadge tone="red">{attention.reviewTasks.length} needs review</PlanningBadge>
              </div>
            </div>
            <Card className="border-amber-500/20 bg-stone-900/70">
              <CardHeader>
                <CardTitle className="text-amber-100">Latest meeting</CardTitle>
                <CardDescription>Most recent source-backed committee summary.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-stone-300">
                {latestMeeting ? (
                  <>
                    <p className="font-semibold text-stone-100">{latestMeeting.title}</p>
                    <p className="text-amber-200">{latestMeeting.date}</p>
                    <p>{latestMeeting.summary}</p>
                  </>
                ) : (
                  <p>No meetings seeded yet.</p>
                )}
              </CardContent>
            </Card>
          </section>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Open tasks" value={attention.openTasks.length} detail="Open or in progress" icon={ClipboardList} />
          <StatCard label="Blocked" value={attention.blockedTasks.length} detail="Explicitly blocked tasks" icon={AlertTriangle} />
          <StatCard label="Overdue / due soon" value={attention.overdueTasks.length + attention.dueSoonTasks.length} detail="Dated work needing timing attention" icon={CalendarClock} />
          <StatCard label="Needs review" value={attention.reviewTasks.length} detail="Ambiguous owner, scope, or source" icon={ShieldAlert} />
          <StatCard label="Upcoming milestones" value={attention.upcomingMilestones.length} detail="Future dated milestones" icon={Eye} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-orange-900/60 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Needs attention</CardTitle>
              <CardDescription>Overdue, blocked, unowned high-priority, due-soon, low-confidence, and needs-review work.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList tasks={attentionTasks.slice(0, 10)} areas={datastore.areas} people={datastore.people} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card id="timeline" className="border-stone-800 bg-stone-950/75">
              <CardHeader>
                <CardTitle className="text-amber-100">Upcoming timeline</CardTitle>
                <CardDescription>Only sourced future dates are shown.</CardDescription>
              </CardHeader>
              <CardContent>
                <TimelineList milestones={attention.upcomingMilestones.slice(0, 5)} areas={datastore.areas} />
              </CardContent>
            </Card>
            <Card id="updates" className="border-stone-800 bg-stone-950/75">
              <CardHeader>
                <CardTitle className="text-amber-100">Recent updates</CardTitle>
              </CardHeader>
              <CardContent>
                <UpdateFeed updates={recentUpdates} />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card id="recent-decisions" className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Recent decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <DecisionList decisions={recentDecisions} areas={datastore.areas} />
            </CardContent>
          </Card>
          {latestMeeting ? <div id="latest-meeting"><MeetingCard meeting={latestMeeting} /></div> : null}
        </section>

        <section id="camp-areas">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-stone-50">Camp areas</h2>
            <p className="text-sm text-stone-400">Lead ownership, active task counts, high-priority pressure, blockers, and next milestone where available.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {areaSummaries.map((summary) => (
              <div key={summary.area.slug} className="space-y-2">
                <AreaCard area={summary.area} people={datastore.people} taskCount={summary.openCount} />
                <div className="flex flex-wrap gap-2 px-1">
                  <PlanningBadge tone={summary.highCount ? "amber" : "stone"}>{summary.highCount} high</PlanningBadge>
                  <PlanningBadge tone={summary.blockedCount ? "red" : "stone"}>{summary.blockedCount} blocked</PlanningBadge>
                  {summary.nextMilestone ? <PlanningBadge tone="blue">Next: {summary.nextMilestone.date}</PlanningBadge> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
