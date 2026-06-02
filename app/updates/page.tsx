import { CategoryStats, SiteFooter, SiteHeader, UpdateFeed } from "@/components/planning";
import { loadDatastore } from "@/lib/data";
import { sortUpdatesNewestFirst } from "@/lib/timeline";

export const metadata = { title: "Updates · Burnie / Kumaya Planning Hub" };

function EmptyPanel() { return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No changelog entries yet.</p>; }

export default async function UpdatesPage() {
  const datastore = await loadDatastore();
  const updates = sortUpdatesNewestFirst(datastore.updates);
  const changedObjects = updates.reduce((sum, update) => sum + update.changed_objects.length, 0);

  return (
    <div className="min-h-screen">
      <SiteHeader current="updates" />
      <main className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-10 sm:px-8">
        <CategoryStats stats={[{ value: updates.length, label: "entries", accent: true }, { value: changedObjects, label: "objects" }]} />
        {updates.length ? <UpdateFeed updates={updates} showProvenance /> : <EmptyPanel />}
      </main>
      <SiteFooter />
    </div>
  );
}
