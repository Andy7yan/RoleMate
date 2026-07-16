import { describe, expect, it } from "vitest";
import { ApplicationSession, prepareGroundedAnswer } from ".";
const fact = {
  id: "fact.skills.languages",
  value: ["TypeScript", "Rust"],
  status: "verified" as const,
  source: { type: "user_confirmed", reference: "profile/skills.yaml" },
  updated_at: "2026-01-01",
  allowed_uses: ["job_application"],
  sensitivity: "personal" as const,
};
describe("grounded answer engine", () => {
  it("uses evidence, respects character limits and rejects unknown facts", () => {
    const result = prepareGroundedAnswer(
      {
        text: "Which skills languages do you use?",
        fieldType: "textarea",
        required: true,
        maxLength: 10,
      },
      { facts: [fact], evidenceFiles: [fact.source.reference] },
    );
    expect(result).toMatchObject({
      status: "ready",
      answer: "TypeScript",
      evidenceFactIds: [fact.id],
    });
    const unknown = prepareGroundedAnswer(
      { text: "How many people did you manage?", fieldType: "text", required: true },
      { facts: [fact], evidenceFiles: [] },
    );
    expect(unknown.status).toBe("needs_user_input");
    expect(unknown.answer).toBeUndefined();
  });
  it("separates use-once from approved permanent persistence", () => {
    const session = new ApplicationSession("application-1");
    const question = session.ask("What is your availability?");
    expect(session.respond(question.id, "From July", "use_once", false).decision).toBe("use_once");
    const second = session.ask("What is your work authorisation?");
    expect(() => session.respond(second.id, "Citizen", "save_fact", false)).toThrow("approval");
    expect(session.respond(second.id, "Citizen", "save_fact", true).approved).toBe(true);
  });
});
