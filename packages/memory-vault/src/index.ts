import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import YAML from "yaml";
import { ALLOWED_FACT_STATUSES, factSchema, type Fact } from "@openjobagent/shared";

export const VAULT_VERSION = 1;
const directories = [
  "profile",
  "experiences",
  "stories",
  "resumes/original",
  "resumes/parsed",
  "resumes/generated",
  "answer-bank",
  "applications",
  "imports",
  "private",
];

export function assertInsideVault(vaultPath: string, candidate: string): string {
  const root = resolve(vaultPath);
  const target = resolve(candidate);
  if (target !== root && !target.startsWith(`${root}${sep}`))
    throw new Error("Path escapes Memory Vault");
  return target;
}

export async function createVault(
  vaultPath: string,
  confirmed: boolean,
  now = new Date(),
): Promise<void> {
  if (!confirmed) throw new Error("Vault creation requires explicit user confirmation");
  await mkdir(vaultPath, { recursive: false });
  await Promise.all(
    directories.map((directory) => mkdir(join(vaultPath, directory), { recursive: true })),
  );
  const date = now.toISOString().slice(0, 10);
  await writeFile(
    join(vaultPath, "vault.yaml"),
    YAML.stringify({ version: VAULT_VERSION, created_at: date, default_resume: null }),
    { flag: "wx" },
  );
  await writeFile(join(vaultPath, "MEMORY.md"), memoryIndex(date), { flag: "wx" });
  await writeFile(join(vaultPath, "profile", "facts.yaml"), YAML.stringify({ facts: [] }), {
    flag: "wx",
  });
}

export async function migrateVault(
  vaultPath: string,
): Promise<{ from: number; to: number; changed: boolean }> {
  const configPath = join(vaultPath, "vault.yaml");
  const config = YAML.parse(await readFile(configPath, "utf8"));
  const version = Number(config.version ?? 0);
  if (!Number.isInteger(version) || version < 0) throw new Error("Invalid Memory Vault version");
  if (version > VAULT_VERSION)
    throw new Error(`Memory Vault version ${version} is newer than this application supports`);
  if (version === VAULT_VERSION) return { from: version, to: version, changed: false };
  if (version === 0) {
    await Promise.all(
      directories.map((directory) => mkdir(join(vaultPath, directory), { recursive: true })),
    );
    const factsPath = join(vaultPath, "profile", "facts.yaml");
    try {
      await stat(factsPath);
    } catch {
      await writeFile(factsPath, YAML.stringify({ facts: [] }), { flag: "wx" });
    }
    config.version = 1;
    config.migrated_at = new Date().toISOString();
    await writeFile(configPath, YAML.stringify(config));
    return { from: 0, to: 1, changed: true };
  }
  throw new Error(`No migration path from Memory Vault version ${version}`);
}

function memoryIndex(date: string): string {
  return `# OpenJobAgent Memory Vault\n\n## Profile summary\n\nNo approved summary yet.\n\n## Index\n\n- [Facts](profile/facts.yaml)\n- [Preferences](profile/preferences.yaml)\n- [Experiences](experiences/)\n- [Stories](stories/)\n- [Answer bank](answer-bank/)\n\n## Fact categories\n\nIdentity, education, skills, experience, work authorisation, availability and preferences.\n\n## Provenance and update rules\n\nEvery fact records its source, status, allowed uses, sensitivity and update date. Only verified or user-asserted facts may ground application answers. Generated wording and inferred facts require explicit approval before persistence.\n\n## Unresolved or unverified facts\n\n- None recorded.\n\nLast updated: ${date}\n`;
}

export type ResumeImport = {
  id: string;
  original?: string;
  parsed: string;
  sha256: string;
  extractedText: string;
  warnings: string[];
};

