import { extractVisibleFields, fillField, pageMetadata } from "@openjobagent/form-engine";
import type { ExtensionMessage } from "./messages";

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "scan_page") {
    sendResponse({
      type: "page_fields",
      fields: extractVisibleFields(document),
      metadata: pageMetadata(document, location.href),
    } satisfies ExtensionMessage);
  }
  if (message.type === "fill_field")
    sendResponse({ filled: fillField(document, message.field, message.answer) });
  return true;
});
