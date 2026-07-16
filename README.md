# OpenJobAgent

[中文](#中文) · [English](#english)

![OpenJobAgent desktop overview](docs/images/desktop-overview.png)

## 中文

OpenJobAgent 是一个 Windows 优先、本地优先的求职申请助手。它由 Tauri 桌面端、Chrome/Edge 侧边栏扩展和 Native Messaging Host 组成，基础模式不需要 OpenAI API Key。

### 基础功能

- 使用本地 Memory Vault 管理已批准的个人事实、简历和常用申请答案。
- 根据已有证据准备申请答案；信息不足时返回追问，不编造经历。
- 从浏览器侧边栏识别表单字段，由用户选择复制或填入单个字段。
- 自动跳过敏感人口统计字段，通用表单不会自动点击最终提交。
- 提供 No-AI 模式，并可选用本机已登录的 Codex。

当前版本是开发预览版。虚构示例 Vault、测试表单填充和本地基础模块已经过验证；真实职位源、Gmail OAuth、PDF/DOCX 简历提取和生产 ATS 适配尚未开放。

### 下载与安装

仓库目前没有已签名的公开 Release。Windows 安装包可以从源码生成，或者直接使用当前工作区已有的本地开发构建。

推荐使用 NSIS 安装程序：

```text
target/release/bundle/nsis/OpenJobAgent_0.1.0_x64-setup.exe
```

需要 MSI 时使用：

```text
target/release/bundle/msi/OpenJobAgent_0.1.0_x64_en-US.msi
```

这些安装包是未签名的 Windows x64 开发构建。全新 clone 不包含 `target/` 下的构建产物，需要安装 Node.js 20.17+、pnpm 11、Rust stable、Visual Studio C++ Build Tools 和 WebView2，然后执行：

```powershell
pnpm install --frozen-lockfile
pnpm tauri build
```

生成的 MSI 和 NSIS 安装包位于 `target/release/bundle/`。如果只想从源码启动开发版：

```powershell
pnpm install --frozen-lockfile
pnpm tauri dev
```

浏览器扩展目前以 unpacked 开发版提供：

```powershell
pnpm --filter @openjobagent/extension build
cargo build --release --bin open-job-agent-native-host
.\scripts\install-native-host.ps1 -ExtensionId '<extension-id>'
```

构建后，在 `chrome://extensions` 或 `edge://extensions` 中打开开发者模式，并加载 `apps/extension/dist`。

---

## English

OpenJobAgent is a Windows-first, local-first job application assistant. It combines a Tauri desktop app, a Chrome/Edge side-panel extension, and a Native Messaging Host. Its basic mode does not require an OpenAI API key.

### Core features

- Keep approved profile facts, resumes, and reusable answers in a local Memory Vault.
- Prepare answers from existing evidence and ask a follow-up question when information is missing.
- Detect form fields in the browser side panel and let the user copy or fill one field at a time.
- Leave sensitive demographic fields for manual entry and never auto-submit generic forms.
- Use deterministic No-AI mode or optionally connect to a locally authenticated Codex installation.

The current build is a development preview. The fictional example Vault, fixture form filling, and local foundations are verified. Live opportunity sources, Gmail OAuth, PDF/DOCX extraction, and production ATS adapters are not available yet.

### Download and installation

There is no signed public Release yet. Windows installers can be built from source or used from the existing local development build in this workspace.

The recommended NSIS installer is:

```text
target/release/bundle/nsis/OpenJobAgent_0.1.0_x64-setup.exe
```

For MSI-based installation, use:

```text
target/release/bundle/msi/OpenJobAgent_0.1.0_x64_en-US.msi
```

These are unsigned Windows x64 development builds. A fresh clone does not include ignored files under `target/`. Install Node.js 20.17+, pnpm 11, Rust stable, Visual Studio C++ Build Tools, and WebView2, then run:

```powershell
pnpm install --frozen-lockfile
pnpm tauri build
```

MSI and NSIS outputs are written to `target/release/bundle/`. To run the development build without packaging:

```powershell
pnpm install --frozen-lockfile
pnpm tauri dev
```

The browser extension is currently distributed as an unpacked development build:

```powershell
pnpm --filter @openjobagent/extension build
cargo build --release --bin open-job-agent-native-host
.\scripts\install-native-host.ps1 -ExtensionId '<extension-id>'
```

After building, enable Developer mode at `chrome://extensions` or `edge://extensions` and load `apps/extension/dist`.

## License

OpenJobAgent is released under the [MIT License](LICENSE).
