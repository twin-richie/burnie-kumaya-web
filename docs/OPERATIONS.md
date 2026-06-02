# Burnie / Kumaya web operations

This repo is intended to deploy as a static GitHub Pages site. A local production-built Next.js service on Richie/Twin's Mac can still be used for fast local preview.

## Runtime decision

- App root: `/Users/twin/Context/burnie/web`
- Local port: `8080`
- Local URL: `http://127.0.0.1:8080`
- Production start command: `npm run start`
- Process manager: macOS launchd user agent `com.burnie.kumaya.web`
- Canonical live URL: `https://twin-richie.github.io/burnie-kumaya-web/`
- Optional local preview URL: `http://127.0.0.1:8080`

GitHub Pages is the live site. Port 8080 is only for local preview.

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
5. Restart the local service with `npm run service:restart`.
6. Verify local and public routes.

Useful checks:

```bash
curl -I http://127.0.0.1:8080
curl -I https://twin-richie.github.io/burnie-kumaya-web/
```

## Verifying the service

Local route smoke checks:

```bash
for path in / /tasks /areas /meetings /decisions /timeline /updates; do
  curl -fsS "http://127.0.0.1:8080$path" >/dev/null && echo "ok $path"
done
```

GitHub Pages smoke checks:

```bash
for path in / /tasks /areas /meetings /decisions /timeline /updates; do
  curl -L -fsS "https://twin-richie.github.io/burnie-kumaya-web$path" >/dev/null && echo "ok $path"
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

Cloudflare quick tunnels are optional previews only, not the canonical live site. If needed, the command targets port 8080:

```bash
cloudflared tunnel --url http://127.0.0.1:8080 --no-autoupdate
```

The tunnel is separate from both GitHub Pages and the local Next.js app service. Prefer GitHub Pages for camp-facing links.
