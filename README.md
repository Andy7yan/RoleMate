# OpenJobAgent

OpenJobAgent 是一个 Windows 优先、本地优先的求职与申请辅助工具。桌面端、Chrome/Edge 侧边栏扩展和 Native Messaging Host 共同工作；基础模式不需要 OpenAI API Key。

[中文](#中文说明) · [English](#english)

![OpenJobAgent desktop overview](docs/images/desktop-overview.png)

---

# 中文说明

## 当前项目是什么状态

这是一个经过本地测试的早期版本，不是已经接通所有外部服务的成品。

- 可直接体验：桌面端界面、虚构示例 Memory Vault、示例职位列表、本地搜索、Codex 登录状态检查、浏览器扩展配对、测试页面字段识别，以及基于已批准答案的单字段填充。
- 已在代码和测试中实现：Vault 数据结构、Markdown/TXT 简历导入、事实审批、证据检索、澄清流程、职位标准化与硬筛选、SQLite schema、Native Messaging 鉴权、No-AI/Codex Provider 接口、Gmail Mock。
- 尚未接通：真实职位源、真实 Gmail OAuth、真实 ATS 站点适配、PDF/DOCX 提取、通用自动提交，以及多数桌面侧栏页面的完整交互。

如果只是想看看产品形态，可以安装桌面端并创建虚构 Vault。要测试网页表单辅助，还需要安装浏览器扩展并注册 Native Host。

## 安装方式总览

| 目的             | 方式                                 | 适合谁                                    |
| ---------------- | ------------------------------------ | ----------------------------------------- |
| 安装桌面程序     | NSIS `setup.exe`                     | 普通 Windows 用户，安装向导最直接         |
| 部署桌面程序     | MSI 安装包                           | 需要 MSI 或企业部署流程的用户             |
| 本地开发         | `pnpm tauri dev`                     | 需要修改前端、Rust 或桌面壳的开发者       |
| 自行生成安装包   | `pnpm tauri build`                   | 需要从当前源码构建 MSI/NSIS 的开发者      |
| 使用网页表单助手 | 加载 unpacked 扩展并注册 Native Host | 需要在 Chrome/Edge 侧边栏扫描和填表的用户 |

当前仓库没有已签名的公开 Release 下载。下面提到的安装包是本机从源码生成的开发产物；全新 clone 需要先自行构建。

## 方式一：使用 NSIS 安装包

本机已经生成：

```text
target/release/bundle/nsis/OpenJobAgent_0.1.0_x64-setup.exe
```

双击并按向导安装即可。该文件是未签名的 Windows x64 开发构建，Windows SmartScreen 可能显示提醒。安装包包含桌面程序和 Native Host 可执行文件，但浏览器扩展仍需单独加载，并按后文注册到 Chrome/Edge。

## 方式二：使用 MSI 安装包

本机已经生成：

```text
target/release/bundle/msi/OpenJobAgent_0.1.0_x64_en-US.msi
```

可以双击安装，也可以从 PowerShell 调用 Windows Installer：

```powershell
msiexec /i ".\target\release\bundle\msi\OpenJobAgent_0.1.0_x64_en-US.msi"
```

MSI 同样是未签名的 Windows x64 开发构建。它与 NSIS 的应用功能相同，区别主要在安装格式和部署方式。

## 方式三：从源码运行开发版

### 前置条件

- Windows 10/11 x64
- Node.js 20.17 或更高版本
- pnpm 11.9.0（项目锁定版本）
- Rust stable，目标为 `x86_64-pc-windows-msvc`
- Visual Studio C++ Build Tools
- Microsoft Edge WebView2 Runtime
- Chrome 或 Edge（仅在使用扩展时需要）

先检查本机工具链：

```powershell
node --version
pnpm --version
rustc --version
cargo --version
```

如果还没有 pnpm，可以任选一种安装方式：

```powershell
# 推荐：通过 Corepack 使用项目指定版本
corepack enable
corepack prepare pnpm@11.9.0 --activate

# 备选：通过 npm 全局安装
npm install --global pnpm@11.9.0
```

安装依赖、验证仓库并启动桌面端：

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium  # 首次运行完整浏览器测试时需要
rustup component add rustfmt clippy     # 首次运行完整 Rust 检查时需要
pnpm check
pnpm tauri dev
```

`pnpm check` 会运行格式检查、ESLint、TypeScript、Vitest、Cargo 测试、Web 构建、Native Host smoke test、扩展加载测试、Playwright、rustfmt 和 Clippy。日常开发如果不想每次执行完整检查，也可以直接运行 `pnpm tauri dev`。

## 方式四：从源码构建安装包

完成前置工具安装和 `pnpm install --frozen-lockfile` 后执行：

```powershell
pnpm tauri build
```

输出位置：

```text
target/release/open-job-agent-desktop.exe
target/release/open-job-agent-native-host.exe
target/release/bundle/msi/
target/release/bundle/nsis/
```

Tauri 配置会同时生成 MSI 和 NSIS，并把 Native Host sidecar 放进安装包。目前没有代码签名流程。

## 安装 Chrome/Edge 扩展

桌面端和扩展是两个独立入口。仅安装桌面程序不会自动把开发版扩展加入浏览器。

1. 构建扩展：

   ```powershell
   pnpm --filter @openjobagent/extension build
   ```

2. 打开 `chrome://extensions` 或 `edge://extensions`。
3. 打开“开发者模式”，选择“加载已解压的扩展程序”。
4. 选择 `apps/extension/dist`。
5. 复制浏览器显示的扩展 ID。
6. 构建 release Native Host：

   ```powershell
   cargo build --release --bin open-job-agent-native-host
   ```

7. 在当前用户下注册 Native Host：

   ```powershell
   .\scripts\install-native-host.ps1 -ExtensionId '<extension-id>'
   ```

8. 打开桌面端的 **Memory Vault**，创建虚构示例 Vault。
9. 进入 **Codex & extension**，点击 **Generate pairing code**。
10. 打开浏览器侧边栏，把配对码粘贴到扩展中并点击 **Pair**。

默认 manifest 只会在 `localhost` 和 `127.0.0.1` 自动加载 content script。扩展声明了可选的 HTTP/HTTPS 站点权限，但当前版本没有完整的生产站点授权和适配流程；建议先使用 `packages/test-fixtures/forms/` 中的测试页面验证。

## 可选：配置 Codex

No-AI 模式不需要 Codex。需要检查或使用 Codex Provider 时，本机应安装 Codex CLI 并通过它自己的登录流程完成认证：

```powershell
codex.cmd --version
codex.cmd login status
codex.cmd login
```

OpenJobAgent 不读取 Codex 凭据文件，也不需要 OpenAI API Key。当前桌面端只提供状态检查；Codex Provider 的会话续接、取消和失败处理已经过单元测试，但完整的生成工作流尚未接入桌面页面。

## 怎么使用这个 App

### 1. 先认识桌面端

启动后，左侧会看到 11 个工作区。它们的完成度不同：

| 页面                  | 当前可以做什么                                   | 状态                                                     |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Opportunity inbox     | 查看 3 条虚构职位并按职位/公司名称搜索           | 示例数据；Run discovery 和筛选按钮尚未接真实逻辑         |
| Applications          | 查看本地/审批/外部状态占位信息                   | UI 壳                                                    |
| Application chat      | 查看工作区占位信息                               | UI 壳；澄清与会话逻辑在 package 中已有测试               |
| Memory Vault          | 创建一个位于系统临时目录的虚构示例 Vault         | 可用的演示入口；尚不能在 UI 中选择永久目录或导入真实简历 |
| Resumes               | 查看工作区占位信息                               | UI 壳；Markdown/TXT 导入能力仅在底层 package 中实现      |
| Profile & preferences | 查看工作区占位信息                               | UI 壳；事实 schema 和审批逻辑已实现                      |
| Gmail                 | 查看工作区占位信息                               | 只有 Mock connector；没有真实 OAuth                      |
| Scheduler             | 查看工作区占位信息                               | 调度器和注册脚本存在；桌面 UI 未接通                     |
| Codex & extension     | 检查 Codex 状态；为已创建的 Vault 生成扩展配对码 | 可用的设置入口                                           |
| Privacy & audit       | 查看示例状态卡片                                 | UI 壳；SQLite audit schema 已实现                        |
| Settings              | 查看工作区占位信息                               | UI 壳                                                    |

### 2. 创建示例 Memory Vault

进入 **Memory Vault**，点击 **Create fictional example Vault**。桌面端会在 Windows 临时目录创建一份带唯一 ID 的虚构 Vault，并显示路径。

这一步不会读取真实简历，也不会自动创建用户的长期个人资料目录。当前 UI 没有“选择已有 Vault”或“在 Documents 中创建永久 Vault”的文件选择器；`packages/memory-vault` 已有相应的数据层能力，但还没有接入桌面交互。

Vault 的设计结构包括：

```text
MEMORY.md                 索引、规则和未解决信息
vault.yaml                版本与默认简历
profile/                  已批准的结构化事实
experiences/ 和 stories/  可复用经历与故事
resumes/                  原件、解析草稿和生成版本
answer-bank/              已批准的复用答案
applications/             可携带的申请记录
imports/ 和 private/      导入记录与私有材料
```

只有 `verified` 和 `user_asserted` 状态的事实可以用于生成申请答案。推断内容和生成文本不能在没有明确批准的情况下写回为永久事实。

### 3. 配对浏览器扩展

先完成扩展安装，再在桌面端打开 **Codex & extension**。创建 Vault 后生成配对码，把它复制到扩展侧边栏。

配对码会用于 HMAC 鉴权。Native Host 还会核对扩展 ID、消息 schema、长度上限和允许的命令；扩展不能自行选择 Vault 路径，也不能让 Host 执行任意 shell 命令或打开任意路径。

### 4. 在测试表单中准备答案

打开受支持的页面后，点击浏览器工具栏中的 OpenJobAgent 图标：

1. 侧边栏扫描当前页可见的 `input`、`textarea` 和 `select`。
2. 每个字段会显示标签、类型、必填状态和敏感状态。
3. 对非敏感字段点击 **Prepare grounded answer**。
4. Native Host 从当前 Vault 的 `answer-bank/approved.json` 读取已批准答案。
5. 有答案时可以选择 **Copy** 或 **Fill this field**；证据 ID 会同时显示。
6. 没有足够证据时，扩展返回追问，不会编造答案。

性别、种族、残障、退伍军人、宗教、出生信息、SSN、国籍等字段被标记为 manual-only。通用表单路径不会点击最终 Submit。

## 已实现的底层能力

- **Memory Vault：** 创建、版本迁移、路径越界检查、Markdown/TXT 简历导入、SHA-256 摘要、事实审批和小范围检索。
- **Answer Engine：** 只使用已验证或用户声明的事实；支持长度限制、证据 ID、缺失信息追问，以及 `use_once`、`save_fact`、`save_story`、`cancel` 决策。
- **Job Engine：** 手动输入和 HTTPS RSS 抽象、URL 规范化、重复指纹、地点/远程/类型/公司/工作许可/薪资硬筛选，以及带重试的调度器。
- **Form Engine：** 字段识别、标签推断、选项读取、长度约束、敏感字段识别、单字段填入和通用提交保护。
- **Native Messaging：** 长度前缀协议、严格 schema、扩展 ID 与 HMAC 校验、1 MiB 上限和固定命令面。
- **Providers：** 确定性的 No-AI 模式，以及基于 Codex SDK 的线程开始、续接、取消和安全提示边界。
- **SQLite：** 职位、申请、表单快照、会话、聊天、草稿、Gmail 链接、调度运行、审计事件和 adapter health 的 schema/migration。
- **Gmail：** 搜索、分类、草稿、发送审批的接口和 Mock；没有真实账号连接。

## 数据与安全边界

- 网页内容和职位描述始终按不可信数据处理。
- Vault 保存可复用的个人事实；SQLite 保存运行状态；Windows Credential Manager 保存配对 secret 和未来 OAuth token。
- OpenJobAgent 不读取或复制 Codex 的认证文件。
- 扩展只填用户选中的单个安全字段，不执行通用自动提交。
- 当前构建不支持 CAPTCHA、MFA、反机器人绕过或访问控制规避。
- `examples/OpenJobAgentVault` 全部是虚构数据，不能替换成真实个人数据后提交到公开仓库。

## 根目录 Walkthrough

### 源码与文档目录

| 路径        | 用途                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `.github/`  | GitHub Actions CI；Windows 跑 TypeScript/Web/E2E，Windows 与 Linux 跑适用的 Rust 检查                   |
| `apps/`     | `desktop`（Tauri + React）、`extension`（Chrome/Edge MV3）、`native-host`（Rust Native Messaging Host） |
| `assets/`   | 项目级静态资源，目前包含应用图标 SVG                                                                    |
| `crates/`   | Rust 库：desktop core、Native Messaging 协议、SQLite/安全存储                                           |
| `docs/`     | 安装、架构、数据流、隐私、安全、限制、验证记录等详细文档                                                |
| `examples/` | 可公开使用的虚构 OpenJobAgentVault 示例                                                                 |
| `packages/` | TypeScript 领域包：shared、Vault、答案、职位、表单、Provider、集成和测试 fixture                        |
| `scripts/`  | sidecar 准备、Native Host 注册、smoke test、截图和计划任务脚本                                          |
| `tests/`    | Playwright 端到端测试                                                                                   |

### 根目录文件

| 文件                   | 用途                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `.gitignore`           | 忽略依赖、构建产物、测试报告、数据库、凭据、真实 Vault 和私密简历 |
| `.prettierignore`      | Prettier 不处理的路径                                             |
| `.prettierrc.json`     | Prettier 格式规则                                                 |
| `Cargo.toml`           | Rust workspace 与共享依赖配置                                     |
| `Cargo.lock`           | 锁定 Rust 依赖版本；应用仓库应提交                                |
| `package.json`         | 根脚本、开发依赖和 pnpm 版本声明                                  |
| `pnpm-workspace.yaml`  | pnpm workspace 成员范围                                           |
| `pnpm-lock.yaml`       | 锁定 Node 依赖版本；应提交                                        |
| `tsconfig.json`        | TypeScript 基础配置和 workspace path 映射                         |
| `eslint.config.js`     | ESLint flat config                                                |
| `vitest.config.ts`     | TypeScript 单元测试配置                                           |
| `playwright.config.ts` | 浏览器端到端测试配置                                              |
| `README.md`            | 项目入口、安装、用法、功能和仓库地图                              |
| `CONTRIBUTING.md`      | 贡献流程与本地检查要求                                            |
| `CODE_OF_CONDUCT.md`   | 社区行为准则                                                      |
| `LICENSE`              | MIT License                                                       |
| `PLAN.md`              | 初始里程碑与验收标准                                              |
| `PROGRESS.md`          | 当前完成情况、已运行测试、已知失败和下一步                        |

## `.gitignore` 和“根目录为什么这么乱”

仓库一直有 `.gitignore`，而且当前 Git 工作树是干净的。以下目录虽然会出现在文件管理器或编辑器中，但都已经被 Git 忽略：

```text
.pnpm-store/              pnpm 本地包缓存
node_modules/             根目录和各 workspace 的 Node 依赖
target/                   Cargo/Tauri 构建产物和安装包
apps/*/dist/              Vite/扩展构建结果
apps/desktop/src-tauri/binaries/  Tauri sidecar
apps/desktop/src-tauri/gen/       Tauri 生成文件
playwright-report/        Playwright HTML 报告
test-results/             测试截图、日志和临时 profile
```

`.gitignore` 的作用是防止这些内容进入 Git，不会从磁盘删除，也不会让编辑器自动隐藏它们。这个仓库又同时包含 Node、Rust、Tauri、浏览器扩展和 Playwright，所以一次完整构建会产生多个本地目录。

可以用下面两条命令区分“Git 里的文件”和“仅存在于本机的忽略文件”：

```powershell
git status --short
git status --short --ignored
```

删除本地依赖或构建缓存会导致下次构建重新下载或重新编译。清理前可以先用 `git clean -ndX` 预览所有将被删除的 ignored 文件；不要在未检查预览结果时执行删除命令。

## 常用命令

```powershell
pnpm tauri dev                 # 启动桌面开发版
pnpm build:web                 # 构建桌面 Web UI 和扩展
pnpm tauri build               # 构建 Windows 安装包
pnpm test:ts                   # TypeScript 单元测试
pnpm test:rust                 # Rust 测试
pnpm test:e2e                  # 浏览器表单端到端测试
pnpm test:native-host          # Native Host 进程级 smoke test
pnpm test:extension-load       # 扩展加载 smoke test
pnpm check                     # 完整验证
```

## 进一步阅读

- [完整安装说明](docs/INSTALLATION.md)
- [Windows 开发环境](docs/WINDOWS_DEVELOPMENT.md)
- [扩展安装](docs/EXTENSION_INSTALLATION.md)
- [当前限制](docs/LIMITATIONS.md)
- [验证记录](docs/VERIFICATION.md)
- [架构](docs/ARCHITECTURE.md)
- [Memory Vault](docs/MEMORY_VAULT.md)
- [隐私](docs/PRIVACY.md)与[安全](docs/SECURITY.md)

---

# English

## Project status

OpenJobAgent is a tested early-stage build, not a finished product with every external service connected.

- Ready to try: the desktop shell, a fictional example Memory Vault, a sample opportunity list, local search, Codex login-status checks, extension pairing, fixture-page field detection, and filling one field from an approved answer.
- Implemented in code and tests: the Vault format, Markdown/TXT resume import, fact approval, evidence retrieval, clarification decisions, opportunity normalization and hard filters, the SQLite schema, authenticated Native Messaging, No-AI/Codex provider interfaces, and a Gmail mock.
- Not connected yet: live opportunity sources, live Gmail OAuth, production ATS adapters, PDF/DOCX extraction, generic auto-submit, and full interactions for most desktop navigation areas.

For a product preview, install the desktop app and create the fictional Vault. Testing browser form assistance also requires the unpacked extension and registered Native Host.

## Installation options

| Goal                     | Method                                                   | Best for                                  |
| ------------------------ | -------------------------------------------------------- | ----------------------------------------- |
| Install the desktop app  | NSIS `setup.exe`                                         | Most Windows users                        |
| Deploy the desktop app   | MSI package                                              | MSI-based or managed deployment           |
| Run a development build  | `pnpm tauri dev`                                         | Frontend, Rust, and desktop contributors  |
| Build installers locally | `pnpm tauri build`                                       | Producing MSI and NSIS from this checkout |
| Assist with web forms    | Load the unpacked extension and register the Native Host | Chrome/Edge side-panel use                |

There is no signed public Release download yet. The installer paths below refer to development artifacts built on this machine; a fresh clone must build them first.

## Option 1: NSIS installer

The current local build produced:

```text
target/release/bundle/nsis/OpenJobAgent_0.1.0_x64-setup.exe
```

Open it and follow the installer. This is an unsigned Windows x64 development build, so Windows SmartScreen may show a warning. The installer contains the desktop executable and Native Host sidecar. The development extension must still be loaded and registered separately.

## Option 2: MSI installer

The current local build produced:

```text
target/release/bundle/msi/OpenJobAgent_0.1.0_x64_en-US.msi
```

Open it directly or use Windows Installer from PowerShell:

```powershell
msiexec /i ".\target\release\bundle\msi\OpenJobAgent_0.1.0_x64_en-US.msi"
```

The MSI is also an unsigned Windows x64 development build. It provides the same app as NSIS; the main difference is the installation and deployment format.

## Option 3: run from source

### Prerequisites

- Windows 10/11 x64
- Node.js 20.17 or newer
- pnpm 11.9.0, as pinned by the project
- Rust stable with the `x86_64-pc-windows-msvc` target
- Visual Studio C++ Build Tools
- Microsoft Edge WebView2 Runtime
- Chrome or Edge when using the extension

Check the toolchain:

```powershell
node --version
pnpm --version
rustc --version
cargo --version
```

If pnpm is not installed, use either method:

```powershell
# Recommended: use the project version through Corepack
corepack enable
corepack prepare pnpm@11.9.0 --activate

# Alternative: install it globally with npm
npm install --global pnpm@11.9.0
```

Install dependencies, verify the checkout, and start the desktop app:

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium  # Needed before the first full browser test
rustup component add rustfmt clippy     # Needed before the first full Rust check
pnpm check
pnpm tauri dev
```

`pnpm check` runs formatting, ESLint, TypeScript, Vitest, Cargo tests, web builds, Native Host and extension smoke tests, Playwright, rustfmt, and Clippy. During normal development, `pnpm tauri dev` can be run without repeating the full suite each time.

## Option 4: build installers from source

After installing the prerequisites and running `pnpm install --frozen-lockfile`:

```powershell
pnpm tauri build
```

Outputs are written to:

```text
target/release/open-job-agent-desktop.exe
target/release/open-job-agent-native-host.exe
target/release/bundle/msi/
target/release/bundle/nsis/
```

Tauri builds both MSI and NSIS packages and includes the Native Host sidecar. Code signing is not configured.

## Install the Chrome/Edge extension

The desktop app and browser extension are separate entry points. Installing the desktop app does not add the unpacked development extension to a browser.

1. Build the extension:

   ```powershell
   pnpm --filter @openjobagent/extension build
   ```

2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode and choose **Load unpacked**.
4. Select `apps/extension/dist`.
5. Copy the extension ID shown by the browser.
6. Build the release Native Host:

   ```powershell
   cargo build --release --bin open-job-agent-native-host
   ```

7. Register the Native Host for the current Windows user:

   ```powershell
   .\scripts\install-native-host.ps1 -ExtensionId '<extension-id>'
   ```

8. In the desktop app, open **Memory Vault** and create the fictional example Vault.
9. Open **Codex & extension** and select **Generate pairing code**.
10. Paste the code into the side panel and select **Pair**.

The default manifest automatically injects the content script only on `localhost` and `127.0.0.1`. Optional HTTP/HTTPS permissions are declared, but the current build has no complete production-site permission and adapter flow. Start with the fixtures in `packages/test-fixtures/forms/`.

## Optional Codex setup

No-AI mode does not need Codex. To check or use the Codex provider, install the Codex CLI and authenticate through its own supported login flow:

```powershell
codex.cmd --version
codex.cmd login status
codex.cmd login
```

OpenJobAgent does not read Codex credential files and does not require an OpenAI API key. The desktop currently exposes only the status check. Provider thread continuation, cancellation, and failure handling are unit-tested, but the full generation workflow is not wired into the desktop UI.

## How to use the app

### 1. Understand the desktop areas

The sidebar contains 11 work areas with different completion levels:

| Area                  | What it does now                                                      | Status                                                                           |
| --------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Opportunity inbox     | Shows three fictional opportunities and searches title/company text   | Sample data; discovery and filter buttons are not wired to live logic            |
| Applications          | Shows local/approval/external placeholder states                      | UI shell                                                                         |
| Application chat      | Shows workspace placeholder content                                   | UI shell; session and clarification logic exists in tested packages              |
| Memory Vault          | Creates a fictional Vault under the system temporary directory        | Working demo entry; no permanent location picker or real resume import in the UI |
| Resumes               | Shows workspace placeholder content                                   | UI shell; Markdown/TXT import exists only in the underlying package              |
| Profile & preferences | Shows workspace placeholder content                                   | UI shell; schemas and fact approval exist in code                                |
| Gmail                 | Shows workspace placeholder content                                   | Mock connector only; no live OAuth                                               |
| Scheduler             | Shows workspace placeholder content                                   | Scheduler and registration script exist; UI is not connected                     |
| Codex & extension     | Checks Codex status and generates a pairing code for the active Vault | Working setup entry                                                              |
| Privacy & audit       | Shows example status cards                                            | UI shell; the SQLite audit schema exists                                         |
| Settings              | Shows workspace placeholder content                                   | UI shell                                                                         |

### 2. Create the example Memory Vault

Open **Memory Vault** and select **Create fictional example Vault**. The desktop app creates a uniquely named fictional Vault in the Windows temporary directory and displays its path.

This does not read a real resume or silently create a long-term profile folder. The current UI has no picker for an existing Vault and no flow for creating a permanent Vault under Documents. `packages/memory-vault` contains the underlying data operations, but they are not connected to desktop controls yet.

The Vault format includes:

```text
MEMORY.md                 Index, rules, and unresolved information
vault.yaml                Version and default resume
profile/                  Approved structured facts
experiences/ and stories/ Reusable evidence narratives
resumes/                  Originals, parsed drafts, and generated variants
answer-bank/              Approved reusable answers
applications/             Portable application records
imports/ and private/     Import records and private material
```

Only facts marked `verified` or `user_asserted` may ground an application answer. Inferences and generated text cannot become permanent facts without explicit approval.

### 3. Pair the extension

Install the extension first, then open **Codex & extension** in the desktop app. After creating a Vault, generate a pairing code and paste it into the side panel.

The code is used for HMAC authentication. The Native Host also validates the extension ID, message schema, size limit, and allowlisted command. The extension cannot choose a Vault path or ask the Host to execute arbitrary shell commands or paths.

### 4. Prepare an answer on a fixture form

On a supported page, select the OpenJobAgent browser action:

1. The side panel scans visible `input`, `textarea`, and `select` elements.
2. Each item shows its label, type, required state, and sensitivity status.
3. Select **Prepare grounded answer** for a non-sensitive field.
4. The Native Host reads approved wording from `answer-bank/approved.json` in the configured Vault.
5. If an answer exists, choose **Copy** or **Fill this field**; evidence IDs are shown with it.
6. If evidence is missing, the extension asks a follow-up question instead of inventing an answer.

Fields about gender, race, ethnicity, disability, veteran status, religion, birth details, SSNs, or nationality are manual-only. The generic form path never clicks final Submit.

## Implemented foundations

- **Memory Vault:** creation, version migration, path-boundary checks, Markdown/TXT resume import, SHA-256 digests, fact approval, and targeted retrieval.
- **Answer Engine:** verified/user-asserted evidence only, length limits, evidence IDs, missing-information questions, and `use_once`, `save_fact`, `save_story`, or `cancel` decisions.
- **Job Engine:** manual and HTTPS RSS source abstractions, URL normalization, duplicate fingerprints, hard filters, and a retrying scheduler.
- **Form Engine:** field and label detection, option and length constraints, sensitive-field detection, one-field filling, and generic submit protection.
- **Native Messaging:** length-prefixed frames, strict schemas, extension-ID/HMAC checks, a 1 MiB limit, and a fixed command surface.
- **Providers:** deterministic No-AI mode plus Codex SDK thread start, continuation, cancellation, and prompt-boundary handling.
- **SQLite:** schemas and migrations for opportunities, applications, snapshots, sessions, chat, drafts, Gmail links, scheduler runs, audit events, and adapter health.
- **Gmail:** search, classification, drafting, and send-approval interfaces with a mock; no live account connection.

## Data and safety boundaries

- Page content and job descriptions are always treated as untrusted data.
- The Vault owns reusable personal facts; SQLite owns operational state; Windows Credential Manager owns pairing secrets and future OAuth tokens.
- OpenJobAgent never reads or copies Codex authentication files.
- The extension fills only a user-selected safe field and does not perform generic auto-submit.
- CAPTCHA, MFA, anti-bot bypasses, and access-control workarounds are out of scope.
- `examples/OpenJobAgentVault` contains fictional data only. Do not replace it with real personal data in a public commit.

## Repository walkthrough

### Source and documentation directories

| Path        | Purpose                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `.github/`  | GitHub Actions CI for Windows TypeScript/Web/E2E and applicable Rust checks on Windows/Linux                         |
| `apps/`     | `desktop` (Tauri + React), `extension` (Chrome/Edge MV3), and `native-host` (Rust Native Messaging Host)             |
| `assets/`   | Project-level static assets, currently the SVG app icon                                                              |
| `crates/`   | Rust libraries for desktop core, Native Messaging, SQLite, and secure storage                                        |
| `docs/`     | Installation, architecture, data flow, privacy, security, limitations, and verification records                      |
| `examples/` | Public fictional OpenJobAgentVault data                                                                              |
| `packages/` | TypeScript domain packages for shared contracts, Vaults, answers, jobs, forms, providers, integrations, and fixtures |
| `scripts/`  | Sidecar preparation, Native Host registration, smoke tests, screenshots, and scheduled-task setup                    |
| `tests/`    | Playwright end-to-end tests                                                                                          |

### Root files

| File                   | Purpose                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `.gitignore`           | Excludes dependencies, build outputs, test reports, databases, credentials, real Vaults, and private resumes |
| `.prettierignore`      | Paths excluded from Prettier                                                                                 |
| `.prettierrc.json`     | Prettier rules                                                                                               |
| `Cargo.toml`           | Rust workspace and shared dependency configuration                                                           |
| `Cargo.lock`           | Locked Rust dependency graph; committed for this application                                                 |
| `package.json`         | Root scripts, development dependencies, and pinned pnpm version                                              |
| `pnpm-workspace.yaml`  | pnpm workspace membership                                                                                    |
| `pnpm-lock.yaml`       | Locked Node dependency graph                                                                                 |
| `tsconfig.json`        | Base TypeScript settings and workspace path mappings                                                         |
| `eslint.config.js`     | ESLint flat configuration                                                                                    |
| `vitest.config.ts`     | TypeScript unit-test configuration                                                                           |
| `playwright.config.ts` | Browser end-to-end test configuration                                                                        |
| `README.md`            | Project entry point, installation, usage, features, and repository map                                       |
| `CONTRIBUTING.md`      | Contribution and local-check requirements                                                                    |
| `CODE_OF_CONDUCT.md`   | Community conduct policy                                                                                     |
| `LICENSE`              | MIT License                                                                                                  |
| `PLAN.md`              | Initial milestones and acceptance criteria                                                                   |
| `PROGRESS.md`          | Current completion, test evidence, known failures, and next work                                             |

## `.gitignore` and the busy root directory

The repository already has a `.gitignore`, and the current Git worktree is clean. These directories appear in Explorer or an editor but are correctly ignored by Git:

```text
.pnpm-store/              Local pnpm package store
node_modules/             Root and workspace Node dependencies
target/                   Cargo/Tauri outputs and installers
apps/*/dist/              Vite and extension builds
apps/desktop/src-tauri/binaries/  Tauri sidecar output
apps/desktop/src-tauri/gen/       Tauri-generated files
playwright-report/        Playwright HTML report
test-results/             Test screenshots, logs, and temporary profiles
```

`.gitignore` prevents files from being tracked; it does not delete or hide them on disk. This repository combines Node, Rust, Tauri, a browser extension, and Playwright, so a full build creates several local output trees.

Use these commands to distinguish tracked changes from ignored local output:

```powershell
git status --short
git status --short --ignored
```

Removing local dependencies or build caches makes the next build download or compile them again. `git clean -ndX` previews ignored files that a clean operation would remove; do not run a destructive clean without reviewing that preview.

## Common commands

```powershell
pnpm tauri dev                 # Start the desktop development build
pnpm build:web                 # Build the desktop web UI and extension
pnpm tauri build               # Build Windows installers
pnpm test:ts                   # TypeScript unit tests
pnpm test:rust                 # Rust tests
pnpm test:e2e                  # Browser form end-to-end tests
pnpm test:native-host          # Process-level Native Host smoke test
pnpm test:extension-load       # Extension-load smoke test
pnpm check                     # Full verification suite
```

## Further reading

- [Installation](docs/INSTALLATION.md)
- [Windows development](docs/WINDOWS_DEVELOPMENT.md)
- [Extension setup](docs/EXTENSION_INSTALLATION.md)
- [Current limitations](docs/LIMITATIONS.md)
- [Verification record](docs/VERIFICATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Memory Vault](docs/MEMORY_VAULT.md)
- [Privacy](docs/PRIVACY.md) and [Security](docs/SECURITY.md)

## License and contributing

OpenJobAgent is released under the [MIT License](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md) before sending changes; participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
