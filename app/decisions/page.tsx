import Link from "next/link";
import { Gavel } from "lucide-react";

import { DecisionList, PlanningBadge } from "@/components/planning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { sortDecisionsNewestFirst } from "@/lib/records";

export const metadata = {
  title: "Decisions · Burnie / Kumaya Planning Hub",
};

export default async function DecisionsPage() {
  const datastore = await loadDatastore();
  const decisions = sortDecisionsNewestFirst(datastore.decisions);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-amber-500/20 bg-stone-950/80 p-6 shadow-2xl shadow-black/30 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-amber-200 hover:text-amber-100" href="/">
              Burnie Ops
            </Link>
            <span className="text-stone-600">/</span>
            <PlanningBadge tone="amber">Decisions</PlanningBadge>
          </div>
          <div className="space-y-4">
            <PlanningBadge tone="amber">append-oriented log</PlanningBadge>
            <div>
              <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                <Gavel className="size-9 text-amber-400" aria-hidden="true" />
                Decisions
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
                Durable camp decisions sorted newest first. Each entry keeps decision text, area, rationale, confidence, provenance, and visible supersedes / superseded-by state.
              </p>
            </div>
          </div>
        </header>

        <section>
          <DecisionList decisions={decisions} areas={datastore.areas} showProvenance showSupersession />
        </section>

        <Card className="border-stone-800 bg-stone-950/70">
          <CardHeader>
            <CardTitle className="text-amber-100">Append-only by convention</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-400">
            Historical decisions stay visible. If Burnie later changes direction, new records should link to older records through supersedes / superseded-by instead of silently rewriting history.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
