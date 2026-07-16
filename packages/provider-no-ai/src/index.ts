import { randomUUID } from "node:crypto";
import type {
  AIProvider,
  ProviderInput,
  ProviderResponse,
  ProviderStatus,
  SessionContext,
} from "@openjobagent/shared";

export class NoAIProvider implements AIProvider {
  private readonly sessions = new Map<string, SessionContext>();
  async getStatus(): Promise<ProviderStatus> {
    return {
      available: true,
      authenticated: true,
      provider: "no-ai",
      detail: "Deterministic local mode",
    };
  }
  async startSession(context: SessionContext): Promise<string> {
    const id = `no-ai-${randomUUID()}`;
    this.sessions.set(id, context);
    return id;
  }
  async continueSession(sessionId: string, input: ProviderInput): Promise<ProviderResponse> {
    if (!this.sessions.has(sessionId)) throw new Error("Unknown No-AI session");
    const text = input.groundedContext.trim();
    if (!text) throw new Error("No approved grounded context is available");
    return {
      text,
      threadId: sessionId,
      warnings: ["No-AI mode returns approved stored wording without generative rewriting."],
    };
  }
  async cancel(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
