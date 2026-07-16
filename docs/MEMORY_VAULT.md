# Memory Vault specification

The Memory Vault is a user-selected folder. The suggested Windows location is `%USERPROFILE%\Documents\OpenJobAgentVault`, but OpenJobAgent does not create it until the user confirms.

## Layout

```text
MEMORY.md                 Short index, rules and unresolved facts
vault.yaml                Version and default resume
profile/                  Approved structured facts
experiences/ and stories/ Reusable evidence narratives
resumes/original/         Preserved imports
resumes/parsed/           Review drafts and provenance
resumes/generated/        User-approved generated variants
answer-bank/              Approved reusable wording
applications/             Portable application exports
imports/                  Import records
private/                  User-private material
```

## Fact rules

Every fact has an ID, value, status, source, date, allowed uses and sensitivity. Only `verified` and `user_asserted` facts can ground application answers. `inferred_unapproved`, `unknown`, `deprecated` and generated prose cannot be promoted without explicit approval.

## Resume import

Markdown and text import preserve the source when copy mode is selected, create a parsed draft and record a SHA-256 digest. Reference-only mode leaves the original in place. PDF and DOCX adapters return a clear error; they never claim extraction succeeded.

## Retrieval

The baseline retriever tokenizes the question, scores eligible fact IDs and values, and returns a small context package with evidence file paths. The full Vault is never sent for a single question.

## Migration

`vault.yaml.version` is `1`. A newer implementation must migrate through explicit, tested version steps and preserve originals. Unknown future versions must be rejected.
