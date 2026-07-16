# Installation

## Source build

Windows is the supported desktop target. Install Node.js 20.17 or newer, pnpm 11, Rust stable with the MSVC target, Visual Studio C++ Build Tools, WebView2 Runtime, and Chrome or Edge.

```powershell
pnpm install
pnpm check
pnpm tauri build
```

Tauri writes MSI and NSIS artifacts under `target/release/bundle`. If packaging stops before that directory exists, `docs/VERIFICATION.md` contains the failing command and reason.

## Run from source

```powershell
pnpm tauri dev
```

No Vault is created at startup. The user must choose or create one in the desktop app.

## Example data

`examples/OpenJobAgentVault` contains fictional data. It is safe for tests and screenshots; it must not be replaced with personal data in a public checkout.
