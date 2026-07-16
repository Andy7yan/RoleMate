import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const factStatusSchema = z.enum([
  "verified",
  "user_asserted",
  "inferred_unapproved",
  "unknown",
  "deprecated",
]);
export type FactStatus = z.infer<typeof factStatusSchema>;

export const factSchema = z.object({
  id: z.string().regex(/^fact\.[a-z0-9_.-]+$/),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  status: factStatusSchema,
  source: z.object({ type: z.string().min(1), reference: z.string().min(1) }),
  updated_at: z.string().date(),
  allowed_uses: z.array(z.string().min(1)).min(1),
  sensitivity: z.enum(["public", "personal", "sensitive", "highly_sensitive"]),
});
export type Fact = z.infer<typeof factSchema>;

export const applicationQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1).max(4000),
  fieldType: z.string().min(1),
  required: z.boolean(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  options: z.array(z.string()).optional(),
  jobDescription: z.string().max(100_000).optional(),
});
export type ApplicationQuestion = z.infer<typeof applicationQuestionSchema>;

export const groundedAnswerSchema = z.object({
  status: z.enum(["ready", "needs_user_input", "unsupported"]),
  answer: z.string().optional(),
  evidenceFactIds: z.array(z.string()),
  evidenceFiles: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  missingInformation: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  warnings: z.array(z.string()),
});
export type GroundedAnswer = z.infer<typeof groundedAnswerSchema>;

export const providerStatusSchema = z.object({
  available: z.boolean(),
  authenticated: z.boolean(),
  provider: z.enum(["codex", "no-ai", "local-model"]),
  detail: z.string(),
});
export type ProviderStatus = z.infer<typeof providerStatusSchema>;
export type SessionContext = { applicationId: string; groundedContext: string };
export type ProviderInput = { prompt: string; groundedContext: string };
export type ProviderResponse = { text: string; threadId: string; warnings: string[] };

export interface AIProvider {
  getStatus(): Promise<ProviderStatus>;
  startSession(context: SessionContext): Promise<string>;
  continueSession(sessionId: string, input: ProviderInput): Promise<ProviderResponse>;
  cancel(sessionId: string): Promise<void>;
}

export const opportunitySchema = z.object({
  id: z.string(),
  canonicalUrl: z.string().url(),
  source: z.string(),
  company: z.string(),
  title: z.string(),
  location: z.string(),
  remoteStatus: z.enum(["remote", "hybrid", "onsite", "unspecified"]),
  opportunityType: z.enum([
    "full_time",
    "part_time",
    "internship",
    "graduate",
    "contract",
    "freelance",
    "research",
    "startup_project",
    "paid_open_source",
    "volunteer",
  ]),
  compensation: z.string().optional(),
  skills: z.array(z.string()),
  experienceLevel: z.string().optional(),
  postedAt: z.string().optional(),
  closesAt: z.string().optional(),
  discoveredAt: z.string(),
  duplicateFingerprint: z.string(),
  rawReference: z.string().optional(),
  unpaid: z.boolean().default(false),
});
export type Opportunity = z.infer<typeof opportunitySchema>;

export const nativeRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hello"),
    requestId: z.string(),
    extensionId: z.string(),
    auth: z.string(),
  }),
  z.object({
    type: z.literal("prepare_answer"),
    requestId: z.string(),
    extensionId: z.string(),
    auth: z.string(),
    question: applicationQuestionSchema,
  }),
]);
export type NativeRequest = z.infer<typeof nativeRequestSchema>;

export const MAX_NATIVE_MESSAGE_BYTES = 1024 * 1024;
export const ALLOWED_FACT_STATUSES = new Set<FactStatus>(["verified", "user_asserted"]);

export const jsonSchemas = {
  fact: zodToJsonSchema(factSchema, { name: "Fact" }),
  applicationQuestion: zodToJsonSchema(applicationQuestionSchema, {
    name: "ApplicationQuestion",
  }),
  groundedAnswer: zodToJsonSchema(groundedAnswerSchema, { name: "GroundedAnswer" }),
  opportunity: zodToJsonSchema(opportunitySchema, { name: "Opportunity" }),
  nativeRequest: zodToJsonSchema(nativeRequestSchema, { name: "NativeRequest" }),
} as const;
