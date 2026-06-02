import { readFile } from "node:fs/promises";

const base = process.env.SMOKE_URL ?? "http://127.0.0.1:8080";

const checks = [
  { path: "/", required: ["Milestones from May 25 through the burn"] },
  { path: "/tasks", required: ["Add filter", "Task name", "Owner", "Priority", "Due date", "Review?"] },
  { path: "/areas", required: ["Meetings and Admin", "Finance and Dues"] },
  { path: "/meetings", required: ["Kumaya Committee"] },
  { path: "/decisions", required: ["Track 18 committed people with goal of 20+"] },
  { path: "/timeline", required: ["Upcoming"] },
  { path: "/updates", required: ["Seeded Burnie/Kumaya v1 planning state"] },
];

function urlFor(path) {
  return new URL(path, base).toString();
}

async function fetchHtml(path) {
  const target = urlFor(path);
  const response = await fetch(target);
  if (!response.ok) {
    throw new Error(`Expected ${target} to return 2xx, got ${response.status}`);
  }
  return response.text();
}

function tableHeaderHtml(html) {
  const match = html.match(/<thead[\s\S]*?<\/thead>/);
  if (!match) throw new Error("Smoke test did not find task table header");
  return match[0];
}

function headerCellHtml(thead, label) {
  const cells = thead.match(/<th[\s\S]*?<\/th>/g) ?? [];
  const cell = cells.find((candidate) => candidate.includes(label));
  if (!cell) throw new Error(`Smoke test did not find task table header cell: ${label}`);
  return cell;
}

function assertTaskSortIcons() {
  return fetchHtml("/tasks").then((defaultHtml) => {
    const defaultThead = tableHeaderHtml(defaultHtml);
    if (defaultThead.includes('data-sort-icon="true"')) {
      throw new Error("Task table should not show sort icons when no table column is the active sort");
    }
  });
}

function sectionBetween(html, startId, endId) {
  const start = html.indexOf(`id="${startId}"`);
  const end = html.indexOf(`id="${endId}"`, start + 1);
  if (start === -1 || end === -1) throw new Error(`Smoke test could not locate overview section ${startId}`);
  return html.slice(start, end);
}

async function assertSiteHeaderBreakpoint() {
  const html = await fetchHtml("/");
  const desktopNav = html.match(/<nav[^>]*data-site-desktop-nav="true"[^>]*>/)?.[0] ?? "";
  if (!desktopNav.includes("min-[760px]:flex") || desktopNav.includes("lg:flex")) {
    throw new Error("Desktop site nav should switch on at the custom 760px breakpoint");
  }
  const mobileToggle = html.match(/<button[^>]*data-site-mobile-nav-toggle="true"[^>]*>/)?.[0] ?? "";
  if (!mobileToggle.includes("min-[760px]:hidden") || mobileToggle.includes("lg:hidden")) {
    throw new Error("Mobile nav toggle should hide at the custom 760px breakpoint");
  }
}

async function assertOverviewLatestMeetingCard() {
  const html = await fetchHtml("/");
  const meetingsSection = sectionBetween(html, "meetings", "decisions");
  const meetingTitles = meetingsSection.match(/Kumaya Committee/g) ?? [];
  if (meetingTitles.length !== 1) {
    throw new Error(`Overview meetings section should show only the latest meeting, found ${meetingTitles.length}`);
  }
  if (!meetingsSection.includes('data-meeting-summary="true"')) {
    throw new Error("Overview latest meeting should render as a compact summary preview");
  }
  const meetingSummaryOpen = meetingsSection.match(/<article[^>]*data-meeting-summary="true"[^>]*>/)?.[0] ?? "";
  for (const className of ["rounded-xl", "border", "border-border", "bg-card", "p-5", "shadow-xs"]) {
    if (!meetingSummaryOpen.includes(className)) throw new Error(`Overview latest meeting should use agenda-card border/shadow styling: missing ${className}`);
  }
  if (meetingsSection.includes("What this meeting covered") || meetingsSection.includes("<h4")) {
    throw new Error("Overview latest meeting should avoid nested section headings in the compact preview");
  }
}

