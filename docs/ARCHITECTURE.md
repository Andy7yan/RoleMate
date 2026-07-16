# Architecture

## Trust boundaries

The browser page, extension, native host, desktop process, Memory Vault, SQLite database, Codex process and Gmail service are separate trust zones. Browser content is always untrusted. Vault facts become reusable only after approval, while SQLite stores operational state rather than becoming a hidden personal-memory store.

## Components

| Component       | Role                                                              | Status                                                                    |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Tauri desktop   | Vault setup, connection setup and user-facing work areas          | Implemented shell; external workflows remain mock or setup-only           |
| MV3 extension   | Scan the active page, show results and fill one safe field        | Implemented and fixture-tested                                            |
| Native host     | Authenticate extension messages and dispatch allowlisted commands | Implemented and process-tested                                            |
| Memory Vault    | User-editable facts, resumes, stories and answers                 | Implemented for text/Markdown and example data                            |
| SQLite          | Applications, discovery, sessions, audit and scheduler state      | Schema and migrations implemented                                         |
| Answer engine   | Deterministic evidence selection and clarification                | Implemented and unit-tested                                               |
| Codex provider  | SDK threads plus documented CLI status/login setup                | Implemented as a server-side package; live generation needs local sign-in |
| No-AI provider  | Return approved stored wording without generation                 | Implemented                                                               |
| Gmail connector | Search, classify, link, draft and send contract                   | Mock implemented; live OAuth blocked on client configuration              |

## Message path

```text
User-opened careers page
  -> content script extracts labels and constraints
  -> side panel requests a grounded answer
  -> service worker sends an authenticated Native Messaging frame
  -> native host reads only the configured Vault Answer Bank
  -> grounded result and evidence return to the side panel
  -> user chooses Copy or Fill this field
```

The extension cannot choose a Vault path or invoke a command. The desktop app writes the selected Vault path and pairing secret to the OS credential store.

## Storage ownership

- Memory Vault: reusable personal facts, approved answers, stories and resume artifacts.
- SQLite: opportunities, applications, sessions, drafts, provider thread IDs, sync links, scheduler runs and audit records.
- OS credential store: Native Messaging secret, configured Vault path and future OAuth tokens.
- Codex-owned storage: Codex credentials. OpenJobAgent never reads or copies it.

## Provider boundary

`AIProvider` defines status, session start, continuation and cancellation. `CodexProvider` uses `@openai/codex-sdk` for persistent threads and `codex login status` for a supported status check. `NoAIProvider` needs no network or credentials. A local-model provider can implement the same interface later.
