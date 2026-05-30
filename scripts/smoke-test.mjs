const base = process.env.SMOKE_URL ?? "http://127.0.0.1:8080";

const checks = [
  { path: "/", required: ["Kumaya attention dashboard", "read-only", "YAML-backed", "Needs attention"] },
  { path: "/tasks", required: ["Tasks"] },
  { path: "/areas", required: ["Camp areas"] },
  { path: "/meetings", required: ["Meetings"] },
  { path: "/decisions", required: ["Decisions"] },
  { path: "/timeline", required: ["Timeline"] },
  { path: "/updates", required: ["Updates"] },
];

function urlFor(path) {
  return new URL(path, base).toString();
}

for (const check of checks) {
  const target = urlFor(check.path);
  const response = await fetch(target);
  if (!response.ok) {
    throw new Error(`Expected ${target} to return 2xx, got ${response.status}`);
  }

  const html = await response.text();
  for (const text of check.required) {
    if (!html.includes(text)) {
      throw new Error(`Smoke test did not find required text on ${target}: ${text}`);
    }
  }
}

console.log(`Smoke test passed for ${base}`);
