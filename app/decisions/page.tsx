import { CategoryStats, DecisionList, SiteFooter, SiteHeader } from "@/components/planning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import { sortDecisionsNewestFirst } from "@/lib/records";

export const metadata = { title: "Decisions · Burnie / Kumaya Planning Hub" };

export default async function DecisionsPage() {
  const datastore = await loadDatastore();
  const decisions = sortDecisionsNewestFirst(datastore.decisions);
  const current = decisions.filter((decision) => !decision.superseded_by).length;

  return (
    <div className="min-h-screen">
      <SiteHeader current="decisions" />
      <main className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-10 sm:px-8">
        <CategoryStats stats={[{ value: decisions.length, label: "logged", accent: true }, { value: current, label: "current" }, { value: decisions.length - current, label: "superseded" }]} />
        <DecisionList decisions={decisions} areas={datastore.areas} showProvenance showSupersession />
        <Card><CardHeader><CardTitle>Append-only by convention</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Historical decisions stay visible. If Burnie later changes direction, new records should link to older records through supersedes / superseded-by instead of silently rewriting history.</CardContent></Card>
      </main>
      <SiteFooter />
    </div>
  );
}
