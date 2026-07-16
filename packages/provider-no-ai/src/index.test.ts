import { describe, expect, it } from "vitest";
import { NoAIProvider } from ".";
describe("No-AI provider", () => {
  it("works without credentials and refuses ungrounded output", async () => {
    const provider = new NoAIProvider();
    expect((await provider.getStatus()).authenticated).toBe(true);
    const id = await provider.startSession({ applicationId: "a1", groundedContext: "" });
    await expect(
      provider.continueSession(id, { prompt: "Invent something", groundedContext: "" }),
    ).rejects.toThrow("No approved");
    const response = await provider.continueSession(id, {
      prompt: "Rewrite",
      groundedContext: "Approved answer",
    });
    expect(response.text).toBe("Approved answer");
  });
});
