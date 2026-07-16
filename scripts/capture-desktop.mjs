import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const server = spawn(
  process.execPath,
  [resolve("apps/desktop/node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", "1421"],
  { cwd: resolve("apps/desktop"), stdio: "ignore", windowsHide: true },
);
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:1421");
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The preview server may still be binding its port.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  if (!ready) throw new Error("Desktop preview server did not start");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 940 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://127.0.0.1:1421", { waitUntil: "networkidle" });
  await mkdir(resolve("docs/images"), { recursive: true });
  await page.screenshot({ path: resolve("docs/images/desktop-overview.png"), fullPage: true });
  await browser.close();
  console.log("Captured docs/images/desktop-overview.png");
} finally {
  server.kill();
}
