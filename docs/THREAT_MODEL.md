# Threat model

| Threat                       | Attack                                            | Control                                                                 | Residual risk                                                                 |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Malicious page content       | Hidden text asks the model to ignore safety rules | Page and job text is wrapped as untrusted; approved context is separate | A model can still mishandle content, so evidence and user review stay visible |
| Extension impersonation      | Another extension contacts the native host        | Exact extension ID plus HMAC pairing secret                             | A compromised approved extension can act as that extension                    |
| Native Messaging abuse       | Oversized, unknown or command-like payload        | 1 MiB cap, strict enum/schema, allowlisted dispatcher                   | Local malware under the user account may attack OS-level resources            |
| Path traversal               | Web input selects another local file              | Extension protocol contains no path; Vault joins are boundary-checked   | Desktop file-picker implementation must keep the same rule                    |
| Resume exfiltration          | Page asks for an unrelated local file             | Only a user-selected resume variant may be uploaded                     | A compromised browser can access data the user explicitly selects             |
| OAuth-token leakage          | Token lands in logs, Vault or SQLite              | OS credential store abstraction; no passwords or credentials in repo    | Debuggers and same-user malware remain outside the app boundary               |
| Codex credential leakage     | App reads or copies Codex auth state              | Only supported CLI/SDK calls; no auth-file access                       | Codex itself owns local credential security                                   |
| Untrusted generated commands | Model output becomes a shell action               | Provider output is text only; native protocol has no command message    | Future agentic features need a separate approval design                       |
| Accidental submission        | Generic detector clicks final submit              | Generic auto-submit is impossible; default is review-before-submit      | Users can still click a page's own submit button                              |
| Sensitive demographics       | Extension fills protected attributes              | Label classifier marks sensitive fields manual-only                     | Site wording can evade a simple label classifier                              |
| Public Git leak              | Contributor commits a Vault or resume             | `.gitignore`, fictional fixtures and release scan                       | Ignore rules do not stop an explicit forced add                               |
| Scheduler misuse             | Background job submits or sends mail              | Scheduled auto-submission is absent; Gmail send requires approval       | Future scheduled actions need per-action audit and limits                     |

## Assumptions

The Windows user account, browser installation, Codex installation and OS credential store are trusted. OpenJobAgent does not defend against an administrator or malware already running as the same user.
