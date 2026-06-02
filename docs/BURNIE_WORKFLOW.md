# Burnie content workflow

This document is the operating contract for Burnie or a future agent maintaining the Kumaya planning hub.

## What Burnie owns

Burnie maintains the structured source files under `data/`:

- `data/areas.yaml`
- `data/people.yaml`
- `data/tasks.yaml`
- `data/decisions.yaml`
- `data/milestones.yaml`
- `data/updates.yaml`
- `data/meetings/*.yaml`

The website is read-only. Humans should not edit planning content in the browser because v1 intentionally has no in-browser editing UI.

## Safe YAML update workflow

From `/Users/twin/Context/burnie/web`:

```bash
# 1. Edit YAML files under data/

# 2. Fast schema validation
npm run validate:data

# 3. Full verification before publishing
npm run check

# 4. Commit the changed source files
# Use a concise conventional commit message, for example:
git add data
# git commit -m "data: update Kumaya planning state"

# 5. Restart the local production service after checks pass
npm run service:restart

# 6. Verify local routes
npm run smoke

# 7. Verify public routes after GitHub Pages deploys
SMOKE_URL=https://twin-richie.github.io/burnie-kumaya-web npm run smoke
```

`npm run service:restart` runs `npm run check` before restarting launchd. If it fails, fix validation/build/test failures before restarting.

## Required commands

```bash
npm run dev            # local development server on port 8080
npm run validate:data  # YAML schema validation only
npm run build          # Next.js production build
npm run check          # validation, helper tests, build, production smoke
npm run start          # foreground production server on port 8080
npm run service:start  # launchd-compatible production start wrapper
npm run service:install
npm run service:restart
npm run service:uninstall
npm run smoke          # smoke all major routes on http://127.0.0.1:8080 by default
```

## Provenance convention

Every planning record must include at least one `provenance` entry. Provenance explains why the record exists and where the fact came from.

Allowed `source_type` values are:

- `meeting` — source came from a meeting note or transcript
- `doc` — source came from a document or markdown context file
- `user_instruction` — user explicitly instructed Burnie to record it
- `burnie_inference` — Burnie inferred it from context; use this sparingly
- `manual_seed` — initial/manual data migration or maintenance operation

Good provenance includes:

- `source_ref`: stable file path, document name, issue ID, or URL
- `source_date`: source date when known
- `quote`: short supporting quote when useful

Do not add unsupported facts without provenance. If the source is weak, set confidence lower and mark the task for review when appropriate.

## Confidence convention

Each record has `confidence`:

- `high` — explicitly supported by a source or direct user instruction
- `medium` — likely correct but depends on interpretation or partial source support
- `low` — uncertain, incomplete, or needs human confirmation

Prefer lower confidence over pretending certainty. Low-confidence records should usually appear in updates or tasks with clear review notes.

## Needs-review convention for tasks

Task records include `needs_review` and may include `review_note`.

Set `needs_review: true` when:

- owner is inferred rather than explicitly assigned
- due date is inferred or uncertain
- scope is ambiguous
- the task came from messy notes and may be duplicated
- Burnie cannot verify whether the task is still current

Set `needs_review: false` only when the record is clear enough to act on. If a task needs review, add a concise `review_note` explaining what a human should confirm.

## Changelog convention

When Burnie makes meaningful data changes, add an entry to `data/updates.yaml` with:

- title
- date
- summary
- changed object references with type, id, and change
- source
- confidence
- provenance

The updates page should answer: “what changed recently?”

## Local and public verification

Local URL:

```text
http://127.0.0.1:8080
```

Canonical live GitHub Pages URL:

```text
https://twin-richie.github.io/burnie-kumaya-web/
```

Verify all major routes locally:

```bash
for path in / /tasks /areas /meetings /decisions /timeline /updates; do
  curl -fsS "http://127.0.0.1:8080$path" >/dev/null && echo "ok local $path"
done
```

Verify all major routes publicly:

```bash
for path in / /tasks /areas /meetings /decisions /timeline /updates; do
  curl -L -fsS "https://twin-richie.github.io/burnie-kumaya-web$path" >/dev/null && echo "ok public $path"
done
```

## v1 non-goals

- No authentication
- No database
- No in-browser editing UI
- No generic project-management clone
- No external deployment platform requirement

## V1 completion checklist

Before declaring v1 complete:

- [ ] `npm run validate:data` passes.
- [ ] `npm run build` passes.
- [ ] `npm run check` passes.
- [ ] `http://127.0.0.1:8080` loads locally.
- [ ] Canonical GitHub Pages URL loads the app.
- [ ] Homepage shows the attention dashboard.
- [ ] `/tasks`, `/areas`, `/meetings`, `/decisions`, `/timeline`, and `/updates` work.
- [ ] All seeded tasks have area, status, priority, confidence, and provenance.
- [ ] No in-browser editing UI exists.
- [ ] No database dependency exists.
- [ ] Existing useful content has been migrated into YAML.