async function assertCategoryPagesUseStatsInsteadOfHero() {
  const pages = [
    { route: "/timeline", removed: "The full road to the Man Burn" },
    { route: "/tasks", removed: "Browse and filter every camp task" },
    { route: "/areas", removed: "The planning domains and who leads them" },
    { route: "/meetings", removed: "Committee notes, kept source-true" },
    { route: "/decisions", removed: "Durable calls, with the reasoning attached" },
    { route: "/updates", removed: "What Burnie changed, and when" },
  ];
  for (const { route, removed } of pages) {
    const html = await fetchHtml(route);
    if (html.includes(removed)) {
      throw new Error(`${route} should not render the old hero heading/description copy`);
    }
    const stats = html.match(/<section[^>]*data-category-stats="true"[\s\S]*?<\/section>/)?.[0] ?? "";
    if (!stats) {
      throw new Error(`${route} should render high-level category stats at the top`);
    }
    const mainIndex = html.indexOf("<main");
    const statsIndex = html.indexOf('data-category-stats="true"');
    if (mainIndex === -1 || statsIndex === -1 || statsIndex < mainIndex) {
      throw new Error(`${route} category stats should live at the top of main content`);
    }
    if (!stats.includes("grid-flow-col") || !stats.includes("auto-cols-fr") || !stats.includes("overflow-x-auto")) {
      throw new Error(`${route} category stats should stay in one horizontal row`);
    }
    if (stats.includes("sm:grid-cols-2") || stats.includes("lg:grid-cols-4")) {
      throw new Error(`${route} category stats should not wrap into responsive grid columns`);
    }
    if (stats.includes("<h1") || stats.includes("<h2") || stats.includes("<p")) {
      throw new Error(`${route} category stats should not include heading or description copy`);
    }
  }
}

async function assertDetailPagesUseStatsInsteadOfHero() {
  const pages = ["/areas/meetings-admin", "/meetings/2026-05-25-kumaya-committee"];
  for (const route of pages) {
    const html = await fetchHtml(route);
    if (html.includes('data-page-hero="true"')) {
      throw new Error(`${route} should not render a hero section`);
    }
    const stats = html.match(/<section[^>]*data-detail-stats="true"[\s\S]*?<\/section>/)?.[0] ?? "";
    if (!stats) {
      throw new Error(`${route} should render high-level stats at the top of the detail page`);
    }
    const heroEnd = html.indexOf("<main");
    const statsIndex = html.indexOf('data-detail-stats="true"');
    if (heroEnd === -1 || statsIndex === -1 || statsIndex < heroEnd) {
      throw new Error(`${route} detail stats should live in main content, replacing the old hero chrome`);
    }
    if (!stats.includes("grid-cols-4")) {
      throw new Error(`${route} detail stats should use four columns at every breakpoint, including mobile`);
    }
    if (stats.includes("sm:grid-cols-4") || stats.includes("grid-flow-col") || stats.includes("overflow-x-auto")) {
      throw new Error(`${route} detail stats should not depend on responsive wrapping or horizontal scroll`);
    }
    if (stats.includes("<h1") || stats.includes("<h2") || stats.includes("<p")) {
      throw new Error(`${route} detail stats should not include heading or description copy`);
    }
  }
}

async function assertAreaNaming() {
  const routes = ["/", "/areas", "/areas/meetings-admin"];
  for (const route of routes) {
    const html = await fetchHtml(route);
    if (html.includes("Camp Areas")) {
      throw new Error(`${route} should rename visible Camp Areas copy to Area`);
    }
  }
}

