import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const fixtures = ["greenhouse", "lever", "generic"] as const;

for (const name of fixtures) {
  test(`${name} fixture extracts fields without submitting`, async ({ page }) => {
    const html = await readFile(resolve(`packages/test-fixtures/forms/${name}.html`), "utf8");
    await page.setContent(html);
    await page.evaluate(() => {
      let listener: any;
      (window as any).__submitted = false;
      document.querySelector("form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        (window as any).__submitted = true;
      });
      (window as any).chrome = {
        runtime: {
          onMessage: {
            addListener(value: any) {
              listener = value;
            },
          },
        },
      };
      (window as any).__sendToContent = (message: unknown) =>
        new Promise((resolveMessage) => listener(message, {}, resolveMessage));
    });
    await page.addScriptTag({ path: resolve("apps/extension/dist/content.js") });
    const scan = await page.evaluate(() => (window as any).__sendToContent({ type: "scan_page" }));
    expect(scan.type).toBe("page_fields");
    expect(scan.fields.length).toBeGreaterThan(0);
    expect(scan.metadata.url).toBe("about:blank");
    expect(await page.evaluate(() => (window as any).__submitted)).toBe(false);
  });
}

test("vertical slice fills an approved answer and preserves final-submit protection", async ({
  page,
}) => {
  const html = await readFile(resolve("packages/test-fixtures/forms/greenhouse.html"), "utf8");
  await page.setContent(html);
  await page.evaluate(() => {
    let listener: any;
    (window as any).__submitted = false;
    document.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      (window as any).__submitted = true;
    });
    (window as any).chrome = {
      runtime: {
        onMessage: {
          addListener(value: any) {
            listener = value;
          },
        },
      },
    };
    (window as any).__sendToContent = (message: unknown) =>
      new Promise((resolveMessage) => listener(message, {}, resolveMessage));
  });
  await page.addScriptTag({ path: resolve("apps/extension/dist/content.js") });
  const scan = await page.evaluate(() => (window as any).__sendToContent({ type: "scan_page" }));
  const field = scan.fields.find((entry: any) => entry.id === "why");
  const response = await page.evaluate(
    ({ field }) =>
      (window as any).__sendToContent({
        type: "fill_field",
        field,
        answer: {
          status: "ready",
          answer: "I enjoy building accessible TypeScript software.",
          evidenceFactIds: ["fact.skills.typescript"],
          evidenceFiles: ["profile/skills.yaml"],
          confidence: 1,
          missingInformation: [],
          followUpQuestions: [],
          warnings: [],
        },
      }),
    { field },
  );
  expect(response.filled).toBe(true);
  await expect(page.locator("#why")).toHaveValue(
    "I enjoy building accessible TypeScript software.",
  );
  expect(await page.evaluate(() => (window as any).__submitted)).toBe(false);
});