export async function importResume(
  vaultPath: string,
  sourcePath: string,
  mode: "copy" | "reference",
  makeDefault = false,
): Promise<ResumeImport> {
  await stat(join(vaultPath, "vault.yaml"));
  const extension = extname(sourcePath).toLowerCase();
  if (![".md", ".txt", ".pdf", ".docx"].includes(extension))
    throw new Error(`Unsupported resume type: ${extension || "none"}`);
  if ([".pdf", ".docx"].includes(extension))
    throw new Error(
      `${extension.slice(1).toUpperCase()} extraction adapter is not enabled in this build; import Markdown or text, or configure a local extractor`,
    );
  const extractedText = await readFile(sourcePath, "utf8");
  if (!extractedText.trim()) throw new Error("Resume contains no text");
  const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const sha256 = createHash("sha256").update(extractedText).digest("hex");
  let original: string | undefined;
  if (mode === "copy") {
    const destination = assertInsideVault(
      vaultPath,
      join(vaultPath, "resumes", "original", `${id}-${basename(sourcePath)}`),
    );
    await copyFile(sourcePath, destination);
    original = relative(vaultPath, destination).replaceAll("\\", "/");
  }
  const parsedPath = assertInsideVault(
    vaultPath,
    join(vaultPath, "resumes", "parsed", `${id}.yaml`),
  );
  await writeFile(
    parsedPath,
    YAML.stringify({
      id,
      source: mode === "copy" ? original : sourcePath,
      sha256,
      review_status: "draft",
      extracted_text: extractedText,
      proposed_facts: [],
    }),
    { flag: "wx" },
  );
  if (makeDefault) {
    const configPath = join(vaultPath, "vault.yaml");
    const config = YAML.parse(await readFile(configPath, "utf8"));
    config.default_resume = id;
    await writeFile(configPath, YAML.stringify(config));
  }
  return {
    id,
    original,
    parsed: relative(vaultPath, parsedPath).replaceAll("\\", "/"),
    sha256,
    extractedText,
    warnings: [],
  };
}

export async function loadFacts(vaultPath: string): Promise<Fact[]> {
  const doc = YAML.parse(await readFile(join(vaultPath, "profile", "facts.yaml"), "utf8"));
  return (doc.facts ?? []).map((fact: unknown) => factSchema.parse(fact));
}

export async function approveFact(
  vaultPath: string,
  proposed: Fact,
  approved: boolean,
): Promise<void> {
  if (!approved) throw new Error("Fact persistence requires explicit approval");
  const fact = factSchema.parse(proposed);
  if (!ALLOWED_FACT_STATUSES.has(fact.status))
    throw new Error("Only verified or user-asserted facts can be approved for reuse");
  const facts = await loadFacts(vaultPath);
  const next = facts.filter((existing) => existing.id !== fact.id);
  next.push(fact);
  await writeFile(join(vaultPath, "profile", "facts.yaml"), YAML.stringify({ facts: next }));
}

export type RetrievalResult = {
  facts: Fact[];
  evidenceFiles: string[];
  missingInformation: string[];
  context: string;
};
export async function retrieveMemory(vaultPath: string, query: string): Promise<RetrievalResult> {
  const tokens = new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const eligible = (await loadFacts(vaultPath)).filter(
    (fact) =>
      ALLOWED_FACT_STATUSES.has(fact.status) && fact.allowed_uses.includes("job_application"),
  );
  const scored = eligible
    .map((fact) => {
      const text = `${fact.id} ${JSON.stringify(fact.value)}`.toLowerCase();
      return {
        fact,
        score: [...tokens].reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0),
      };
    })
    .sort((a, b) => b.score - a.score);
  const selected = scored
    .filter((entry) => entry.score > 0)
    .slice(0, 8)
    .map((entry) => entry.fact);
  const facts = selected.length ? selected : eligible.slice(0, 3);
  return {
    facts,
    evidenceFiles: [...new Set(facts.map((fact) => fact.source.reference))],
    missingInformation: facts.length ? [] : ["No approved fact matches this question"],
    context: facts
      .map((fact) => `${fact.id}: ${JSON.stringify(fact.value)} (${fact.status})`)
      .join("\n"),
  };
}
