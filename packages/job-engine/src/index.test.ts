import { describe, expect, it, vi } from "vitest";
import {
  applyHardFilters,
  deduplicateOpportunities,
  normalizeOpportunity,
  RssOpportunitySource,
  Scheduler,
} from ".";
const base = {
  canonicalUrl: "https://jobs.example.test/1?utm_source=test",
  source: "fixture",
  company: "Example Co",
  title: "Graduate Engineer",
  location: "Sydney",
  remoteStatus: "hybrid" as const,
  opportunityType: "graduate" as const,
  skills: ["TypeScript"],
  unpaid: false,
};
describe("opportunity engine", () => {
  it("normalizes, fingerprints, deduplicates and filters before ranking", () => {
    const one = normalizeOpportunity(base, new Date("2026-01-01"));
    const duplicate = normalizeOpportunity(
      { ...base, canonicalUrl: "https://jobs.example.test/1?ref=email" },
      new Date("2026-01-02"),
    );
    expect(one.canonicalUrl).toBe("https://jobs.example.test/1");
    expect(deduplicateOpportunities([one, duplicate])).toHaveLength(1);
    expect(applyHardFilters([one], { locations: ["Melbourne"] })).toEqual([]);
    expect(applyHardFilters([one], { locations: ["Sydney"], types: ["graduate"] })).toHaveLength(1);
  });
  it("retries scheduler work and records history", async () => {
    const scheduler = new Scheduler();
    const job = vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValue(undefined);
    await scheduler.runNow("discovery", job);
    expect(job).toHaveBeenCalledTimes(2);
    expect(scheduler.getHistory()[0]?.status).toBe("succeeded");
  });
  it("supports an application-running schedule that can be stopped", async () => {
    vi.useFakeTimers();
    const scheduler = new Scheduler();
    const job = vi.fn(async () => undefined);
    const stop = scheduler.start("gmail_sync", 1_000, job);
    await vi.advanceTimersByTimeAsync(2_100);
    stop();
    expect(job).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
  it("discovers opportunities from a documented public RSS fixture", async () => {
    const feed = `<rss><channel><item><title>Research Intern</title><link>https://careers.example.test/jobs/2</link><author>Example Lab</author><location>Remote Australia</location><category>Internship</category><skills>Python, Research</skills></item></channel></rss>`;
    const source = new RssOpportunitySource(
      "https://careers.example.test/feed.xml",
      async () => feed,
    );
    const discovered = await source.discover();
    expect(discovered[0]).toMatchObject({
      title: "Research Intern",
      opportunityType: "internship",
      remoteStatus: "remote",
      skills: ["Python", "Research"],
    });
  });
});
