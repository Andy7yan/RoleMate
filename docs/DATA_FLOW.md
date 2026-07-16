# Data flow

## Prepare and fill an answer

1. The content script reads visible labels, field types and limits from a user-opened page.
2. The side panel shows normalized questions. No answer is filled yet.
3. The service worker signs the request for the configured native host.
4. The host validates size, schema, extension ID and HMAC before dispatch.
5. The host reads the fixed `answer-bank/approved.json` path under the desktop-configured Vault.
6. A ready answer returns with evidence, or a missing answer returns a follow-up question.
7. The user chooses copy or fill. The generic path never submits.

## Codex generation

1. Targeted retrieval selects eligible facts and evidence files.
2. Approved facts form a compact context block.
3. Job and page text sits in a separate untrusted block.
4. The Codex SDK starts or resumes a thread and streams or returns text.
5. The draft remains editable and cannot become a reusable fact automatically.

## Resume import

1. The user chooses a Vault and resume.
2. Copy mode preserves an original; reference mode leaves it in place.
3. Local extraction creates a parsed draft and digest.
4. The UI presents proposed facts for review.
5. Only approved facts are written to profile or experience files.

## Gmail

The implemented mock follows the intended sequence: OAuth token in OS storage, scoped search, classification, application link, draft, user review, send. No live Gmail data moves in the current build.
