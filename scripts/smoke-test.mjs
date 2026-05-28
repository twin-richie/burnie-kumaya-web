const target = process.env.SMOKE_URL ?? "http://127.0.0.1:8080";

const response = await fetch(target);
if (!response.ok) {
  throw new Error(`Expected ${target} to return 2xx, got ${response.status}`);
}

const html = await response.text();
const required = [
  "Kumaya attention dashboard",
  "read-only",
  "YAML-backed",
  "Needs attention",
];

for (const text of required) {
  if (!html.includes(text)) {
    throw new Error(`Smoke test did not find required text: ${text}`);
  }
}

console.log(`Smoke test passed for ${target}`);
