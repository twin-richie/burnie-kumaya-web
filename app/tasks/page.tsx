import Link from "next/link";
import { ClipboardList, Filter, RotateCcw } from "lucide-react";

import { PlanningBadge, TaskList } from "@/components/planning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDatastore } from "@/lib/data";
import type { Area, Person } from "@/lib/types";
import {
  activeFilterCount,
  filterTasks,
  parseTaskFilters,
  taskConfidences,
  taskDueStates,
  taskPriorities,
  taskReviewStates,
  taskSorts,
  taskStatuses,
  type TaskFilters,
} from "@/lib/tasks";

export const metadata = {
  title: "Tasks · Burnie / Kumaya Planning Hub",
};

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

function label(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function personName(personId: string | undefined, people: Person[]) {
  if (!personId) return "Unowned";
  return people.find((person) => person.id === personId)?.name ?? personId;
}

function areaName(areaSlug: string, areas: Area[]) {
  return areas.find((area) => area.slug === areaSlug)?.name ?? areaSlug;
}

function SelectFilter({
  labelText,
  name,
  value,
  options,
}: {
  labelText: string;
  name: keyof TaskFilters;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block text-xs font-medium uppercase tracking-[0.16em] text-stone-500">{labelText}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="w-full rounded-lg border border-stone-800 bg-stone-950 px-3 py-2 text-stone-100 outline-none ring-amber-500/40 focus:ring-2"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TaskFiltersForm({ filters, areas, people }: { filters: TaskFilters; areas: Area[]; people: Person[] }) {
  return (
    <Card className="border-stone-800 bg-stone-950/75">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-100">
              <Filter className="size-4" aria-hidden="true" />
              Filters
            </CardTitle>
            <CardDescription>Read-only browsing. Change YAML directly when Burnie needs to edit source data.</CardDescription>
          </div>
          <PlanningBadge tone={activeFilterCount(filters) ? "amber" : "stone"}>{activeFilterCount(filters)} active</PlanningBadge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" action="/tasks">
          <SelectFilter
            labelText="Status"
            name="status"
            value={filters.status}
            options={taskStatuses.map((status) => ({ value: status, label: label(status) }))}
          />
          <SelectFilter
            labelText="Priority"
            name="priority"
            value={filters.priority}
            options={taskPriorities.map((priority) => ({ value: priority, label: label(priority) }))}
          />
          <SelectFilter
            labelText="Area"
            name="area"
            value={filters.area}
            options={areas.map((area) => ({ value: area.slug, label: area.name }))}
          />
          <SelectFilter
            labelText="Owner"
            name="owner"
            value={filters.owner}
            options={[
              { value: "unowned", label: "Unowned" },
              ...people.map((person) => ({ value: person.id, label: person.name })),
            ]}
          />
          <SelectFilter
            labelText="Due state"
            name="due"
            value={filters.due}
            options={taskDueStates.map((state) => ({ value: state, label: label(state) }))}
          />
          <SelectFilter
            labelText="Review state"
            name="review"
            value={filters.review}
            options={taskReviewStates.map((state) => ({ value: state, label: label(state) }))}
          />
          <SelectFilter
            labelText="Confidence"
            name="confidence"
            value={filters.confidence}
            options={taskConfidences.map((confidence) => ({ value: confidence, label: label(confidence) }))}
          />
          <SelectFilter
            labelText="Sort"
            name="sort"
            value={filters.sort}
            options={taskSorts.map((sort) => ({ value: sort, label: label(sort) }))}
          />
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-4">
            <button className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/20" type="submit">
              Apply filters
            </button>
            <Link className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-200 hover:bg-stone-900" href="/tasks">
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ActiveFilterSummary({ filters, areas, people }: { filters: TaskFilters; areas: Area[]; people: Person[] }) {
  const chips = [
    filters.status ? `status: ${label(filters.status)}` : undefined,
    filters.priority ? `priority: ${filters.priority}` : undefined,
    filters.area ? `area: ${areaName(filters.area, areas)}` : undefined,
    filters.owner ? `owner: ${filters.owner === "unowned" ? "Unowned" : personName(filters.owner, people)}` : undefined,
    filters.due ? `due: ${label(filters.due)}` : undefined,
    filters.review ? `review: ${label(filters.review)}` : undefined,
    filters.confidence ? `confidence: ${filters.confidence}` : undefined,
    `sort: ${label(filters.sort)}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <PlanningBadge key={chip} tone="stone">
          {chip}
        </PlanningBadge>
      ))}
    </div>
  );
}

export default async function TasksPage({ searchParams }: PageProps) {
  const datastore = await loadDatastore();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = parseTaskFilters(resolvedSearchParams);
  const tasks = filterTasks(datastore.tasks, filters);
  const openCount = datastore.tasks.filter((task) => task.status === "open" || task.status === "in_progress").length;
  const reviewCount = datastore.tasks.filter((task) => task.needs_review).length;
  const unownedCount = datastore.tasks.filter((task) => !task.owner).length;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-amber-500/20 bg-stone-950/80 p-6 shadow-2xl shadow-black/30 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-amber-200 hover:text-amber-100" href="/">
              Burnie Ops
            </Link>
            <span className="text-stone-600">/</span>
            <PlanningBadge tone="amber">Tasks</PlanningBadge>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <PlanningBadge tone="amber">read-only task browser</PlanningBadge>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">Task browsing and filtering</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
                  Inspect every YAML-backed camp task by status, priority, area, owner, due state, review state, and confidence.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-stone-800 bg-stone-900/70">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-stone-50">{datastore.tasks.length}</div>
                  <p className="text-xs text-stone-500">total tasks</p>
                </CardContent>
              </Card>
              <Card className="border-stone-800 bg-stone-900/70">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-stone-50">{openCount}</div>
                  <p className="text-xs text-stone-500">open / in progress</p>
                </CardContent>
              </Card>
              <Card className="border-stone-800 bg-stone-900/70">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-stone-50">{reviewCount}</div>
                  <p className="text-xs text-stone-500">needs review</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </header>

        <TaskFiltersForm filters={filters} areas={datastore.areas} people={datastore.people} />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-stone-50">
                <ClipboardList className="size-5 text-amber-400" aria-hidden="true" />
                {tasks.length} matching tasks
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {unownedCount} total tasks are unowned. Filter owner to “Unowned” to isolate assignment gaps.
              </p>
            </div>
            <ActiveFilterSummary filters={filters} areas={datastore.areas} people={datastore.people} />
          </div>

          {tasks.length ? (
            <TaskList tasks={tasks} areas={datastore.areas} people={datastore.people} showProvenance />
          ) : (
            <Card className="border-dashed border-stone-800 bg-stone-950/60">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-stone-100">No tasks match those filters.</h3>
                <p className="mt-2 text-sm text-stone-500">Relax one or more filters, or reset the browser to return to the full task list.</p>
                <Link className="mt-4 inline-flex rounded-lg border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/10" href="/tasks">
                  Reset filters
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
