"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Flame, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { key: string; label: string; href: string };

const pageNav: NavItem[] = [
  { key: "timeline", label: "Timeline", href: "/timeline" },
  { key: "tasks", label: "Tasks", href: "/tasks" },
  { key: "areas", label: "Area", href: "/areas" },
  { key: "meetings", label: "Meetings", href: "/meetings" },
  { key: "decisions", label: "Decisions", href: "/decisions" },
  { key: "updates", label: "Updates", href: "/updates" },
];

export function ThemeToggle() {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next = mode === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("kumaya-theme", next);
    setMode(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle theme"
      className="ring-focus inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {mode === "dark" ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
    </button>
  );
}


function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-full pr-1">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <Flame className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="font-serif text-[17px] font-semibold leading-none tracking-tight">Kumaya</span>
    </Link>
  );
}

export function SiteHeader({ current = "home", sections }: { current?: string; sections?: { key: string; label: string }[] }) {
  const isScroll = Boolean(sections?.length);
  const items = isScroll ? sections!.map((section) => ({ ...section, href: `#${section.key}` })) : pageNav;
  const [active, setActive] = useState(isScroll ? items[0]?.key : current);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isScroll) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    items.forEach((item) => {
      const el = document.getElementById(item.key);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isScroll, items]);

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6">
      <div className="mx-auto w-fit max-w-full">
        <div className="flex min-h-14 items-center gap-3 rounded-full border border-border/70 bg-background/75 px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sm:px-4">
          <Brand />
          <nav data-site-desktop-nav="true" className="hidden items-center gap-0.5 min-[760px]:flex">
            {items.map((item) => {
              const itemIsActive = isScroll ? active === item.key : current === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    itemIsActive ? "tab-active" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              data-site-mobile-nav-toggle="true"
              className="ring-focus inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground min-[760px]:hidden"
            >
              <ChevronDown className={cn("size-[18px] transition-transform", open && "rotate-180")} aria-hidden="true" />
            </button>
          </div>
        </div>
        {open ? (
          <nav className="mt-2 rounded-3xl border border-border/70 bg-background/90 p-2 shadow-lg shadow-black/5 backdrop-blur-xl min-[760px]:hidden">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function SiteFooter() {
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

function PageHero({
  current,
  icon: Icon = Flame,
  title,
  blurb,
  stats,
}: {
  current: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
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
              <Icon className="size-4" aria-hidden={true} />
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

function SectionHeader({
  eyebrow,
  icon: Icon,
  title,
  blurb,
  count,
  href,
  cta = "Open page",
}: {
  eyebrow: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  blurb?: string;
  count?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          {Icon ? <Icon className="size-4" aria-hidden={true} /> : null}
          <span className="uppercase tracking-wide">{eyebrow}</span>
          {count ? <span className="whitespace-nowrap text-muted-foreground">· {count}</span> : null}
        </div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {blurb ? <p className="text-pretty mt-2 text-[15px] leading-relaxed text-muted-foreground">{blurb}</p> : null}
      </div>
      {href ? (
        <Button asChild variant="outline" className="group shrink-0 bg-card">
          <Link href={href}>
            {cta}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
