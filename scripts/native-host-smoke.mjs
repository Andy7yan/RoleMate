import { createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const extensionId = "development-extension-id";
const secret = "fictional-test-secret";
const auth = createHmac("sha256", secret).update(extensionId).digest("hex");
const request = Buffer.from(
  JSON.stringify({
    type: "prepare_answer",
    requestId: "smoke-1",
    extensionId,
    auth,
    question: {
      text: "Are you authorised to work in Australia?",
      fieldType: "text",
      required: true,
    },
  }),
);
const frame = Buffer.alloc(4 + request.length);
frame.writeUInt32LE(request.length, 0);
request.copy(frame, 4);
const executable = resolve("target/debug/open-job-agent-native-host.exe");
const child = spawn(executable, [], {
  env: {
    ...process.env,
    OPENJOBAGENT_EXTENSION_ID: extensionId,
    OPENJOBAGENT_NATIVE_SECRET: secret,
    OPENJOBAGENT_VAULT_PATH: resolve("examples/OpenJobAgentVault"),
  },
  stdio: ["pipe", "pipe", "inherit"],
  windowsHide: true,
});
const chunks = [];
child.stdout.on("data", (chunk) => chunks.push(chunk));
child.stdin.end(frame);
const exitCode = await new Promise((resolveExit, reject) => {
  child.on("error", reject);
  child.on("close", resolveExit);
});
if (exitCode !== 0) throw new Error(`Native host exited with ${exitCode}`);
const output = Buffer.concat(chunks);
if (output.length < 4) throw new Error("Native host returned no framed response");
const length = output.readUInt32LE(0);
const response = JSON.parse(output.subarray(4, 4 + length).toString("utf8"));
if (!response.ok || response.answer?.status !== "ready" || response.answer?.answer !== "Yes")
  throw new Error(`Unexpected native response: ${JSON.stringify(response)}`);
console.log(
  JSON.stringify(
    {
      flow: "extension-frame -> authenticated-native-host -> grounded-answer",
      status: "passed",
      response,
    },
    null,
    2,
  ),
);
