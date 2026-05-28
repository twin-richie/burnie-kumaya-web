# Burnie / Kumaya Planning Hub Build Spec

> For Hermes/Burnie: this is the product and implementation spec for replacing the current single-file local website with a typed, file-backed, shadcn UI planning hub.

Status: draft approved from user interview
Date: 2026-05-28
Current site entrypoint: /Users/twin/Context/burnie/web/server.js
Target app root: /Users/twin/Context/burnie/web

## 1. Goal

Build an internal-use planning surface for the Kumaya Burning Man camp. Burnie, an AI agent, will maintain the underlying structured data and the UI will render the current plan, attention areas, meeting history, decisions, timeline, and changelog.

The site is public via a local-machine public URL/tunnel, but it is not a public marketing site. It does not need authentication or human content-editing UI.

## 2. Product Principles

- AI-maintained, human-readable: Burnie edits canonical data files; humans read the rendered dashboard.
- Source of truth over generic PM app: this is not Trello, Notion, Linear, or a database-backed workflow app.
- Attention-first: the homepage should show what needs attention now.
- Provenance-first: uncertain AI-maintained facts must identify where they came from and how confident Burnie is.
- Git/file-friendly: data changes should be easy to review, diff, revert, and validate.
- YAGNI: do not build auth, in-browser editing, comments, drag/drop, notifications, or a remote datastore in v1.

## 3. Non-goals

Do not build:

- User login or permissions.
- Browser-based admin/editor UI.
- A generic task management application.
- Kanban drag/drop.
- Comments or discussion threads.
- External SaaS deployment.
- Postgres/Supabase/Firebase database.
- Camper-facing public marketing website.
- Payment collection or budget accounting workflows in v1.

## 4. Target Stack

Use:

- Framework: Next.js App Router
- Language: TypeScript
- UI: shadcn/ui
- Styling: Tailwind CSS
- Data source: YAML files under data/
- Validation: Zod schemas
- YAML parser: yaml
- Icons: lucide-react
- Optional table library: TanStack Table, only if simple custom filtering becomes painful
- Optional charts: Recharts, only after core views exist

Runtime:

- Long-running local Next.js service on this Mac.
- Public URL via existing tunnel / local public URL mechanism.
- Burnie edits repo files directly, runs validation/build, and restarts/reloads service when needed.

## 5. Recommended Repository Shape

Replace the current single-file server with a proper Next.js app rooted at:

/Users/twin/Context/burnie/web

Recommended structure:

```text
web/
  app/
    layout.tsx
    page.tsx
    tasks/page.tsx
    areas/page.tsx
    areas/[slug]/page.tsx
    meetings/page.tsx
    meetings/[slug]/page.tsx
    decisions/page.tsx
    timeline/page.tsx
    updates/page.tsx
  components/
    app-shell.tsx
    area-card.tsx
    confidence-badge.tsx
    decision-list.tsx
    meeting-card.tsx
    provenance-note.tsx
    status-badge.tsx
    task-list.tsx
    timeline-list.tsx
    update-feed.tsx
  components/ui/
    ...shadcn generated components...
  data/
    areas.yaml
    people.yaml
    tasks.yaml
    decisions.yaml
    milestones.yaml
    updates.yaml
    meetings/
      2026-05-25-kumaya-committee.yaml
  lib/
    data.ts
    derived.ts
    dates.ts
    types.ts
    schemas.ts
  scripts/
    validate-data.ts
  package.json
  tailwind.config.ts
  tsconfig.json
  next.config.ts
  postcss.config.mjs
```

Keep existing markdown context files in /Users/twin/Context/burnie/kumaya as source/reference material. The new web/data YAML files become the canonical rendered site data.

## 6. Data Model

All records that Burnie can infer or update should support provenance and confidence.

### Shared enums

```ts
type Confidence = "high" | "medium" | "low";

type Provenance = {
  source_type: "meeting" | "doc" | "user_instruction" | "burnie_inference" | "manual_seed";
  source_ref: string;
  source_date?: string;
  quote?: string;
};
```

### Area

File: data/areas.yaml

Fields:

- slug: stable kebab-case id
- name: display name
- description: short description
- lead: person id optional
- icon: lucide icon name optional
- color: semantic color optional
- confidence: high | medium | low
- provenance: Provenance[]

Initial areas:

- power
- kitchen-food
- water
- fuel
- finance
- campers
- build-shade
- interactivity
- transport-reno
- meetings-admin

### Person

File: data/people.yaml

Fields:

- id: stable kebab-case id
- name: display name
- role: optional
- areas: area slugs[]
- notes: optional
- confidence: high | medium | low
- provenance: Provenance[]

Known seed examples:

- richie: power
- anton: interactivity/events, freezer alerts
- cynthia: kitchen/food
- helena: interviews, committee lead
- martin: water/gasoline, payment collection/interview support
- allan: payment collection details, committee lead

