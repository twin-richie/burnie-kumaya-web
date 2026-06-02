# Burnie / Kumaya web operations

This repo is intended to run as an always-live service on Richie/Twin's Mac. The site reads the current source files from disk at request time; GitHub Pages/static export is not the canonical runtime.

## Runtime decision

- App root: `/Users/twin/Context/burnie/web`
- Local port: `8080`
- Local URL: `http://127.0.0.1:8080`
- Production start command: `npm run start`
- Process manager: macOS launchd user agent `com.burnie.kumaya.web`
- Canonical live URL on this Mac: `http://127.0.0.1:8080`
- Stable public URL: `https://kumaya.richie.co`
- Public access: Cloudflare named tunnel `kumaya-planning-site` to `http://127.0.0.1:8080`
- Tunnel process manager: macOS launchd user agent `com.burnie.kumaya.tunnel`

The Mac-hosted launchd service is the live site. GitHub Pages is not the canonical deployment target.

## Active app vs retired prototype

The active app is the Next.js build in this directory. The old one-file Node prototype is retired and archived at:

```text
archive/server.prototype.js
```

Do not run the archived prototype for the public tunnel. It is retained only as historical reference.

## One-time launchd install

From `/Users/twin/Context/burnie/web`:

```bash
npm install
npm run check
npm run service:install
```

This copies `ops/launchd/com.burnie.kumaya.web.plist` to:

```text
~/Library/LaunchAgents/com.burnie.kumaya.web.plist
```

and starts the user service.

## Day-to-day update/restart workflow

When Burnie updates YAML or code, the safe one-command workflow is:

```bash
cd /Users/twin/Context/burnie/web
npm run service:restart
```

`npm run service:restart` runs `npm run check` first, then restarts the launchd service with `launchctl kickstart -k`. If you only want to validate without restarting, run `npm run check`.

Pages are configured as dynamic, so YAML-only changes are read from disk on each request. Restart anyway after Burnie edits files so validation/build failures are caught before the live service is considered updated.

If launchd is not installed yet, use:

```bash
npm run service:install
```

For a manual foreground production run without launchd:

```bash
npm run build
npm run start
```

## YAML data update workflow

1. Edit files under `data/`.
2. Run `npm run validate:data` for a fast schema check.
3. Run `npm run check` before publishing/restarting.
4. Commit data changes to git so history records what Burnie changed.
5. Run `npm run service:restart` to validate/build and refresh the launchd process.
6. Verify local routes and, if a tunnel is active, the public tunnel URL.

Useful checks:

```bash
curl -I http://127.0.0.1:8080
curl -I https://kumaya.richie.co
```

## Verifying the service

Local route smoke checks:

```bash
for path in / /tasks /areas /meetings /decisions /timeline /updates; do
  curl -fsS "http://127.0.0.1:8080$path" >/dev/null && echo "ok $path"
done
```

Public tunnel smoke checks:

```bash
SMOKE_URL="https://kumaya.richie.co" npm run smoke

for path in / /tasks /areas /meetings /decisions /timeline /updates; do
  curl -L -fsS "https://kumaya.richie.co$path" >/dev/null && echo "ok $path"
done
```

## launchd commands

```bash
launchctl print gui/$(id -u)/com.burnie.kumaya.web
launchctl kickstart -k gui/$(id -u)/com.burnie.kumaya.web
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.burnie.kumaya.web.plist
```

Logs are written to:

```text
logs/launchd.out.log
logs/launchd.err.log
```

## Tunnel notes

The stable public URL is backed by Cloudflare named tunnel `kumaya-planning-site`. Config and credentials live under the Burnie profile home:

```text
/Users/twin/.hermes/profiles/burnie/home/.cloudflared/config.yml
/Users/twin/.hermes/profiles/burnie/home/.cloudflared/cbc65c94-8aa8-4447-9f80-268ecca8ab53.json
```

The launchd plist lives at:

```text
/Users/twin/Library/LaunchAgents/com.burnie.kumaya.tunnel.plist
```

Useful tunnel commands:

```bash
launchctl print gui/$(id -u)/com.burnie.kumaya.tunnel
launchctl kickstart -k gui/$(id -u)/com.burnie.kumaya.tunnel
cloudflared tunnel info kumaya-planning-site
SMOKE_URL=https://kumaya.richie.co npm run smoke
```

Cloudflare quick tunnels are no longer the camp-facing URL. If a one-off preview is needed, the command targets port 8080:

```bash
cloudflared tunnel --url http://127.0.0.1:8080 --no-autoupdate
```

Quick tunnel URLs can change if `cloudflared` restarts; use `https://kumaya.richie.co` for camp-facing links.
