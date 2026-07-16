# Chrome and Edge extension setup

1. Build the extension with `pnpm --filter @openjobagent/extension build`.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode and choose **Load unpacked**.
4. Select `apps/extension/dist`.
5. Copy the extension ID shown by the browser.
6. Build the host with `cargo build --release --bin open-job-agent-native-host`.
7. Register it from PowerShell:

```powershell
.\scripts\install-native-host.ps1 -ExtensionId '<extension-id>'
```

8. In the desktop app, choose a Vault and generate a pairing code.
9. Paste the code into the side panel and select **Pair**.

The default manifest grants host access only to localhost test pages. For another site, the user must grant the optional per-site permission. The generic detector cannot submit the final form.
