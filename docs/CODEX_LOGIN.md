# Codex setup

OpenJobAgent does not need an OpenAI API key. It reuses the supported local Codex login owned by Codex itself.

```powershell
codex.cmd --version
codex.cmd login status
codex.cmd login
```

`codex login` opens the supported ChatGPT browser sign-in flow. On a headless system, `codex login --device-auth` is the documented alternative.

OpenJobAgent never reads, copies, displays or changes Codex credential files. `CodexProvider` uses the published TypeScript SDK for persistent threads and stores only the thread ID needed to resume. Page text is wrapped as untrusted data, while approved Vault context sits in a separate block.

Missing CLI, signed-out status, empty output, cancellation and provider errors return safe failures instead of fabricated content.

References: [Codex authentication](https://learn.chatgpt.com/docs/auth), [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk.md), [Codex app server](https://learn.chatgpt.com/docs/app-server.md).
