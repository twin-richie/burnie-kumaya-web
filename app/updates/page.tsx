import Link from "next/link";
import { History } from "lucide-react";

import { PlanningBadge, UpdateFeed } from "@/components/planning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { sortUpdatesNewestFirst } from "@/lib/timeline";

export const metadata = {
  title: "Updates · Burnie / Kumaya Planning Hub",
};

function EmptyPanel() {
  return <p className="rounded-xl border border-dashed border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">No changelog entries yet.</p>;
}

export default async function UpdatesPage() {
  const datastore = await loadDatastore();
  const updates = sortUpdatesNewestFirst(datastore.updates);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-amber-500/20 bg-stone-950/80 p-6 shadow-2xl shadow-black/30 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-amber-200 hover:text-amber-100" href="/">
              Burnie Ops
            </Link>
            <span className="text-stone-600">/</span>
            <PlanningBadge tone="amber">Updates</PlanningBadge>
          </div>
          <div className="space-y-4">
            <PlanningBadge tone="amber">changelog</PlanningBadge>
            <div>
              <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                <History className="size-9 text-amber-400" aria-hidden="true" />
                Updates
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
                Human-readable changelog for meaningful Burnie data changes, sorted newest first with changed object references, source, confidence, and provenance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PlanningBadge tone="blue">{updates.length} entries</PlanningBadge>
              <PlanningBadge tone="stone">newest first</PlanningBadge>
            </div>
          </div>
        </header>

        <section>{updates.length ? <UpdateFeed updates={updates} showProvenance /> : <EmptyPanel />}</section>

        <Card className="border-stone-800 bg-stone-950/70">
          <CardHeader>
            <CardTitle className="text-amber-100">Read-only changelog</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-400">
            This page answers what changed recently. Entries are authored in source YAML by Burnie or maintainers; the website exposes no editing controls.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
