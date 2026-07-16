/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { canAutoSubmit, extractVisibleFields, fillField } from ".";
describe("form engine", () => {
  it("extracts supported fields and fills only safe ready answers", () => {
    document.body.innerHTML = `<form><label for="why">Why join us?</label><textarea id="why" required maxlength="120"></textarea><label>Gender <select name="gender"><option>Prefer not to say</option></select></label><button type="submit">Apply</button></form>`;
    const fields = extractVisibleFields(document);
    expect(fields).toHaveLength(2);
    expect(fields[1]?.sensitive).toBe(true);
    const ready = {
      status: "ready" as const,
      answer: "Grounded answer",
      evidenceFactIds: ["fact.story"],
      evidenceFiles: ["stories/example.md"],
      confidence: 1,
      missingInformation: [],
      followUpQuestions: [],
      warnings: [],
    };
    expect(fillField(document, fields[0]!, ready)).toBe(true);
    expect((document.querySelector("textarea") as HTMLTextAreaElement).value).toBe(
      "Grounded answer",
    );
    expect(fillField(document, fields[1]!, ready)).toBe(false);
  });
  it("protects final submit in generic and review modes", () => {
    expect(canAutoSubmit("fill_only", true)).toBe(false);
    expect(canAutoSubmit("review_before_submit", true)).toBe(false);
    expect(canAutoSubmit("auto_submit_allowlisted", false)).toBe(false);
    expect(canAutoSubmit("auto_submit_allowlisted", true)).toBe(true);
  });
});
