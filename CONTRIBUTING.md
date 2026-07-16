# Contributing

OpenJobAgent accepts changes that keep personal data local, preserve approval gates and use fictional fixtures.

## Before opening a pull request

```powershell
pnpm install
pnpm check
```

A change that touches Rust should pass `cargo fmt --all -- --check` and Clippy with warnings denied. Extension work needs a fixture test, while Vault changes need provenance and unknown-fact tests.

## Repository rules

- No real resume, Vault, OAuth configuration, token, browser profile or application data.
- No prohibited scraping, CAPTCHA bypass, MFA bypass or cookie extraction.
- No new auto-submit path without a named adapter, explicit enablement, legal review and dedicated tests.
- No generated claim without evidence IDs and files.
- No secret in command-line output or logs.

Small pull requests are easier to review. Documentation must say whether a capability is working, mocked, experimental or blocked.
