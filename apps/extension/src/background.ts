import { nativeRequestSchema } from "@openjobagent/shared";
import type { ExtensionMessage } from "./messages";

const HOST = "dev.openjobagent.native";
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) void chrome.sidePanel.open({ windowId: tab.windowId });
});

async function authToken(extensionId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(extensionId));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type !== "prepare_answer") return false;
  void (async () => {
    try {
      const stored = await chrome.storage.local.get(["pairingSecret", "extensionId"]);
      if (!stored.pairingSecret) throw new Error("Pair the extension with the desktop app first");
      const extensionId = stored.extensionId ?? chrome.runtime.id;
      const request = nativeRequestSchema.parse({
        type: "prepare_answer",
        requestId: crypto.randomUUID(),
        extensionId,
        auth: await authToken(extensionId, stored.pairingSecret),
        question: message.field,
      });
      const response = await chrome.runtime.sendNativeMessage(HOST, request);
      sendResponse({
        type: "answer_result",
        field: message.field,
        answer: response.answer,
      } satisfies ExtensionMessage);
    } catch (error) {
      sendResponse({
        type: "connection_error",
        error: error instanceof Error ? error.message : String(error),
      } satisfies ExtensionMessage);
    }
  })();
  return true;
});
