# Privacy statement

OpenJobAgent is local-first. A user-selected Memory Vault holds reusable personal facts, while SQLite stores operational records on the same computer. No Vault is created or uploaded without confirmation.

## Data leaving the computer

Data leaves the computer only for a user-enabled feature:

- targeted approved context sent to Codex for rewriting;
- selected field values sent to the job website when the user fills them;
- Gmail API requests after OAuth setup;
- application submissions performed by the user or a future explicitly allowlisted adapter.

The UI labels local storage, Codex transfers, job-site transfers, Gmail transfers and pending approvals separately.

## Data that stays out of the repository

Real Vaults, resumes, OAuth clients, OAuth tokens, SQLite databases, browser profiles, Codex credentials, pairing secrets and generated applications are ignored. Contributors must use fictional fixtures.

## Deletion and portability

The Memory Vault is an ordinary folder that users can copy, inspect and delete. SQLite and OS credential-store entries are separate and should be removed through the desktop settings once that UI is complete. Until then, local development cleanup is manual and documented in release notes.
