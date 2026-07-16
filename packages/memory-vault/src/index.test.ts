import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  approveFact,
  assertInsideVault,
  createVault,
  importResume,
  loadFacts,
  migrateVault,
  retrieveMemory,
} from ".";
const roots: string[] = [];
async function root() {
  const value = await mkdtemp(join(tmpdir(), "oja-test-"));
  roots.push(value);
  return value;
}
afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(roots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("Memory Vault", () => {
  it("requires confirmation and creates an indexed portable structure", async () => {
    const parent = await root();
    const vault = join(parent, "vault");
    await expect(createVault(vault, false)).rejects.toThrow("confirmation");
    await createVault(vault, true, new Date("2026-01-01"));
    expect(await readFile(join(vault, "MEMORY.md"), "utf8")).toContain(
      "Only verified or user-asserted facts",
    );
    expect(await loadFacts(vault)).toEqual([]);
  });
  it("migrates a legacy Vault without replacing its index", async () => {
    const parent = await root();
    const vault = join(parent, "legacy-vault");
    const { mkdir } = await import("node:fs/promises");
    await mkdir(vault);
    await writeFile(join(vault, "vault.yaml"), "version: 0\nowner_note: keep-me\n");
    await writeFile(join(vault, "MEMORY.md"), "# Existing index\n");
    expect(await migrateVault(vault)).toMatchObject({ from: 0, to: 1, changed: true });
    expect(await readFile(join(vault, "MEMORY.md"), "utf8")).toBe("# Existing index\n");
    expect(await readFile(join(vault, "vault.yaml"), "utf8")).toContain("owner_note: keep-me");
    expect((await migrateVault(vault)).changed).toBe(false);
  });
  it("imports text without changing the original and records provenance", async () => {
    const parent = await root();
    const vault = join(parent, "vault");
    await createVault(vault, true);
    const source = join(parent, "resume.md");
    await writeFile(source, "# Fictional resume\nTypeScript and Rust");
    const imported = await importResume(vault, source, "copy", true);
    expect(imported.sha256).toHaveLength(64);
    expect(imported.original).toContain("resumes/original");
    expect(await readFile(source, "utf8")).toContain("Fictional resume");
  });
  it("rejects unsupported extraction and path traversal", async () => {
    const parent = await root();
    const vault = join(parent, "vault");
    await createVault(vault, true);
    const pdf = join(parent, "resume.pdf");
    await writeFile(pdf, "not a real PDF");
    await expect(importResume(vault, pdf, "copy")).rejects.toThrow("adapter is not enabled");
    expect(() => assertInsideVault(vault, join(vault, "..", "secret"))).toThrow("escapes");
  });
  it("persists only explicitly approved facts and retrieves eligible facts", async () => {
    const parent = await root();
    const vault = join(parent, "vault");
    await createVault(vault, true);
    const fact = {
      id: "fact.skills.languages",
      value: ["TypeScript", "Rust"],
      status: "verified" as const,
      source: { type: "user_confirmed", reference: "profile/skills.yaml" },
      updated_at: "2026-01-01",
      allowed_uses: ["job_application"],
      sensitivity: "personal" as const,
    };
    await expect(approveFact(vault, fact, false)).rejects.toThrow("approval");
    await approveFact(vault, fact, true);
    const result = await retrieveMemory(vault, "Which programming languages do you use?");
    expect(result.facts.map((entry) => entry.id)).toEqual([fact.id]);
    expect(result.evidenceFiles).toEqual(["profile/skills.yaml"]);
    await expect(
      approveFact(vault, { ...fact, id: "fact.skills.guess", status: "inferred_unapproved" }, true),
    ).rejects.toThrow("Only verified");
  });
});
