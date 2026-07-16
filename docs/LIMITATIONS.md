# Current limitations

## Implemented

- Text and Markdown resume import, Vault facts and provenance.
- Deterministic retrieval, grounded answers and multi-turn persistence decisions.
- SQLite v1 schema, opportunity normalization, duplicate detection and hard filters.
- Gmail fixture classification and send-approval behavior.
- MV3 fixture extraction, safe filling and generic final-submit protection.
- Native Messaging framing, authentication, schema checks and a real process smoke test.
- Codex SDK thread wrapper, CLI status check, cancellation and failure-state tests.

## Mocked

- Gmail data and OAuth responses.
- Opportunity records used by the desktop inbox.
- External application and scheduler histories shown in the desktop shell.

## Experimental

- Codex answer rewriting. The SDK wrapper is tested with a fake client, while live quality and account limits depend on the installed Codex version and user account.
- Native-host registration. The PowerShell installer writes per-user Chrome and Edge registry entries but is not run by automated tests.
- Tauri installer packaging until a signed release pipeline exists.

## Unsupported or blocked

- PDF and DOCX extraction without a configured local adapter.
- Live Gmail until the user supplies a separate OAuth client configuration.
- Live ATS scraping, LinkedIn/SEEK private data and prohibited automation.
- CAPTCHA, MFA, anti-bot bypasses and access-control workarounds.
- Generic final-submit automation and demographic autofill.
- Resume generation, live discovery feeds and Windows Task Scheduler registration beyond the provided setup contract.
