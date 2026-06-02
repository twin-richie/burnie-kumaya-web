import Link from "next/link";

import { CategoryStats, SiteFooter, SiteHeader } from "@/components/planning";
import { loadDatastore } from "@/lib/data";

export const metadata = { title: "Areas · Burnie / Kumaya Planning Hub" };

export default async function AreasPage() {
  const datastore = await loadDatastore();
  const leadCount = datastore.areas.filter((area) => area.lead).length;

  return (
    <div className="min-h-screen">
      <SiteHeader current="areas" />
      <main className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-10 sm:px-8">
        <CategoryStats stats={[{ value: datastore.areas.length, label: "domains", accent: true }, { value: leadCount, label: "with leads" }, { value: datastore.areas.length - leadCount, label: "lead TBD", tone: "text-[hsl(var(--warning))]" }]} />
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-area-grid="true">
          {datastore.areas.map((area) => {
            const lead = area.lead ? datastore.people.find((person) => person.id === area.lead)?.name ?? area.lead : "Lead TBD";
            const taskCount = datastore.tasks.filter((task) => task.area === area.slug && task.status !== "done").length;
            return (
              <Link
                key={area.slug}
                className="group flex min-h-48 flex-col justify-between rounded-xl bg-card p-5 shadow-xs transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href={`/areas/${area.slug}`}
                data-area-card="true"
              >
                <div>
                  <h2 className="text-lg font-semibold leading-tight text-foreground group-hover:text-primary">{area.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{area.description}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-wide text-muted-foreground" data-area-card-meta="true">
                  <span>{lead}</span>
                  <span>{taskCount} open tasks</span>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
