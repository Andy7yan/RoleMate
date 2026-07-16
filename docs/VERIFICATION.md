# Verification record

## Environment

- Date: 2026-07-16
- OS: Windows, PowerShell
- Node.js: 20.17.0
- pnpm: 11.9.0
- Rust: 1.97.0 stable, `x86_64-pc-windows-msvc`
- Browser: Playwright Chromium 149.0.7827.55 for automated extension loading and form tests
- Codex CLI: 0.125.0

## Full check

`pnpm install --frozen-lockfile` completed with the lockfile unchanged across all 12 workspace projects.

Command:

```powershell
pnpm check
```

Result: passed with exit code 0 after Clippy was installed for the active toolchain.

The check covered:

- Prettier format check: passed.
- ESLint with zero warnings: passed.
- TypeScript strict check: passed.
- Vitest: 7 files, 18 tests passed.
- Rust tests: 7 tests passed across Memory Vault example creation, SQLite migrations, native protocol and credential-store contract.
- Desktop Vite build: passed, 1,581 modules transformed.
- Extension Vite/esbuild build: passed, 28 side-panel modules plus `background.js` and `content.js`.
- Native-host process smoke: passed.
- Unpacked extension load: passed; the MV3 service worker started and `sidepanel.html` rendered in an isolated Chromium profile.
- Playwright: 4 tests passed against Greenhouse-style, Lever-style and generic fixtures.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --all-targets -- -D warnings`: passed.

## Native Messaging flow

Command:

```powershell
pnpm test:native-host
```

Result: a real `open-job-agent-native-host.exe` process accepted a length-prefixed request, verified the extension ID and HMAC, read `examples/OpenJobAgentVault/answer-bank/approved.json`, and returned `Yes` with evidence. Unknown types, invalid schemas, bad authentication and messages over 1 MiB are covered by Rust tests.

## Browser form flow

Command:

```powershell
pnpm test:e2e
```

Result: 4/4 passed. All three fixtures produced normalized fields without submission. The vertical-slice test filled the approved answer into the Greenhouse-style textarea and confirmed the submit event did not fire.

The unpacked extension output is `apps/extension/dist`. It contains `manifest.json`, `background.js`, `content.js`, `sidepanel.html` and side-panel assets.

Command:

```powershell
pnpm test:extension-load
```

Result: passed. Chromium started the MV3 service worker at `chrome-extension://cgnbkandbjdhchcifopimmnnhpiiijfa/background.js`, and the side panel heading rendered as `OpenJobAgent`. The extension ID is deterministic for this unpacked build but is not a production-store identity.

## Desktop launch

Command:

```powershell
pnpm tauri dev
```

Result: passed. Vite reported ready at `http://127.0.0.1:1420`; Cargo finished the development profile and started `target/debug/open-job-agent-desktop.exe`. The running Windows process was observed and then stopped after the check. Startup logs were kept only under ignored `test-results/`.

A browser-rendered representative desktop screenshot was captured at `docs/images/desktop-overview.png` and inspected at 1440 x 940.

## Release packaging

Command:

```powershell
pnpm tauri build
```

Result: passed after adding explicit Windows icon paths. Tauri produced:

- `target/release/open-job-agent-desktop.exe` — 10,320,384 bytes.
- `target/release/open-job-agent-native-host.exe` — 460,288 bytes.
- `target/release/bundle/msi/OpenJobAgent_0.1.0_x64_en-US.msi` — 3,964,928 bytes; SHA-256 `5DB134ADF055D6109F30D9AE4638D72797536879141A6DF9F6AEC0D5F09409E9`.
- `target/release/bundle/nsis/OpenJobAgent_0.1.0_x64-setup.exe` — 2,707,805 bytes; SHA-256 `B183DDE2AD7D9B04B0110E99FB2D77C32346FA52987D331BC4510DDB8C4EF453`.

The release build creates a target-triple sidecar before bundling. A read-only query of the final MSI `File` table found both `open-job-agent-desktop.exe` (10,320,384 bytes) and `open-job-agent-native-host.exe` (460,288 bytes).

The installers are unsigned development artifacts. Installation and uninstall were not run because they change the host system.

## Codex status

`codex.cmd --version` returned `codex-cli 0.125.0`. On this machine, `codex.cmd login status` stopped before authentication with:

```text
config.toml:3:16: unknown variant `default`, expected `fast` or `flex`
```

This is an external per-user Codex configuration blocker, not an OpenJobAgent credential read. Provider status failure, missing CLI, cancellation, empty output, thread continuation and prompt-injection boundaries are covered by unit tests. A live model response was not claimed.

## Privacy and repository scan

A repository scan found no private-key headers, Google API key patterns, OpenAI-style secret keys, GitHub personal tokens, `refresh_token` values or `client_secret` values outside ignored dependencies and build output. The committed example Vault identifies itself as fictional. Real Vaults, resumes, SQLite files, credentials and browser profiles are ignored.

## External capabilities not verified

- Live Gmail OAuth, message access and sending: blocked on user-owned OAuth client configuration and account authorization; the mock is tested.
- Live job websites and public feeds: no external account or live request was used; RSS and manual-import discovery are fixture-tested.
- PDF and DOCX extraction: unsupported adapter errors are tested; Markdown and text imports pass.
- Chrome/Edge registry installation: the per-user registration script exists but was not run.
- Application submission: intentionally not run, and generic submission is blocked by design.
