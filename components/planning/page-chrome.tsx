import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-primary" aria-hidden="true" />
          <span>Kumaya planning hub · maintained by Burnie</span>
        </div>
        <div className="font-mono text-xs">Source-backed · YAML-backed</div>
      </div>
    </footer>
  );
}

export function CategoryStats({
  stats,
  detail = false,
}: {
  stats: { value: string | number; label: string; accent?: boolean; tone?: string }[];
  detail?: boolean;
}) {
  return (
    <section
      className="grid grid-flow-col auto-cols-fr gap-3 overflow-x-auto"
      data-category-stats={detail ? undefined : "true"}
      data-detail-stats={detail ? "true" : undefined}
    >
      {stats.map((stat) => (
        <div key={stat.label} className={cn("rounded-lg border bg-card px-4 py-3", stat.accent ? "border-primary/40" : "border-border")}>
          <div className={cn("text-2xl font-semibold tabular-nums", stat.tone)}>{stat.value}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </section>
  );
}

export function PageHero({
  current,
  icon: Icon = Flame,
  title,
  blurb,
  stats,
}: {
  current: string;
  icon?: LucideIcon;
  title: string;
  blurb?: string;
  stats?: { value: string | number; label: string; accent?: boolean; tone?: string }[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="playa-grain absolute inset-0 opacity-50" />
      <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1320px] px-5 py-10 sm:px-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Overview</Link>
          <ChevronRight className="size-3.5 opacity-50" aria-hidden="true" />
          <span className="text-foreground">{current}</span>
        </nav>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <Icon className="size-4" aria-hidden="true" />
              <span className="uppercase tracking-[0.16em]">{current}</span>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            {blurb ? <p className="text-pretty mt-3 text-[15px] leading-relaxed text-muted-foreground">{blurb}</p> : null}
          </div>
          {stats ? (
            <div className="flex flex-wrap gap-2.5">
              {stats.map((stat) => (
                <div key={stat.label} className={cn("min-w-[92px] rounded-lg border bg-card px-4 py-3", stat.accent ? "border-primary/40" : "border-border")}>
                  <div className={cn("text-2xl font-semibold tabular-nums", stat.tone)}>{stat.value}</div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  icon?: LucideIcon;
  title: string;
  blurb?: string;
  count?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="max-w-2xl">
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{eyebrow}</h2>
        <p className="text-pretty mt-2 text-[15px] font-medium leading-relaxed text-foreground/60">{title}</p>
      </div>
      {href ? (
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-primary opacity-70 transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:opacity-100"
          data-section-chevron="true"
        >
          <ChevronRight
            className="size-5"
            aria-hidden="true"
          />
        </span>
      ) : null}
    </>
  );

  if (!href) {
    return <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">{content}</div>;
  }

  return (
    <Link
      href={href}
      className="ring-focus group flex flex-col gap-4 rounded-xl py-2 transition-colors hover:text-foreground sm:flex-row sm:items-start sm:justify-between"
      aria-label={`Open ${eyebrow}`}
    >
      {content}
    </Link>
  );
}
