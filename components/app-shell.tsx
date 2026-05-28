import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flame,
  RadioTower,
  ShieldCheck,
  Sparkles,
  TentTree,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { label: "Open tasks", value: "—", detail: "Waiting for YAML data", icon: ClipboardList },
  { label: "Blocked", value: "—", detail: "No datastore wired yet", icon: AlertTriangle },
  { label: "Due soon", value: "—", detail: "Timeline shell ready", icon: CalendarClock },
  { label: "Needs review", value: "—", detail: "Provenance-first by design", icon: ShieldCheck },
];

const areas = [
  "Power",
  "Kitchen / Food",
  "Water",
  "Fuel",
  "Finance",
  "Campers",
  "Build / Shade",
  "Interactivity",
  "Transport / Reno",
  "Meetings / Admin",
];

const navItems = ["Dashboard", "Tasks", "Areas", "Meetings", "Decisions", "Timeline", "Updates"];

export function AppShell() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="overflow-hidden rounded-3xl border border-amber-500/20 bg-stone-950/75 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="border-b border-amber-500/10 px-6 py-4">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="mr-3 flex items-center gap-2 font-semibold text-amber-200">
                <Flame className="size-4 text-amber-400" aria-hidden="true" />
                Burnie Ops
              </div>
              {navItems.map((item) => (
                <Badge
                  key={item}
                  variant={item === "Dashboard" ? "default" : "outline"}
                  className={
                    item === "Dashboard"
                      ? "border-amber-300/30 bg-amber-500/90 text-stone-950"
                      : "border-stone-700 bg-stone-900/60 text-stone-300"
                  }
                >
                  {item}
                </Badge>
              ))}
            </nav>
          </div>
          <section className="grid gap-8 px-6 py-10 lg:grid-cols-[1.35fr_0.65fr] lg:px-10">
            <div className="space-y-6">
              <Badge className="border-orange-300/30 bg-orange-950/80 text-amber-100" variant="outline">
                Next.js App Router shell · TypeScript · shadcn/ui
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
                  Burnie / Kumaya Planning Hub
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-stone-300">
                  A dark, warm desert-ops dashboard scaffold for camp planning: attention-first,
                  source-of-truth oriented, and ready for file-backed YAML data in the next phase.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-amber-500 text-stone-950 hover:bg-amber-400">
                  <RadioTower className="size-4" aria-hidden="true" />
                  Local service target: 8080
                </Button>
                <Button variant="outline" className="border-stone-700 bg-stone-900/70 text-stone-100 hover:bg-stone-800">
                  No auth · No database · No browser editing
                </Button>
              </div>
            </div>
            <Card className="border-amber-500/20 bg-stone-900/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-100">
                  <TentTree className="size-5 text-amber-400" aria-hidden="true" />
                  Phase 1 status
                </CardTitle>
                <CardDescription>Foundation is intentionally read-only and data-agnostic.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-stone-300">
                <div className="flex items-start gap-3 rounded-xl border border-stone-800 bg-black/20 p-3">
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-400" aria-hidden="true" />
                  App Router route renders this shell from <code>app/page.tsx</code>.
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-stone-800 bg-black/20 p-3">
                  <Sparkles className="mt-0.5 size-4 text-amber-400" aria-hidden="true" />
                  shadcn-compatible UI primitives live under <code>components/ui</code>.
                </div>
              </CardContent>
            </Card>
          </section>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-stone-800 bg-stone-950/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-300">{stat.label}</CardTitle>
                <stat.icon className="size-4 text-amber-400" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-stone-50">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-orange-900/60 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Needs Attention</CardTitle>
              <CardDescription>
                Placeholder panel for overdue, blocked, unowned high-priority, and low-confidence records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Wire YAML datastore and Zod validation in Phase 2.",
                "Preserve provenance and confidence on AI-maintained records.",
                "Keep the browser surface read-only for humans.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-300">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-stone-800 bg-stone-950/75">
            <CardHeader>
              <CardTitle className="text-amber-100">Camp Areas</CardTitle>
              <CardDescription>Baseline area cards for the future operational dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {areas.map((area) => (
                <div
                  key={area}
                  className="rounded-xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-4"
                >
                  <div className="text-sm font-semibold text-stone-100">{area}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Owner, counts, milestones, and latest update pending data.</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
