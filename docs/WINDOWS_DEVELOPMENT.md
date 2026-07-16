# Windows development

## Toolchain check

```powershell
node --version
pnpm --version
rustc --version
cargo --version
```

PowerShell execution policy can block npm-generated `.ps1` shims. The `.cmd` form works without changing policy, for example `codex.cmd --version`.

## Daily commands

```powershell
pnpm typecheck
pnpm lint
pnpm test:ts
pnpm test:rust
pnpm build:web
pnpm test:native-host
pnpm test:e2e
cargo clippy --workspace --all-targets -- -D warnings
```

`pnpm check` runs the full set. Playwright's full Chromium channel is used because current branded Chrome builds ignore automated extension sideload flags.

## Desktop and extension development

```powershell
pnpm --filter @openjobagent/desktop dev
pnpm --filter @openjobagent/extension build
pnpm tauri dev
```

The extension is not hot-reloaded into Chrome. After a rebuild, use Reload on `chrome://extensions` or `edge://extensions`.