### Task

File: data/tasks.yaml

Fields:

- id: stable id, e.g. task-generator-recommendations
- title
- status: open | in_progress | blocked | done | parked
- priority: urgent | high | normal | low
- area: area slug
- owner: person id optional
- due_date: ISO date optional
- next_action: optional
- notes: optional
- needs_review: boolean
- review_note: optional
- confidence: high | medium | low
- provenance: Provenance[]
- created_at: ISO date
- updated_at: ISO date

Task rules:

- Burnie may normalize, dedupe, and split tasks.
- Burnie must not invent owners or due dates without either evidence or needs_review: true.
- Marking done requires explicit instruction or clear source evidence.

### Meeting

Files: data/meetings/*.yaml

Fields:

- slug
- date
- title
- attendees: person ids or plain names
- summary: paragraph/list
- sections: array of { heading, body }
- action_items: task ids or inline extracted items
- decisions: decision ids
- source_refs: references to transcript/doc/source file
- confidence: high | medium | low
- provenance: Provenance[]

Meeting rules:

- Meetings are historical records. Do not rewrite substantially after creation except typo/source fixes.
- If a later interpretation changes a meeting-derived task, update the task, not the meeting record.

### Decision

File: data/decisions.yaml

Fields:

- id
- date
- title
- decision
- area: area slug optional
- rationale: optional
- supersedes: decision id optional
- superseded_by: decision id optional
- confidence: high | medium | low
- provenance: Provenance[]

Decision rules:

- Treat as append-oriented.
- If a decision changes, add a new decision and link it via supersedes/superseded_by.
- Do not silently delete historical decisions.

### Milestone

File: data/milestones.yaml

Fields:

- id
- date
- title
- type: deadline | event | build | logistics | payment | meeting
- area: area slug optional
- description: optional
- confidence: high | medium | low
- provenance: Provenance[]

### Update / Changelog Entry

File: data/updates.yaml

Fields:

- id
- date
- title
- summary
- changed_objects: array of { type, id, change }
- source: short text/source ref
- confidence: high | medium | low
- provenance: Provenance[]

Update rules:

- Burnie appends an update when ingesting a meeting/doc or performing meaningful cleanup.
- This is the human-friendly answer to “what changed recently?”

## 7. Routes and UX

### /

Attention dashboard.

Top:

- Header: Burnie / Kumaya Planning Hub
- Camp season/status subheading
- Stat cards:
  - Open tasks
  - Blocked tasks
  - Overdue/due-soon tasks
  - Needs-review items
  - Upcoming milestones

Primary panels:

- Needs Attention
  - overdue tasks
  - blocked tasks
  - unowned high-priority tasks
  - due soon
  - low-confidence/needs-review records
- Upcoming Timeline
- Recent Decisions
- Latest Meeting Summary
- Recent Updates

Below:

- Area cards for each camp area with owner, open/high/blocked counts, next milestone, latest update.

### /tasks

Task list with filters:

- status
- priority
- area
- owner
- due soon/overdue
- needs_review
- confidence

No editing controls.

### /areas

Grid of area cards with counts and owners.

### /areas/[slug]

Area detail page:

- owner/lead
- description
- open tasks
- blocked tasks
- milestones
- decisions
- related meetings
- updates

### /meetings

Meeting index sorted newest first.

### /meetings/[slug]

Meeting detail:

- title/date/attendees
- summary
- sections
- extracted action items
- decisions
- provenance/source refs

### /decisions

Decision log sorted newest first. Show superseded state clearly.

### /timeline

Milestones grouped by upcoming/past and type.

### /updates

Changelog feed sorted newest first.

## 8. Visual Direction

Style: dark-mode desert ops dashboard.

Use:

- shadcn card/table/badge/tabs/separator components
- dark background, high contrast text
- warm accents: amber, sand, rust, muted red
- operational, calm, readable UI
- lucide icons for areas/statuses
- badges for status, priority, confidence, needs_review

Avoid:

- Burning Man cliché graphics
- busy playa backgrounds
- novelty fonts
- public marketing website feel
- generic kanban clone look

## 9. Validation and Data Safety

Required scripts:

```json
{
  "scripts": {
    "dev": "next dev -p 8080",
    "build": "next build",
    "start": "next start -p 8080",
    "validate:data": "tsx scripts/validate-data.ts",
    "check": "npm run validate:data && npm run build"
  }
}
```

Validation requirements:

- Every YAML file must parse.
- Every record must pass its Zod schema.
- IDs must be unique within each type.
- References must resolve:
  - task.area -> areas.slug
  - task.owner -> people.id when present
  - decision.area -> areas.slug when present
  - meeting.decisions -> decisions.id
  - area.lead -> people.id when present
- Date strings must be valid ISO dates.
- confidence must be present on AI-maintained objects.
- provenance must be non-empty for tasks, decisions, meetings, milestones, and updates.

Build should fail if validation fails.

## 10. Burnie Content Management Contract

Burnie may:

- Add tasks from meetings, docs, and user instructions.
- Merge duplicate tasks.
- Split vague tasks into concrete next actions.
- Assign likely area/category from context.
- Keep wording concise and operational.
- Add source references.
- Mark uncertainty with confidence and needs_review.
- Append changelog entries for meaningful changes.

Burnie must not silently:

- Invent owners.
- Invent due dates.
- Mark tasks complete without explicit instruction or source evidence.
- Treat speculative discussion as a decision.
- Delete historical decisions.
- Rewrite meeting notes in a way that loses nuance.

For uncertain information, Burnie should use:

```yaml
confidence: low
needs_review: true
review_note: "Owner inferred from discussion, not explicitly assigned."
```

## 11. Implementation Phases

### Phase 1: Scaffold Next.js + shadcn

Objective: Replace the single-file Node renderer with a real app skeleton.

Tasks:

1. Back up or keep current server.js for reference.
2. Initialize Next.js TypeScript app in /Users/twin/Context/burnie/web.
3. Add Tailwind and shadcn/ui.
4. Add baseline app shell/layout and dark theme.
5. Verify `npm run dev` serves on port 8080.

Acceptance:

- Browser loads a Next.js page at http://127.0.0.1:8080.
- Page uses dark shadcn styling.

### Phase 2: Add schemas, loader, and validation

Objective: Make YAML data the canonical source.

Tasks:

1. Install yaml, zod, tsx.
2. Create lib/schemas.ts.
3. Create lib/data.ts to read and validate YAML.
4. Create scripts/validate-data.ts.
5. Add npm scripts.
6. Seed minimal YAML data from existing markdown context.
7. Run `npm run validate:data`.

Acceptance:

- Invalid YAML or bad references fail validation.
- Valid seed data passes validation.

### Phase 3: Build dashboard and shared components

Objective: Homepage answers “what needs attention now?”

Tasks:

1. Add derived helpers for task counts, due soon, blocked, needs review.
2. Build status/priority/confidence badges.
3. Build task list component.
4. Build area card component.
5. Build timeline list component.
6. Build update feed component.
7. Compose app/page.tsx dashboard.

Acceptance:

- Dashboard shows current tasks, area cards, recent decisions, timeline, and updates.
- Needs-review and low-confidence records are visible.

### Phase 4: Build detail routes

Objective: Make the source of truth browseable.

Tasks:

1. Implement /tasks with filters.
2. Implement /areas and /areas/[slug].
3. Implement /meetings and /meetings/[slug].
4. Implement /decisions.
5. Implement /timeline.
6. Implement /updates.

Acceptance:

- Every seeded object is reachable through at least one route.
- Broken slugs return notFound().

### Phase 5: Local service and tunnel hardening

Objective: Keep the local site running reliably.

Tasks:

1. Confirm desired port, probably 8080 to preserve current tunnel.
2. Add production start command.
3. Create a launchd plist or other chosen process manager config.
4. Document restart/update workflow.
5. Verify public URL reaches the new app through the existing tunnel.

Acceptance:

- App survives normal terminal closure.
- Public URL reaches the local app.
- Burnie can update YAML, run checks, and restart service.

## 12. Initial Seed Data Sources

Use these existing files as inputs for the first YAML seed pass:

- /Users/twin/Context/burnie/kumaya/open-action-items.md
- /Users/twin/Context/burnie/decisions.md
- /Users/twin/Context/burnie/kumaya/overview.md
- /Users/twin/Context/burnie/kumaya/people.md
- /Users/twin/Context/burnie/kumaya/meetings/2026-05-25-kumaya-committee.md
- /Users/twin/Context/burnie/kumaya/research/2025-docs-action-review.md
- /Users/twin/Context/burnie/kumaya/research/2025-drive-docs-extract.json

## 13. Verification Checklist

Before declaring v1 done:

- `npm run validate:data` passes.
- `npm run build` passes.
- `npm run check` passes.
- http://127.0.0.1:8080 loads locally.
- Current public tunnel URL loads the app.
- Homepage shows attention dashboard.
- Tasks, areas, meetings, decisions, timeline, and updates routes work.
- All seeded tasks have area, status, priority, confidence, provenance.
- No in-browser editing UI exists.
- No database dependency exists.
- Existing useful content has been migrated into YAML.

## 14. Open Questions Before Implementation

These do not block scaffolding, but should be resolved before polishing v1:

1. What is the stable public URL/tunnel command/service currently in use?
2. Should git commits be mandatory for every Burnie data update, or only recommended?
3. What date should be treated as the primary season milestone for the dashboard countdown?
4. Should budget/inventory/camper roster remain deferred after v1, or become Phase 6?
5. Should meeting source files remain markdown references, or should all future meeting summaries be YAML-only?
