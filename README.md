# Burnie / Kumaya Planning Hub

Internal-use planning surface for the Kumaya Burning Man camp.

Burnie, an AI agent, maintains structured planning data. The site renders an attention-first dashboard for tasks, areas, meetings, decisions, timeline milestones, and changelog updates.

Current status: planning/spec phase. The existing local prototype is `server.js`; the replacement build spec is `BUILD_SPEC.md`.

## Direction

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- File-backed YAML datastore
- Zod validation
- Local long-running service behind a public tunnel

## Non-goals

- No authentication in v1
- No in-browser editing UI
- No database in v1
- No external deployment platform requirement
- No generic project-management clone

## Key documents

- `BUILD_SPEC.md` — product and implementation spec
- `server.js` — current throwaway local prototype, kept for reference until replaced
