import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const extensionPath = resolve("apps/extension/dist");
const profile = await mkdtemp(join(tmpdir(), "openjobagent-extension-"));
let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: process.env.OPENJOBAGENT_BROWSER_CHANNEL ?? "chromium",
    headless: process.env.OPENJOBAGENT_HEADFUL !== "1",
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent("serviceworker", { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  if (!extensionId || worker.url() !== `chrome-extension://${extensionId}/background.js`) {
    throw new Error(`Unexpected extension worker URL: ${worker.url()}`);
  }
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  const heading = await page.locator("h1").textContent();
  if (heading !== "OpenJobAgent") throw new Error(`Unexpected side panel heading: ${heading}`);
  console.log(
    JSON.stringify(
      { status: "passed", extensionId, serviceWorker: worker.url(), sidePanel: "loaded" },
      null,
      2,
    ),
  );
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
