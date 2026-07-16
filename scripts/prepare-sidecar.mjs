import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

if (process.platform !== "win32") {
  throw new Error("The packaged native host currently supports Windows only");
}
const root = resolve(import.meta.dirname, "..");
const cargo = spawnSync("cargo", ["build", "--release", "--bin", "open-job-agent-native-host"], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});
if (cargo.status !== 0) throw new Error(`Native host release build exited with ${cargo.status}`);
const triple = process.env.TAURI_ENV_TARGET_TRIPLE ?? "x86_64-pc-windows-msvc";
const destinationDirectory = resolve(root, "apps/desktop/src-tauri/binaries");
await mkdir(destinationDirectory, { recursive: true });
await copyFile(
  resolve(root, "target/release/open-job-agent-native-host.exe"),
  resolve(destinationDirectory, `open-job-agent-native-host-${triple}.exe`),
);
console.log(`Prepared native host sidecar for ${triple}`);