async function assertOverviewSectionHeaders() {
  const html = await fetchHtml("/");
  const expectations = [
    { id: "timeline", href: "/timeline", name: "Timeline", subhead: "Milestones from May 25 through the burn", removedBlurb: "Key dates plotted from today to September 5", oldCta: "Open timeline" },
    { id: "tasks", href: "/tasks", name: "Tasks", subhead: "Open work, sorted by what&#x27;s due soonest", removedBlurb: "The ten most pressing items", oldCta: "Open task dashboard" },
    { id: "areas", href: "/areas", name: "Area", subhead: "The planning domains and who leads them", removedBlurb: "Each area carries a lead", oldCta: "Open areas" },
    { id: "meetings", href: "/meetings", name: "Meetings", subhead: "Committee notes, kept source-true", removedBlurb: "Meeting records with summaries", oldCta: "Open meetings" },
    { id: "decisions", href: "/decisions", name: "Decisions", subhead: "Durable calls, with the reasoning attached", removedBlurb: "An append-only log", oldCta: "Open decisions" },
    { id: "updates", href: "/updates", name: "Updates", subhead: "What Burnie changed, and when", removedBlurb: "A changelog of data updates", oldCta: "Open updates" },
  ];

  for (const expectation of expectations) {
    const nextId = expectations[expectations.indexOf(expectation) + 1]?.id;
    const section = nextId ? sectionBetween(html, expectation.id, nextId) : html.slice(html.indexOf(`id="${expectation.id}"`));
    const header = section.match(/<a[\s\S]*?<\/a>/)?.[0] ?? "";
    if (!header.includes(`<a`) || !header.includes(`href="${expectation.href}"`)) {
      throw new Error(`Overview ${expectation.name} header row should be a link to ${expectation.href}`);
    }
    const h2Index = header.indexOf("<h2");
    if (h2Index === -1 || !header.includes(`>${expectation.name}</h2>`)) {
      throw new Error(`Overview ${expectation.name} main heading should be the section name`);
    }
    const beforeHeading = header.slice(0, h2Index);
    if (beforeHeading.includes("<span") || beforeHeading.includes("<svg")) {
      throw new Error(`Overview ${expectation.name} header should not show eyebrow metadata above the main heading`);
    }
    if (!header.includes(expectation.subhead)) {
      throw new Error(`Overview ${expectation.name} should keep the former main heading as its only subhead`);
    }
    if (header.includes(expectation.removedBlurb)) {
      throw new Error(`Overview ${expectation.name} header should not show the second subhead/blurb`);
    }
    if (header.includes(expectation.oldCta)) {
      throw new Error(`Overview ${expectation.name} header should not show the old open button text`);
    }
    if (!header.includes('data-section-chevron="true"')) {
      throw new Error(`Overview ${expectation.name} header should include a chevron icon affordance`);
    }
    if (!header.includes("text-foreground/60")) {
      throw new Error(`Overview ${expectation.name} subheading should render at 60% opacity`);
    }
    if (!header.includes("rounded-full") || !header.includes("group-hover:bg-primary") || !header.includes("group-hover:text-primary-foreground")) {
      throw new Error(`Overview ${expectation.name} chevron should get a circular background and white icon on hover`);
    }
  }
}

async function assertDecisionMetadataLayout() {
  const html = await fetchHtml("/");
  const decisionsSection = sectionBetween(html, "decisions", "updates");
  const firstDecision = decisionsSection.match(/<li[\s\S]*?<\/li>/)?.[0];
  if (!firstDecision) throw new Error("Overview decisions section should render at least one decision item");
  const titleIndex = firstDecision.indexOf('data-decision-title="true"');
  const metadataIndex = firstDecision.indexOf('data-decision-metadata="true"');
  const timeIndex = firstDecision.indexOf("<time");
  if (titleIndex === -1 || metadataIndex === -1 || timeIndex === -1) {
    throw new Error("Decision item should expose title, metadata row, and date elements");
  }
  if (metadataIndex < titleIndex) {
    throw new Error("Decision metadata row should move below the decision title/content");
  }
  if (timeIndex < metadataIndex) {
    throw new Error("Decision date should live inside the bottom metadata row");
  }
  if (!firstDecision.includes("text-lg") || !firstDecision.includes("sm:text-xl")) {
    throw new Error("Decision title heading should use the larger title size classes");
  }
  const decisionsHtml = await fetchHtml("/decisions");
  const firstDecisionWithSources = decisionsHtml.match(/<li[\s\S]*?<\/li>/)?.[0] ?? "";
  if (firstDecisionWithSources.includes("<details") || firstDecisionWithSources.includes("rounded-lg border p-3")) {
    throw new Error("Decision sources should not render as prominent disclosure/card chrome");
  }
  if (!firstDecisionWithSources.includes('data-source-modal-trigger="true"')) {
    throw new Error("Decision sources should render as a metadata link that opens a source modal");
  }
  if (!firstDecisionWithSources.includes('data-decision-area-link="true"') || !firstDecisionWithSources.includes('href="/areas/')) {
    throw new Error("Decision area chips should link to the camp area detail screen");
  }
  const metadataWithSourcesIndex = firstDecisionWithSources.indexOf('data-decision-metadata="true"');
  const sourceLinkIndex = firstDecisionWithSources.indexOf('data-source-modal-trigger="true"');
  if (sourceLinkIndex < metadataWithSourcesIndex) {
    throw new Error("Decision source link should live in the metadata row");
  }
}

