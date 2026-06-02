"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, X } from "lucide-react";

import { CategoryStats, SiteFooter, SiteHeader, TaskTable } from "@/components/planning";
import { Card, CardContent } from "@/components/ui/card";
import type { Area, Datastore, Person } from "@/lib/types";
import { filterTasks, parseTaskFilters, taskConfidences, taskDueState, taskDueStates, taskPriorities, taskReviewStates, taskStatuses, type TaskFilters, type TaskSort } from "@/lib/tasks";

type SearchParams = Record<string, string | string[] | undefined>;
type FilterKey = Exclude<keyof TaskFilters, "sort">;

type FilterConfig = {
  key: FilterKey;
  label: string;
  options: { value: string; label: string }[];
};

const filterOrder: FilterKey[] = ["status", "priority", "area", "owner", "due", "review", "confidence"];

function label(value: string) { return value.replaceAll("_", " ").replaceAll("-", " "); }
function scalar(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function filterConfigs(areas: Area[], people: Person[]): FilterConfig[] {
  return [
    { key: "status", label: "Status", options: taskStatuses.map((status) => ({ value: status, label: label(status) })) },
    { key: "priority", label: "Priority", options: taskPriorities.map((priority) => ({ value: priority, label: label(priority) })) },
    { key: "area", label: "Area", options: areas.map((area) => ({ value: area.slug, label: area.name })) },
    { key: "owner", label: "Owner", options: [{ value: "unowned", label: "Unowned" }, ...people.map((person) => ({ value: person.id, label: person.name }))] },
    { key: "due", label: "Due state", options: taskDueStates.map((state) => ({ value: state, label: label(state) })) },
    { key: "review", label: "Review", options: taskReviewStates.map((state) => ({ value: state, label: label(state) })) },
    { key: "confidence", label: "Confidence", options: taskConfidences.map((confidence) => ({ value: confidence, label: label(confidence) })) },
  ];
}

function activeKeysFrom(filters: TaskFilters, params: SearchParams): FilterKey[] {
  const requested = (scalar(params.filters) ?? "")
    .split(",")
    .filter((key): key is FilterKey => filterOrder.includes(key as FilterKey));
  const withValues = filterOrder.filter((key) => Boolean(filters[key]));
  return filterOrder.filter((key) => requested.includes(key) || withValues.includes(key));
}

function taskFilterValue(filters: TaskFilters, key: FilterKey) {
  return filters[key] ?? "";
}

function queryFor(filters: TaskFilters, activeKeys: FilterKey[], updates: Partial<Record<FilterKey | "sort", string | undefined>>, nextKeys = activeKeys) {
  const params = new URLSearchParams();
  if (nextKeys.length) params.set("filters", nextKeys.join(","));

  filterOrder.forEach((key) => {
    if (!nextKeys.includes(key) && updates[key] === undefined) return;
    const value = updates[key] !== undefined ? updates[key] : filters[key];
    if (value) params.set(key, value);
  });

  const sort = updates.sort !== undefined ? updates.sort : filters.sort;
  if (sort && sort !== "attention") params.set("sort", sort);

  const query = params.toString();
  return query ? `/tasks?${query}` : "/tasks";
}

function displayFilterValue(config: FilterConfig, value?: string) {
  if (!value) return "All";
  return config.options.find((option) => option.value === value)?.label ?? label(value);
}

function HiddenFilterInputs({ filters, activeKeys, omit }: { filters: TaskFilters; activeKeys: FilterKey[]; omit?: FilterKey }) {
  return (
    <>
      {activeKeys.length ? <input type="hidden" name="filters" value={activeKeys.join(",")} /> : null}
      {filters.sort !== "attention" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
      {filterOrder.map((key) => key !== omit && filters[key] ? <input key={key} type="hidden" name={key} value={filters[key]} /> : null)}
    </>
  );
}

function FilterChip({ config, filters, activeKeys }: { config: FilterConfig; filters: TaskFilters; activeKeys: FilterKey[] }) {
  const value = taskFilterValue(filters, config.key);
  const nextKeys = activeKeys.filter((key) => key !== config.key);
  const removeHref = queryFor(filters, nextKeys, { [config.key]: undefined }, nextKeys);

  return (
    <div className="relative inline-flex rounded-full border border-border bg-background shadow-xs">
      <details className="group">
        <summary className="ring-focus flex cursor-pointer list-none items-center gap-1.5 rounded-l-full px-3 py-1.5 text-sm hover:bg-accent">
          <span className="font-medium text-foreground">{config.label}</span>
          <span className="text-muted-foreground">{displayFilterValue(config, value)}</span>
        </summary>
        <form action="/tasks" className="absolute left-0 z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-3 shadow-lg">
          <HiddenFilterInputs filters={filters} activeKeys={activeKeys} omit={config.key} />
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{config.label}</span>
            <select name={config.key} defaultValue={value ?? ""} className="ring-focus w-full appearance-none rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent/40">
              <option value="">All</option>
              {config.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button className="mt-3 w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" type="submit">Apply</button>
        </form>
      </details>
      <Link href={removeHref} className="ring-focus inline-flex size-8 items-center justify-center rounded-r-full border-l border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label={`Remove ${config.label} filter`}>
        <X className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function TaskTableToolbar({ filters, params, areas, people, totalCount, resultCount }: { filters: TaskFilters; params: SearchParams; areas: Area[]; people: Person[]; totalCount: number; resultCount: number }) {
  const configs = filterConfigs(areas, people);
  const activeKeys = activeKeysFrom(filters, params);
  const inactiveConfigs = configs.filter((config) => !activeKeys.includes(config.key));
  const activeConfigs = configs.filter((config) => activeKeys.includes(config.key));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{resultCount}</span> of {totalCount} tasks shown</div>
        <details className="relative">
          <summary className="ring-focus inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent">
            <Plus className="size-4" aria-hidden="true" /> Add filter
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
            {inactiveConfigs.length ? inactiveConfigs.map((config) => (
              <Link key={config.key} href={queryFor(filters, activeKeys, {}, [...activeKeys, config.key])} className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                {config.label}
              </Link>
            )) : <div className="px-3 py-2 text-sm text-muted-foreground">All filters added</div>}
          </div>
        </details>
      </div>
      {activeConfigs.length ? (
        <div className="flex flex-wrap gap-2">
          {activeConfigs.map((config) => <FilterChip key={config.key} config={config} filters={filters} activeKeys={activeKeys} />)}
          <Link href="/tasks" className="ring-focus inline-flex items-center rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">Reset all</Link>
        </div>
      ) : null}
    </div>
  );
}

function nextSortFor(current: TaskSort, column: "title" | "owner" | "priority" | "due-date" | "review"): TaskSort {
  const asc = `${column}-asc` as TaskSort;
  const desc = `${column}-desc` as TaskSort;
  return current === asc ? desc : asc;
}

function sortLinksFor(filters: TaskFilters, activeKeys: FilterKey[]) {
  const columns = ["title", "owner", "priority", "due-date", "review"] as const;
  return Object.fromEntries(columns.map((column) => {
    const active = filters.sort === `${column}-asc` || filters.sort === `${column}-desc`;
    const direction = filters.sort === `${column}-desc` ? "desc" : filters.sort === `${column}-asc` ? "asc" : undefined;
    return [column, { href: queryFor(filters, activeKeys, { sort: nextSortFor(filters.sort, column) }), active, direction }];
  })) as Record<(typeof columns)[number], { href: string; active: boolean; direction?: "asc" | "desc" }>;
}

function TaskRiskRail({ unownedCount, reviewCount, dueSoonCount }: { unownedCount: number; reviewCount: number; dueSoonCount: number }) {
  const risks = [
    { label: "Unowned high priority", count: unownedCount, href: "/tasks?owner=unowned", note: "Assign a lead before this stalls" },
    { label: "Needs review", count: reviewCount, href: "/tasks?review=needs-review", note: "Confirm AI-inferred records" },
    { label: "Due soon", count: dueSoonCount, href: "/tasks?due=due-soon", note: "Date-driven work in the next 30 days" },
  ];

  return (
    <section data-task-risk-rail="true" className="mb-6 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary"><AlertTriangle className="size-4" aria-hidden="true" /> Triage risks</div>
      <div className="grid gap-3 md:grid-cols-3">
        {risks.map((risk) => (
          <Link key={risk.label} href={risk.href} className="ring-focus rounded-lg bg-background/45 p-4 transition-colors hover:bg-accent/40">
            <div className="flex items-baseline justify-between gap-3"><span className="font-medium text-foreground">{risk.label}</span><span className="text-2xl font-semibold tabular-nums text-primary">{risk.count}</span></div>
            <p className="mt-2 max-w-[34ch] text-sm leading-6 text-muted-foreground">{risk.note}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}


function searchParamsToRecord(searchParams: URLSearchParams): SearchParams {
  const params: SearchParams = {};
  searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing === undefined) {
      params[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      params[key] = [existing, value];
    }
  });
  return params;
}

export function TasksPageClient({ datastore }: { datastore: Datastore }) {
  const [resolvedSearchParams, setResolvedSearchParams] = useState<SearchParams>({});

  useEffect(() => {
    const updateSearchParams = () => setResolvedSearchParams(searchParamsToRecord(new URLSearchParams(window.location.search)));
    updateSearchParams();
    window.addEventListener("popstate", updateSearchParams);
    return () => window.removeEventListener("popstate", updateSearchParams);
  }, []);

  const filters = parseTaskFilters(resolvedSearchParams);
  const tasks = filterTasks(datastore.tasks, filters);
  const activeKeys = activeKeysFrom(filters, resolvedSearchParams);
  const sortLinks = sortLinksFor(filters, activeKeys);
  const reviewCount = datastore.tasks.filter((task) => task.needs_review).length;
  const unownedCount = datastore.tasks.filter((task) => !task.owner).length;
  const unownedHighCount = datastore.tasks.filter((task) => !task.owner && (task.priority === "urgent" || task.priority === "high") && task.status !== "done" && task.status !== "parked").length;
  const dueSoonCount = datastore.tasks.filter((task) => taskDueState(task) === "due-soon" && task.status !== "done" && task.status !== "parked").length;

  return (
    <div className="min-h-screen">
      <SiteHeader current="tasks" />
      <main className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8">
        <div className="mb-8">
          <CategoryStats stats={[{ value: datastore.tasks.length, label: "total", accent: true }, { value: reviewCount, label: "to review", tone: "text-[hsl(var(--warning))]" }, { value: unownedCount, label: "unowned" }]} />
        </div>
        <section>
          <TaskRiskRail unownedCount={unownedHighCount} reviewCount={reviewCount} dueSoonCount={dueSoonCount} />
          {tasks.length ? (
            <TaskTable
              tasks={tasks}
              areas={datastore.areas}
              people={datastore.people}
              showProvenance
              sortLinks={sortLinks}
              toolbar={<TaskTableToolbar filters={filters} params={resolvedSearchParams} areas={datastore.areas} people={datastore.people} totalCount={datastore.tasks.length} resultCount={tasks.length} />}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold">No tasks match those filters.</h3>
                <p className="mt-2 text-sm text-muted-foreground">Relax one or more filters, or reset the browser.</p>
                <Link className="mt-4 inline-flex rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent" href="/tasks">Reset filters</Link>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
