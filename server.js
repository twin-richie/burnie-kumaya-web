const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('/Users/twin/Context/burnie');
const PORT = process.env.PORT || 8080;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mdToSimpleHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inList = false;
  let inCode = false;

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/g, '');
    if (line.startsWith('```')) {
      closeList();
      if (!inCode) {
        out.push('<pre><code>');
        inCode = true;
      } else {
        out.push('</code></pre>');
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      out.push(escapeHtml(line));
      continue;
    }

    if (!line.trim()) {
      closeList();
      out.push('<div class="spacer"></div>');
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${escapeHtml(bullet[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${escapeHtml(line)}</p>`);
  }

  closeList();
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function listMeetingFiles() {
  const dir = path.join(ROOT, 'kumaya', 'meetings');
  return fs.readdirSync(dir)
    .filter(name => name.endsWith('.md'))
    .sort()
    .map(name => path.join(dir, name));
}

function buildPage() {
  const openItemsPath = path.join(ROOT, 'kumaya', 'open-action-items.md');
  const decisionsPath = path.join(ROOT, 'decisions.md');
  const overviewPath = path.join(ROOT, 'kumaya', 'overview.md');

  const openItems = fs.existsSync(openItemsPath) ? readText(openItemsPath) : '# Open Action Items\n\nNo open action items found.';
  const decisions = fs.existsSync(decisionsPath) ? readText(decisionsPath) : '# Decisions\n\nNo decisions found.';
  const overview = fs.existsSync(overviewPath) ? readText(overviewPath) : '# Overview\n\nNo overview found.';

  const meetings = listMeetingFiles().map(filePath => {
    const md = readText(filePath);
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const firstLine = md.split(/\r?\n/).find(Boolean) || rel;
    return {
      name: path.basename(filePath),
      rel,
      firstLine,
      html: mdToSimpleHtml(md),
    };
  });

  const meetingNav = meetings.map(m => `<li><a href="#${escapeHtml(m.name)}">${escapeHtml(m.name)}</a><div class="muted">${escapeHtml(m.rel)}</div></li>`).join('\n');
  const meetingSections = meetings.map(m => `
    <section class="card" id="${escapeHtml(m.name)}">
      <div class="card-header">
        <h2>${escapeHtml(m.name)}</h2>
        <a href="#top">Back to top</a>
      </div>
      <div class="content">${m.html}</div>
    </section>
  `).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Burnie / Kumaya Planning Hub</title>
  <style>
    :root {
      --bg: #0b1020;
      --panel: #121a33;
      --panel-2: #0f1730;
      --text: #e9eefc;
      --muted: #9aa7c7;
      --accent: #7dd3fc;
      --border: #253257;
      --chip: #172342;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: linear-gradient(180deg, var(--bg), #050814 100%);
      color: var(--text);
      line-height: 1.5;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    header {
      padding: 32px 24px 20px;
      border-bottom: 1px solid var(--border);
      background: rgba(18,26,51,0.7);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .wrap { max-width: 1180px; margin: 0 auto; padding: 0 24px 48px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin: 0 0 12px; font-size: 22px; }
    h3 { margin: 18px 0 8px; font-size: 18px; }
    .subtitle { color: var(--muted); max-width: 900px; }
    .grid { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
    .card {
      background: rgba(18,26,51,0.86);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.22);
      margin-bottom: 18px;
    }
    .stack > .card { margin-bottom: 18px; }
    .card-header { display: flex; justify-content: space-between; gap: 16px; align-items: baseline; }
    .muted { color: var(--muted); font-size: 13px; }
    .chip { display: inline-block; padding: 4px 10px; border-radius: 999px; background: var(--chip); border: 1px solid var(--border); color: var(--muted); font-size: 12px; margin-right: 8px; }
    ul { margin: 0.4rem 0 0.4rem 1.15rem; }
    li { margin: 0.25rem 0; }
    p { margin: 0.45rem 0; }
    pre {
      white-space: pre-wrap;
      background: var(--panel-2);
      padding: 14px;
      border-radius: 12px;
      overflow: auto;
      border: 1px solid var(--border);
    }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .toc ul { list-style: none; padding-left: 0; }
    .toc li { margin: 0.4rem 0; padding: 0.5rem 0.65rem; background: rgba(15,23,48,0.7); border: 1px solid var(--border); border-radius: 12px; }
    .section-title { margin-top: 24px; }
    .spacer { height: 8px; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } header { position: static; } }
  </style>
</head>
<body>
  <header id="top">
    <div class="wrap">
      <h1>Burnie / Kumaya Planning Hub</h1>
      <div class="subtitle">Public-facing snapshot of current open items, decisions, and meeting summaries for the Kumaya Burning Man camp. This page reads from Burnie’s context files on disk, so it stays current as the notes are updated.</div>
    </div>
  </header>
  <main class="wrap">
    <div class="grid">
      <aside class="stack">
        <section class="card toc">
          <h2>Jump to</h2>
          <ul>
            <li><a href="#open-items">Open action items</a></li>
            <li><a href="#decisions">Decisions</a></li>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#meeting-summaries">Meeting summaries</a></li>
          </ul>
        </section>
        <section class="card toc">
          <h2>Meeting summaries</h2>
          <ul>
            ${meetingNav}
          </ul>
        </section>
      </aside>
      <section>
        <section class="card" id="open-items">
          <div class="card-header">
            <h2>Open action items</h2>
            <span class="chip">Current</span>
          </div>
          <div class="content">${mdToSimpleHtml(openItems)}</div>
        </section>
        <section class="card" id="decisions">
          <div class="card-header">
            <h2>Decisions</h2>
            <span class="chip">Durable log</span>
          </div>
          <div class="content">${mdToSimpleHtml(decisions)}</div>
        </section>
        <section class="card" id="overview">
          <div class="card-header">
            <h2>Overview</h2>
            <span class="chip">Camp context</span>
          </div>
          <div class="content">${mdToSimpleHtml(overview)}</div>
        </section>
      </section>
    </div>

    <section id="meeting-summaries">
      <h2 class="section-title">Meeting summaries</h2>
      ${meetingSections}
    </section>
  </main>
</body>
</html>`;
}

function send(res, status, headers, body) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ok');
      return;
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      send(res, 200, {}, buildPage());
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Server error: ${err.message}`);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Burnie site listening on http://127.0.0.1:${PORT}`);
});
