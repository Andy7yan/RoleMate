import type { ApplicationQuestion, Fact, GroundedAnswer } from "@openjobagent/shared";

export type AnswerContext = {
  facts: Fact[];
  evidenceFiles: string[];
  approvedAnswers?: Record<string, string>;
};

function enforceLimit(answer: string, question: ApplicationQuestion): string {
  if (question.maxLength && answer.length > question.maxLength)
    return answer.slice(0, question.maxLength).trimEnd();
  return answer;
}

export function prepareGroundedAnswer(
  question: ApplicationQuestion,
  context: AnswerContext,
): GroundedAnswer {
  const normalized = question.text.trim().toLowerCase();
  const stored = context.approvedAnswers?.[normalized];
  if (stored) return ready(enforceLimit(stored, question), [], context.evidenceFiles, 1);
  const eligible = context.facts.filter(
    (fact) => fact.status === "verified" || fact.status === "user_asserted",
  );
  const matches = eligible.filter((fact) => {
    const terms = fact.id.split(/[._-]/).filter((term) => term.length > 2);
    return terms.some((term) => normalized.includes(term));
  });
  if (!matches.length) {
    return {
      status: "needs_user_input",
      evidenceFactIds: [],
      evidenceFiles: [],
      confidence: 0,
      missingInformation: [`Approved information needed to answer: ${question.text}`],
      followUpQuestions: [`What truthful information should I use for “${question.text}”?`],
      warnings: ["No answer was generated because approved evidence is insufficient."],
    };
  }
  const answer = matches
    .map((fact) => (Array.isArray(fact.value) ? fact.value.join(", ") : String(fact.value)))
    .join("; ");
  const limited = enforceLimit(answer, question);
  if (question.minLength && limited.length < question.minLength) {
    return {
      status: "needs_user_input",
      evidenceFactIds: matches.map((fact) => fact.id),
      evidenceFiles: context.evidenceFiles,
      confidence: 0.5,
      missingInformation: [`More detail is required to reach ${question.minLength} characters`],
      followUpQuestions: ["Can you provide another approved detail relevant to this question?"],
      warnings: [],
    };
  }
  return ready(
    limited,
    matches.map((fact) => fact.id),
    context.evidenceFiles,
    0.9,
  );
}

function ready(
  answer: string,
  evidenceFactIds: string[],
  evidenceFiles: string[],
  confidence: number,
): GroundedAnswer {
  return {
    status: "ready",
    answer,
    evidenceFactIds,
    evidenceFiles,
    confidence,
    missingInformation: [],
    followUpQuestions: [],
    warnings: [],
  };
}

export type ClarificationDecision = "use_once" | "save_fact" | "save_story" | "cancel";
export type Clarification = {
  id: string;
  question: string;
  response?: string;
  decision?: ClarificationDecision;
  approved: boolean;
};

export class ApplicationSession {
  readonly messages: Array<{ role: "user" | "assistant"; text: string }> = [];
  readonly clarifications: Clarification[] = [];
  constructor(readonly id: string) {}
  ask(question: string): Clarification {
    const item = { id: `${this.id}-${this.clarifications.length + 1}`, question, approved: false };
    this.clarifications.push(item);
    this.messages.push({ role: "assistant", text: question });
    return item;
  }
  respond(
    id: string,
    response: string,
    decision: ClarificationDecision,
    approved: boolean,
  ): Clarification {
    const item = this.clarifications.find((entry) => entry.id === id);
    if (!item) throw new Error("Unknown clarification");
    if ((decision === "save_fact" || decision === "save_story") && !approved)
      throw new Error("Permanent storage requires confirmation-card approval");
    Object.assign(item, { response, decision, approved });
    this.messages.push({ role: "user", text: response });
    return item;
  }
}
