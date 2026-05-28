import { spawn } from "node:child_process";
import net from "node:net";

async function getOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : undefined;
      server.close(() => {
        if (!port) reject(new Error("Could not allocate an open port"));
        else resolve(port);
      });
    });
  });
}

async function waitForReady(url, timeoutMs = 30_000) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? "unknown error"}`);
}

const port = await getOpenPort();
const url = `http://127.0.0.1:${port}`;
const child = spawn("npx", ["next", "start", "-p", String(port)], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: String(port) },
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

try {
  await waitForReady(url);
  const smoke = spawn(process.execPath, ["scripts/smoke-test.mjs"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, SMOKE_URL: url },
  });

  const code = await new Promise((resolve) => smoke.on("exit", resolve));
  if (code !== 0) {
    throw new Error(`Smoke test exited with code ${code}`);
  }
} catch (error) {
  console.error(output.trim());
  throw error;
} finally {
  child.kill("SIGTERM");
}
