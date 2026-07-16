import { describe, expect, it } from "vitest";
import { MockGmailConnector } from ".";
const message = {
  id: "m1",
  subject: "Interview invitation",
  body: "Please schedule a call",
  from: "talent@example.test",
  receivedAt: "2026-01-01",
};
describe("Gmail mock", () => {
  it("classifies fixtures and requires approval before send", async () => {
    const connector = new MockGmailConnector([message]);
    expect(connector.classify(message)).toBe("interview");
    expect(await connector.search("talent")).toEqual([message]);
    const draft = await connector.draftReply(message, "Thank you. Tuesday works.");
    await expect(connector.sendDraft(draft, false)).rejects.toThrow("approval");
    await connector.sendDraft(draft, true);
    expect(connector.sent).toEqual([draft]);
  });
});