async function assertAreasPageGrid() {
  const html = await fetchHtml("/areas");
  const areaGrid = html.match(/<section[^>]*data-area-grid="true"[^>]*>/)?.[0] ?? "";
  if (!areaGrid) {
    throw new Error("Areas page should render camp areas as one grid container");
  }
  for (const className of ["grid", "gap-3", "sm:grid-cols-2", "lg:grid-cols-3"]) {
    if (!areaGrid.includes(className)) throw new Error(`Areas page grid should match overview area grid layout: missing ${className}`);
  }
  for (const removedChrome of ["overflow-hidden", "border", "bg-card", "rounded-xl"]) {
    if (areaGrid.includes(removedChrome)) throw new Error(`Areas page grid should not keep wrapper card chrome: ${removedChrome}`);
  }
  const areaLinks = html.match(/<a[^>]*data-area-card="true"[^>]*>/g) ?? [];
  if (!areaLinks.length) {
    throw new Error("Areas page should render each camp area as a full-card link");
  }
  for (const areaLink of areaLinks) {
    if (!areaLink.includes('href="/areas/')) {
      throw new Error("Clicking an area card should navigate to its detail page");
    }
    for (const className of ["rounded-xl", "border", "border-border", "bg-card", "p-5", "shadow-xs", "hover:bg-muted/50"]) {
      if (!areaLink.includes(className)) throw new Error(`Areas page cards should match agenda-card border/shadow styling: missing ${className}`);
    }
  }
  if (!html.includes('data-area-card-meta="true"') || html.includes("needs review") || html.includes("confidence:")) {
    throw new Error("Areas page cards should use a cleaner, less cluttered metadata row");
  }
}

