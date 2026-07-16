# OpenJobAgent implementation plan

## Milestones and acceptance criteria

1. **Foundation** — pnpm and Cargo workspaces install, type-check and build on Windows.
2. **Grounded vertical slice** — a fictional vault is created only after confirmation; an extracted fixture question crosses the authenticated native protocol; an approved answer is returned and filled.
3. **Clarification and persistence** — missing information produces focused follow-ups; use-once and explicitly approved permanent facts behave differently.
4. **Local operations** — SQLite migrations, opportunity import/deduplication/filtering, scheduler runs and Gmail fixture classification are tested.
5. **Codex provider** — documented CLI status/login and SDK thread continuation are wrapped without reading credentials; failure and cancellation are tested.
6. **Hardening** — hostile page content, message validation, path handling and final-submit protection have regression tests.
7. **Windows delivery** — desktop dev launch, extension unpacked build, native-host build and Tauri installer are attempted and evidence recorded.

No live website, Gmail account, real resume, real vault or application submission is used during verification.
