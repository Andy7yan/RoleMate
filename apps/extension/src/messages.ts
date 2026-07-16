import type { DetectedField } from "@openjobagent/form-engine";
import type { GroundedAnswer } from "@openjobagent/shared";
export type ExtensionMessage =
  | { type: "scan_page" }
  | {
      type: "page_fields";
      fields: DetectedField[];
      metadata: { jobTitle: string; company: string; description: string; url: string };
    }
  | { type: "prepare_answer"; field: DetectedField }
  | { type: "answer_result"; field: DetectedField; answer: GroundedAnswer }
  | { type: "fill_field"; field: DetectedField; answer: GroundedAnswer }
  | { type: "connection_error"; error: string };
