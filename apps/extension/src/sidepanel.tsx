import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { DetectedField } from "@openjobagent/form-engine";
import type { GroundedAnswer } from "@openjobagent/shared";
import type { ExtensionMessage } from "./messages";
import "./sidepanel.css";

type Result = { field: DetectedField; answer: GroundedAnswer };
// This file is the extension entrypoint as well as its only React component.
// eslint-disable-next-line react-refresh/only-export-components
function Panel() {
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [error, setError] = useState("");
  const [secret, setSecret] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!active?.id) throw new Error("No active tab");
        const response = (await chrome.tabs.sendMessage(active.id, {
          type: "scan_page",
        } satisfies ExtensionMessage)) as ExtensionMessage;
        if (response.type === "page_fields") setFields(response.fields);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    })();
  }, []);
  async function tab() {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!active?.id) throw new Error("No active tab");
    return active.id;
  }
  async function scan() {
    try {
      setError("");
      const response = (await chrome.tabs.sendMessage(await tab(), {
        type: "scan_page",
      } satisfies ExtensionMessage)) as ExtensionMessage;
      if (response.type === "page_fields") setFields(response.fields);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  async function prepare(field: DetectedField) {
    const response = (await chrome.runtime.sendMessage({
      type: "prepare_answer",
      field,
    } satisfies ExtensionMessage)) as ExtensionMessage;
    if (response.type === "answer_result")
      setResults((current) => ({
        ...current,
        [field.id ?? field.selector]: { field, answer: response.answer },
      }));
    else if (response.type === "connection_error") setError(response.error);
  }
  async function fill(result: Result) {
    await chrome.tabs.sendMessage(await tab(), {
      type: "fill_field",
      ...result,
    } satisfies ExtensionMessage);
  }
  async function pair() {
    await chrome.storage.local.set({ pairingSecret: secret, extensionId: chrome.runtime.id });
    setSecret("");
    setError("");
  }
  return (
    <main>
      <header>
        <div className="mark">O</div>
        <div>
          <h1>OpenJobAgent</h1>
          <p>Evidence-first form assistant</p>
        </div>
        <span>LOCAL</span>
      </header>
      <section className="pair">
        <input
          type="password"
          aria-label="Pairing code"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder="Desktop pairing code"
        />
        <button onClick={pair}>Pair</button>
      </section>
      <section className="title">
        <div>
          <p>VISIBLE QUESTIONS</p>
          <h2>{fields.length} fields detected</h2>
        </div>
        <button onClick={scan}>Rescan</button>
      </section>
      {error && <div className="error">{error}</div>}
      <section className="fields">
        {fields.map((field) => {
          const result = results[field.id ?? field.selector];
          return (
            <article key={field.selector} className={field.sensitive ? "sensitive" : ""}>
              <p>
                {field.text}
                <b>{field.required ? "Required" : "Optional"}</b>
              </p>
              <small>
                {field.fieldType}
                {field.sensitive ? " · Manual only" : ""}
              </small>
              {result ? (
                <div className="answer">
                  <strong>{result.answer.status.replaceAll("_", " ")}</strong>
                  <p>{result.answer.answer ?? result.answer.followUpQuestions[0]}</p>
                  <small>Evidence: {result.answer.evidenceFactIds.join(", ") || "none"}</small>
                  {result.answer.status === "ready" && (
                    <div className="actions">
                      <button
                        onClick={() => navigator.clipboard.writeText(result.answer.answer ?? "")}
                      >
                        Copy
                      </button>
                      <button onClick={() => fill(result)}>Fill this field</button>
                    </div>
                  )}
                </div>
              ) : (
                <button disabled={field.sensitive} onClick={() => prepare(field)}>
                  Prepare grounded answer
                </button>
              )}
            </article>
          );
        })}
      </section>
      <footer>OpenJobAgent never clicks final submit on generic forms.</footer>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Panel />);
