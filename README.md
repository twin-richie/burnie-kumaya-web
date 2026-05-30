# Burnie / Kumaya Planning Hub

Internal-use planning surface for the Kumaya Burning Man camp.

Burnie, an AI agent, maintains structured planning data. The site renders an attention-first dashboard for tasks, areas, meetings, decisions, timeline milestones, and changelog updates.

Current status: v1 local production app. The old throwaway prototype has been retired to `archive/server.prototype.js`; the active service is the built Next.js app served on port 8080.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- File-backed YAML datastore
- Zod validation
- Local long-running service behind a public Cloudflare tunnel

## Non-goals

- No authentication in v1
- No in-browser editing UI
- No database in v1
- No external deployment platform requirement
- No generic project-management clone

## Common commands

```bash
npm run check          # validate data, run helper tests, build, and smoke-test production start
npm run build          # build the Next.js app
npm run start          # serve the built app locally on port 8080
npm run service:install
npm run service:restart
npm run service:uninstall
```

The intended local service URL is:

```text
http://127.0.0.1:8080
```

The current verified public tunnel URL is:

```text
https://ringtone-relate-second-ctrl.trycloudflare.com
```

## Operations

See `docs/OPERATIONS.md` for the launchd setup, update/restart workflow, tunnel verification, and Burnie YAML update process.

## Key documents

- `BUILD_SPEC.md` — product and implementation spec
- `docs/OPERATIONS.md` — local service and tunnel operating guide
- `archive/server.prototype.js` — obsolete pre-Next.js prototype kept only for reference
