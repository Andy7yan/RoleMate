import { createHash } from "node:crypto";
import { opportunitySchema, type Opportunity } from "@openjobagent/shared";

export type OpportunityInput = Omit<Opportunity, "id" | "duplicateFingerprint" | "discoveredAt"> & {
  id?: string;
  discoveredAt?: string;
};
export interface OpportunitySource {
  readonly id: string;
  discover(): Promise<OpportunityInput[]>;
}

function canonicalizeUrl(value: string): string {
  const url = new URL(value);
  ["utm_source", "utm_medium", "utm_campaign", "ref"].forEach((key) =>
    url.searchParams.delete(key),
  );
  url.hash = "";
  return url.toString();
}

export function normalizeOpportunity(input: OpportunityInput, now = new Date()): Opportunity {
  const canonicalUrl = canonicalizeUrl(input.canonicalUrl);
  const basis = `${input.company.trim().toLowerCase()}|${input.title.trim().toLowerCase()}|${canonicalUrl}`;
  const duplicateFingerprint = createHash("sha256").update(basis).digest("hex");
  return opportunitySchema.parse({
    ...input,
    canonicalUrl,
    id: input.id ?? duplicateFingerprint.slice(0, 16),
    duplicateFingerprint,
    discoveredAt: input.discoveredAt ?? now.toISOString(),
    unpaid: input.opportunityType === "volunteer" || input.unpaid,
  });
}

export function deduplicateOpportunities(items: Opportunity[]): Opportunity[] {
  return [...new Map(items.map((item) => [item.duplicateFingerprint, item])).values()];
}

export type HardFilters = {
  locations?: string[];
  remoteStatuses?: Opportunity["remoteStatus"][];
  types?: Opportunity["opportunityType"][];
  excludedCompanies?: string[];
  requiredAuthorisation?: string;
  candidateAuthorisations?: string[];
  minimumCompensation?: number;
};

export function applyHardFilters(items: Opportunity[], filters: HardFilters): Opportunity[] {
  return items.filter((item) => {
    if (
      filters.locations?.length &&
      !filters.locations.some((location) =>
        item.location.toLowerCase().includes(location.toLowerCase()),
      )
    )
      return false;
    if (filters.remoteStatuses?.length && !filters.remoteStatuses.includes(item.remoteStatus))
      return false;
    if (filters.types?.length && !filters.types.includes(item.opportunityType)) return false;
    if (
      filters.excludedCompanies?.some(
        (company) => item.company.toLowerCase() === company.toLowerCase(),
      )
    )
      return false;
    if (
      filters.requiredAuthorisation &&
      !filters.candidateAuthorisations?.includes(filters.requiredAuthorisation)
    )
      return false;
    if (filters.minimumCompensation && item.compensation) {
      const amount = Number(item.compensation.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(amount) && amount < filters.minimumCompensation) return false;
    }
    return true;
  });
}

export class ManualOpportunitySource implements OpportunitySource {
  readonly id: string = "manual";
  constructor(private readonly values: OpportunityInput[]) {}
  async discover(): Promise<OpportunityInput[]> {
    return this.values;
  }
}

function xmlValue(block: string, tag: string): string {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"),
  );
  return (match?.[1] ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export class RssOpportunitySource implements OpportunitySource {
  readonly id: string;
  constructor(
    readonly feedUrl: string,
    private readonly fetchText: (url: string) => Promise<string>,
  ) {
    const url = new URL(feedUrl);
    if (url.protocol !== "https:") throw new Error("Public feed sources must use HTTPS");
    this.id = `rss:${url.hostname}`;
  }
  async discover(): Promise<OpportunityInput[]> {
    const xml = await this.fetchText(this.feedUrl);
    const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
    return blocks.map((block) => {
      const link = xmlValue(block, "link");
      const title = xmlValue(block, "title");
      if (!link || !title) throw new Error("RSS opportunity is missing title or link");
      const category = xmlValue(block, "category").toLowerCase();
      const opportunityType = category.includes("intern")
        ? "internship"
        : category.includes("contract")
          ? "contract"
          : "full_time";
      return {
        canonicalUrl: link,
        source: this.id,
        company: xmlValue(block, "author") || "Unknown company",
        title,
        location: xmlValue(block, "location") || "Unspecified",
        remoteStatus: /remote/i.test(block) ? "remote" : "unspecified",
        opportunityType,
        compensation: xmlValue(block, "compensation") || undefined,
        skills: xmlValue(block, "skills")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        postedAt: xmlValue(block, "pubDate") || undefined,
        rawReference: this.feedUrl,
        unpaid: false,
      };
    });
  }
}

export class UserImportedUrlSource extends ManualOpportunitySource {
  override readonly id = "user_imported_url";
}

export class Scheduler {
  private history: Array<{
    task: string;
    startedAt: string;
    status: "succeeded" | "failed";
    error?: string;
  }> = [];
  async runNow(task: string, job: () => Promise<void>, attempts = 3): Promise<void> {
    const startedAt = new Date().toISOString();
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        await job();
        this.history.push({ task, startedAt, status: "succeeded" });
        return;
      } catch (error) {
        if (attempt === attempts - 1) {
          this.history.push({
            task,
            startedAt,
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, Math.min(25 * 2 ** attempt, 100)));
      }
    }
  }
  getHistory() {
    return [...this.history];
  }
  start(task: string, intervalMs: number, job: () => Promise<void>): () => void {
    if (!Number.isFinite(intervalMs) || intervalMs < 1_000) {
      throw new Error("Scheduler interval must be at least one second");
    }
    const timer = setInterval(() => {
      void this.runNow(task, job).catch(() => undefined);
    }, intervalMs);
    return () => clearInterval(timer);
  }
}