async function assertCritiqueFixes() {
  const overviewHtml = await fetchHtml("/");
  const timelineSection = sectionBetween(overviewHtml, "timeline", "tasks");
  const tasksOverviewSection = sectionBetween(overviewHtml, "tasks", "areas");
  if (!tasksOverviewSection.includes('data-attention-dashboard="true"')) {
    throw new Error("Overview should combine camp-lead attention into the Tasks section before the task table");
  }
  if (timelineSection.includes('data-attention-dashboard="true"')) {
    throw new Error("Camp-lead attention should no longer be a standalone section above the timeline");
  }
  for (const label of ["Due soon", "Unowned high priority", "Needs review", "Latest update"]) {
    if (!tasksOverviewSection.includes(label)) throw new Error(`Tasks overview attention summary should include ${label}`);
  }
  if (tasksOverviewSection.indexOf('data-attention-dashboard="true"') > tasksOverviewSection.indexOf('data-task-table="true"')) {
    throw new Error("Tasks overview attention summary should appear before the task table");
  }
  if (!tasksOverviewSection.includes('data-attention-risk-link="unowned-high"') || !tasksOverviewSection.includes('/tasks?owner=unowned')) {
    throw new Error("Tasks overview attention summary should link unowned high-priority risk to the filtered task view");
  }
  const attentionCards = tasksOverviewSection.match(/<a[^>]*data-attention-risk-link="[^"]+"[^>]*>/g) ?? [];
  if (attentionCards.length !== 4) {
    throw new Error(`Tasks overview attention summary should render four area-style cards, found ${attentionCards.length}`);
  }
  for (const card of attentionCards) {
    for (const className of ["rounded-xl", "border", "border-border", "bg-card", "p-5", "shadow-xs", "hover:bg-muted/50"]) {
      if (!card.includes(className)) throw new Error(`Attention card should use agenda-card border/shadow styling: missing ${className}`);
    }
  }
  const meetingsSection = sectionBetween(overviewHtml, "meetings", "decisions");
  if (meetingsSection.includes("<h4")) {
    throw new Error("Overview meetings preview should not skip from h2 to h4 headings");
  }
  if (!meetingsSection.includes('data-next-leads-agenda-card="true"') || !meetingsSection.includes("Proposed agenda for next Leads meeting")) {
    throw new Error("Overview meetings section should include a proposed agenda card for the next Leads meeting");
  }
  if (!meetingsSection.includes("Burnie can update this agenda any time")) {
    throw new Error("Next Leads agenda card should tell camp leads that Burnie can update the agenda any time");
  }
  const decisionsSection = sectionBetween(overviewHtml, "decisions", "updates");
  if (!decisionsSection.includes('data-decision-list="divided"')) {
    throw new Error("Overview decisions should render as the standard divided decision list");
  }
  if (decisionsSection.includes("rounded-xl bg-card/30 p-4")) {
    throw new Error("Borderless decision cards should not use the old translucent card treatment");
  }
  const tasksHtml = await fetchHtml("/tasks");
  if (!tasksHtml.includes('data-task-risk-rail="true"')) {
    throw new Error("Tasks page should expose a risk triage rail above the table");
  }
  for (const href of ["/tasks?owner=unowned", "/tasks?review=needs-review", "/tasks?due=due-soon"]) {
    if (!tasksHtml.includes(`href="${href}`)) throw new Error(`Task risk rail should link to ${href}`);
  }
  if (!tasksHtml.includes('data-task-row-risk="unowned-high"')) {
    throw new Error("Task table should mark unowned high-priority rows as risk rows");
  }
  const timelineHtml = await fetchHtml("/timeline");
  const timelinePanel = timelineHtml.match(/<div[^>]*data-timeline-panel="true"[^>]*>/)?.[0] ?? "";
  if (!timelinePanel) {
    throw new Error("Timeline page should mark the main timeline panel for visual smoke coverage");
  }
  for (const className of ["rounded-xl", "border", "bg-card", "text-card-foreground", "shadow-xs"]) {
    if (!timelinePanel.includes(className)) throw new Error(`Timeline page main timeline panel should match the overview card treatment: missing ${className}`);
  }
  if (timelinePanel.includes("bg-transparent")) {
    throw new Error("Timeline page should bring back the card background on the main timeline panel");
  }
  if (timelineHtml.includes("bg-border/25")) {
    throw new Error("Timeline should remove the translucent phase-background spans");
  }
  const weekTicks = timelineHtml.match(/data-gantt-week-tick="true"/g) ?? [];
  const weeksToBurn = Math.floor((Date.parse("2026-09-06T00:00:00.000Z") - Date.parse("2026-05-25T00:00:00.000Z")) / (7 * 86_400_000)) + 1;
  if (weekTicks.length !== Math.max(1, weeksToBurn)) {
    throw new Error(`Timeline should render one tick for every week to the Man Burn, expected ${Math.max(1, weeksToBurn)}, found ${weekTicks.length}`);
  }
  if (!timelineHtml.includes("Burn week")) {
    throw new Error("Timeline should still emphasize the Burn week deadline band");
  }
  if (!timelineHtml.includes('data-gantt-today-marker="true"') || !timelineHtml.includes("Today · Jun 02")) {
    throw new Error("Timeline should mark today on the rail with a hover label");
  }
  if (!timelineHtml.includes("First meeting") || timelineHtml.includes("Phase markers")) {
    throw new Error("Timeline rail should label the season start as First meeting and omit the middle Phase markers label");
  }
  for (const path of ["/", "/timeline", "/updates"]) {
    const html = await fetchHtml(path);
    if (!html.includes("max-w-[75ch]") && !html.includes("max-w-[70ch]")) {
      throw new Error(`${path} should constrain long prose line lengths`);
    }
  }
}

