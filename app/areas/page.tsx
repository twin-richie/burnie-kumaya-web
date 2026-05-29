import Link from "next/link";
import { MapPinned } from "lucide-react";

import { AreaCard, PlanningBadge } from "@/components/planning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAreaTaskCounts } from "@/lib/areas";
import { loadDatastore } from "@/lib/data";

export const metadata = {
  title: "Areas · Burnie / Kumaya Planning Hub",
};

export default async function AreasPage() {
  const datastore = await loadDatastore();

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-amber-500/20 bg-stone-950/80 p-6 shadow-2xl shadow-black/30 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-amber-200 hover:text-amber-100" href="/">
              Burnie Ops
            </Link>
            <span className="text-stone-600">/</span>
            <PlanningBadge tone="amber">Areas</PlanningBadge>
          </div>
          <div className="space-y-4">
            <PlanningBadge tone="amber">planning domains</PlanningBadge>
            <div>
              <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                <MapPinned className="size-9 text-amber-400" aria-hidden="true" />
                Camp areas
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
                Browse each Kumaya planning domain with lead ownership, active task pressure, blockers, decisions, milestones, and source-backed updates.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {datastore.areas.map((area) => {
            const counts = getAreaTaskCounts(datastore, area.slug);
            return (
              <Link key={area.slug} className="group block" href={`/areas/${area.slug}`}>
                <div className="space-y-2 transition group-hover:-translate-y-0.5">
                  <AreaCard area={area} people={datastore.people} taskCount={counts.active} />
                  <div className="flex flex-wrap gap-2 px-1">
                    <PlanningBadge tone={counts.high ? "amber" : "stone"}>{counts.high} high</PlanningBadge>
                    <PlanningBadge tone={counts.blocked ? "red" : "stone"}>{counts.blocked} blocked</PlanningBadge>
                    <PlanningBadge tone={counts.needsReview ? "red" : "green"}>{counts.needsReview} needs review</PlanningBadge>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <Card className="border-stone-800 bg-stone-950/70">
          <CardHeader>
            <CardTitle className="text-amber-100">Read-only source of truth</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-400">
            This browser does not create, edit, or delete area data. Burnie updates the underlying YAML files and validation keeps the rendered site consistent.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