async function assertQueuedDesignUpdates() {
  const overviewHtml = await fetchHtml("/");
  if (overviewHtml.includes("The road to") || overviewHtml.includes("Countdown to the Man Burn")) {
    throw new Error("Overview page should not render the hero section");
  }

  const overviewAreasSection = sectionBetween(overviewHtml, "areas", "meetings");
  const overviewAreaGrid = overviewAreasSection.match(/<div[^>]*data-overview-area-grid="true"[^>]*>/)?.[0];
  if (!overviewAreaGrid) {
    throw new Error("Overview Camp Areas section should render a full-width tile grid");
  }
  for (const cardChromeClass of ["bg-card", "rounded-xl", "overflow-hidden"]) {
    if (overviewAreaGrid.includes(cardChromeClass)) {
      throw new Error(`Overview Camp Areas grid should not have containing-card chrome: ${cardChromeClass}`);
    }
  }

  const overviewAreaCards = overviewAreasSection.match(/<a[^>]*data-overview-area-card="true"[^>]*>/g) ?? [];
  if (!overviewAreaCards.length) {
    throw new Error("Overview Area section should mark each tile for smoke coverage");
  }
  for (const tile of overviewAreaCards) {
    for (const className of ["rounded-xl", "border", "border-border", "bg-card", "p-5", "shadow-xs"]) {
      if (!tile.includes(className)) throw new Error(`Overview Area tiles should use agenda-card border/shadow styling: missing ${className}`);
    }
  }

  const areaDetailHtml = await fetchHtml("/areas/meetings-admin");
  if (!areaDetailHtml.includes('data-task-list-table="true"') || areaDetailHtml.includes('data-task-list-card="true"')) {
    throw new Error("Area detail task lists should render as table-style task lists, not cards");
  }

  const timelineHtml = await fetchHtml("/timeline");
  if (!timelineHtml.includes('data-gantt-overview-style="true"')) {
    throw new Error("Timeline Gantt view should use the overview timeline rail styling");
  }
  const ganttAxis = timelineHtml.match(/<div[^>]*data-gantt-date-axis="true"[\s\S]*?<\/div>\s*<div class="relative h-1\.5 rounded-full bg-border"/)?.[0] ?? "";
  if (!ganttAxis) {
    throw new Error("Timeline Gantt view should keep an accessible date-axis note above the x-axis rail");
  }
  if (!ganttAxis.includes("Timeline dates are shown in marker hover labels") || timelineHtml.includes('date-tick')) {
    throw new Error("Timeline Gantt date labels should be hidden from the axis and shown via marker hover labels");
  }
  for (const hoverLabel of ["Pre-build · Aug 25", "Build · Aug 28", "Burn starts · Aug 31", "Burn ends · Sep 06"]) {
    if (!timelineHtml.includes(hoverLabel)) {
      throw new Error(`Timeline marker hover labels should include event and date: ${hoverLabel}`);
    }
  }
  for (const duplicatePhase of ["Pre-build ends", "Build ends"]) {
    if (timelineHtml.includes(duplicatePhase)) {
      throw new Error(`Timeline should not render duplicate phase boundary milestone: ${duplicatePhase}`);
    }
  }
  if (!timelineHtml.includes('data-gantt-week-grid="true"') || !timelineHtml.includes('data-gantt-week-tick="true"')) {
    throw new Error("Timeline Gantt view should render weekly tick marks instead of phase-background spans");
  }
  if (timelineHtml.includes('data-gantt-phase-grid="true"') || timelineHtml.includes("bg-border/25")) {
    throw new Error("Timeline Gantt view should not render the old translucent phase-background spans");
  }
  if (!timelineHtml.includes("Burn week")) {
    throw new Error("Timeline Gantt treatment should still label Burn week");
  }
  const timelineCombinedSection = timelineHtml.match(/<section[^>]*data-timeline-upcoming-section="true"[\s\S]*?<\/section>\s*<section[^>]*data-timeline-past-section="true"/)?.[0] ?? "";
  if (!timelineCombinedSection) {
    throw new Error("Timeline page should combine the Gantt rail and upcoming milestones into one Upcoming section");
  }
  if (!timelineCombinedSection.includes('data-gantt-overview-style="true"') || !timelineCombinedSection.includes('data-timeline-upcoming-list="true"')) {
    throw new Error("Combined Upcoming section should contain both the Gantt timeline and upcoming milestone list");
  }
  const timelineMilestoneWithSources = timelineHtml.match(/<div[^>]*data-milestone-item="true"[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? "";
  if (!timelineMilestoneWithSources) {
    throw new Error("Timeline page should mark milestone/event item cards for source-link coverage");
  }
  if (timelineMilestoneWithSources.includes("<details") || timelineMilestoneWithSources.includes("rounded-lg border p-3")) {
    throw new Error("Milestone/event item sources should not render as prominent disclosure/card chrome");
  }
  if (!timelineMilestoneWithSources.includes('data-source-modal-trigger="true"')) {
    throw new Error("Milestone/event item sources should render as a metadata link that opens a source modal");
  }
  const milestoneTitleIndex = timelineMilestoneWithSources.indexOf("<h3");
  const milestoneMetadataIndex = timelineMilestoneWithSources.indexOf('data-milestone-metadata="true"');
  if (milestoneTitleIndex === -1 || milestoneMetadataIndex === -1 || milestoneMetadataIndex < milestoneTitleIndex) {
    throw new Error("Milestone/event metadata row should move below the title and description");
  }

  if (timelineHtml.includes("endpoint")) {
    throw new Error("The Man Burn card should not render the endpoint chip");
  }
  if (!timelineHtml.includes("Burn ends") || timelineHtml.includes("The Man burns")) {
    throw new Error("Synthetic burn-end milestone should be titled Burn ends");
  }

  const meetingsHtml = await fetchHtml("/meetings");
  if (!meetingsHtml.includes('data-next-leads-agenda-card="true"') || !meetingsHtml.includes("Proposed agenda for next Leads meeting")) {
    throw new Error("Meetings page should show the proposed agenda card before recorded meeting notes");
  }
  if (meetingsHtml.indexOf('data-next-leads-agenda-card="true"') > meetingsHtml.indexOf('data-meetings-list="full-width"')) {
    throw new Error("Next Leads agenda card should appear before the recorded meeting notes list");
  }
  if (!meetingsHtml.includes('data-meetings-list="full-width"') || meetingsHtml.includes("lg:grid-cols-2")) {
    throw new Error("Meetings page cards should render full width, not in two columns");
  }
  const meetingsStats = meetingsHtml.match(/<section[^>]*data-category-stats="true"[\s\S]*?<\/section>/)?.[0] ?? "";
  if (meetingsStats.includes("sections")) {
    throw new Error("Meetings page should remove the sections stat card");
  }
  if (!meetingsStats.includes("notes") || !meetingsStats.includes("attendees")) {
    throw new Error("Meetings page should keep notes and attendees stats after removing sections");
  }
  const meetingCardIndex = meetingsHtml.indexOf('data-meeting-card="true"');
  const meetingTitleIndex = meetingsHtml.indexOf('data-meeting-title="true"', meetingCardIndex);
  const meetingSummaryIndex = meetingsHtml.indexOf('data-meeting-summary-copy="true"', meetingCardIndex);
  const meetingMetadataIndex = meetingsHtml.indexOf('data-meeting-metadata="true"', meetingCardIndex);
  if (meetingCardIndex === -1 || meetingTitleIndex === -1 || meetingSummaryIndex === -1 || meetingMetadataIndex === -1) {
    throw new Error("Meeting cards should expose title, summary, and metadata row hooks for layout coverage");
  }
  if (meetingMetadataIndex < meetingSummaryIndex) {
    throw new Error("Meeting metadata row should move to the bottom of the card after the summary/details");
  }

  const updatesSection = overviewHtml.slice(overviewHtml.indexOf('id="updates"'));
  if (!updatesSection.includes('data-overview-update-feed="true"')) {
    throw new Error("Overview updates section should render a full-width, borderless latest-update feed");
  }
  if (!updatesSection.includes("max-w-[700px]")) {
    throw new Error("Overview latest update should be constrained to a 700px max width");
  }
  if (updatesSection.includes("max-w-3xl")) {
    throw new Error("Overview latest update should not use the old max-w-3xl constraint");
  }
  const overviewUpdateItems = updatesSection.match(/data-update-item="true"/g) ?? [];
  if (overviewUpdateItems.length !== 1) {
    throw new Error(`Overview updates section should show exactly one latest update, found ${overviewUpdateItems.length}`);
  }
  const updateFeedOpen = updatesSection.match(/<div[^>]*data-overview-update-feed="true"[^>]*>/)?.[0] ?? "";
  if (updateFeedOpen.includes("border") || updateFeedOpen.includes("bg-card") || updateFeedOpen.includes("rounded")) {
    throw new Error("Overview latest update feed should not have card border/background chrome");
  }
  const updatesPageHtml = await fetchHtml("/updates");
  const firstUpdateTitle = updatesPageHtml.match(/<h3[^>]*data-update-title="true"[^>]*>/)?.[0] ?? "";
  if (!firstUpdateTitle.includes("text-xl") || !firstUpdateTitle.includes("sm:text-2xl")) {
    throw new Error("Update item titles should use the larger card-name size treatment");
  }
  const updatesStats = updatesPageHtml.match(/<section[^>]*data-category-stats="true"[\s\S]*?<\/section>/)?.[0] ?? "";
  if (updatesStats.includes("first")) {
    throw new Error("Updates page should remove the New First stat card");
  }
  if (!updatesStats.includes("entries") || !updatesStats.includes("objects")) {
    throw new Error("Updates page should keep entries and objects stats after removing New First");
  }
  const updateItemWithSources = updatesPageHtml.match(/<(?:article|div)[^>]*data-update-item="true"[\s\S]*?(?=<\/main>)/)?.[0] ?? "";
  if (!updateItemWithSources) {
    throw new Error("Updates page should render update item cards for source-link coverage");
  }
  if (updateItemWithSources.includes("<details") || updateItemWithSources.includes("rounded-lg border p-3")) {
    throw new Error("Update item sources should not render as prominent disclosure/card chrome");
  }
  if (!updatesPageHtml.includes('data-update-metadata="true"') || !updatesPageHtml.includes('data-source-modal-trigger="true"')) {
    throw new Error("Update item sources should render as a metadata link that opens a source modal");
  }
  const updateTitleIndex = updatesPageHtml.indexOf("<h3");
  const updateMetadataIndex = updatesPageHtml.indexOf('data-update-metadata="true"');
  if (updateTitleIndex === -1 || updateMetadataIndex === -1 || updateMetadataIndex < updateTitleIndex) {
    throw new Error("Update item metadata row should move below the title, summary, and changed-object list");
  }
  for (const path of ["/", "/tasks", "/timeline", "/meetings", "/decisions", "/updates", "/meetings/2026-05-25-kumaya-committee"]) {
    const pageHtml = await fetchHtml(path);
    if (/>2026-\d{2}-\d{2}</.test(pageHtml) || />\d{4}-\d{2}-\d{2}</.test(pageHtml)) {
      throw new Error(`${path} should display dates as MMM DD instead of YYYY-MM-DD`);
    }
  }
  const formattedTasksHtml = await fetchHtml("/tasks");
  if (!formattedTasksHtml.includes("Jul 15") || formattedTasksHtml.includes(">2026-07-15<")) {
    throw new Error("Task due dates should render as MMM DD");
  }
  const formattedUpdatesHtml = await fetchHtml("/updates");
  if (!formattedUpdatesHtml.includes("May 28") || formattedUpdatesHtml.includes(">2026-05-28<")) {
    throw new Error("Update dates should render as MMM DD");
  }
  for (const path of ["/areas", "/meetings", "/updates"]) {
    const pageHtml = await fetchHtml(path);
    for (const removedCopy of ["Read-only source of truth", "Read-only changelog", "website exposes no editing controls", "site exposes no meeting editing controls"]) {
      if (pageHtml.includes(removedCopy)) {
        throw new Error(`${path} should not render the read-only source-of-truth card`);
      }
    }
  }
}

async function assertSmallHeadingsUseSansSerif() {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const serifRule = css.match(/h1,[\s\S]*?\.font-serif\s*\{[\s\S]*?font-family:\s*"Spectral"[\s\S]*?\}/)?.[0] ?? "";
  if (!serifRule) {
    throw new Error("Global heading CSS should keep an explicit serif rule for large headings and .font-serif");
  }
  if (/\bh3\b|\bh4\b|\bh5\b|\bh6\b/.test(serifRule)) {
    throw new Error("Smaller heading levels h3-h6 should inherit the sans-serif body face, not the Spectral serif rule");
  }
}

for (const check of checks) {
  const html = await fetchHtml(check.path);
  for (const text of check.required) {
    if (!html.includes(text)) {
      throw new Error(`Smoke test did not find required text on ${urlFor(check.path)}: ${text}`);
    }
  }
}

await assertSmallHeadingsUseSansSerif();
await assertTaskSortIcons();
await assertSiteHeaderBreakpoint();
await assertAreaNaming();
await assertCategoryPagesUseStatsInsteadOfHero();
await assertDetailPagesUseStatsInsteadOfHero();
await assertOverviewLatestMeetingCard();
await assertOverviewSectionHeaders();
await assertCritiqueFixes();
await assertDecisionMetadataLayout();
await assertAreasPageGrid();
await assertQueuedDesignUpdates();

console.log(`Smoke test passed for ${base}`);
