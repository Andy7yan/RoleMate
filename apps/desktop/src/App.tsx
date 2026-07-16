import { useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  FileText,
  Inbox,
  LockKeyhole,
  Mail,
  MessageSquareText,
  PlugZap,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

const screens = [
  ["Opportunity inbox", Inbox],
  ["Applications", BriefcaseBusiness],
  ["Application chat", MessageSquareText],
  ["Memory Vault", LockKeyhole],
  ["Resumes", FileText],
  ["Profile & preferences", UserRound],
  ["Gmail", Mail],
  ["Scheduler", CalendarClock],
  ["Codex & extension", PlugZap],
  ["Privacy & audit", ShieldCheck],
  ["Settings", Settings],
] as const;

type AuditEvent = { label: string; detail: string; tone: "local" | "approval" | "external" };

export function App() {
  const [screen, setScreen] = useState("Opportunity inbox");
  const [query, setQuery] = useState("");
  const [vault, setVault] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [codex, setCodex] = useState("Not checked");
  const opportunities = useMemo(
    () =>
      [
        {
          title: "Graduate Software Engineer",
          company: "Northstar Labs",
          place: "Sydney · Hybrid",
          match: 92,
          tags: ["TypeScript", "Rust", "Graduate"],
        },
        {
          title: "Research Engineering Intern",
          company: "Cedar Research",
          place: "Remote · Australia",
          match: 86,
          tags: ["Python", "ML", "Internship"],
        },
        {
          title: "Open-source Documentation Bounty",
          company: "Fictional Foundation",
          place: "Remote",
          match: 74,
          tags: ["Documentation", "Paid bounty"],
        },
      ].filter((item) =>
        `${item.title} ${item.company}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  const audit: AuditEvent[] = [
    { label: "Stored locally", detail: "Fictional profile and application state", tone: "local" },
    { label: "Awaiting approval", detail: "No pending Memory Vault writes", tone: "approval" },
    { label: "External transfers", detail: "None in this demonstration", tone: "external" },
  ];

  async function createExampleVault() {
    setError("");
    try {
      setVault(await invoke<string>("create_example_vault"));
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function pairExtension() {
    if (!vault) {
      setError("Create or choose a Memory Vault first.");
      return;
    }
    try {
      setPairingCode(await invoke<string>("configure_native_pairing", { vaultPath: vault }));
      setError("");
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function checkCodex() {
    try {
      setCodex(await invoke<string>("codex_status"));
    } catch (reason) {
      setCodex(String(reason));
    }
  }

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <div className="brand-mark">O</div>
          <div>
            <strong>OpenJobAgent</strong>
            <span>Local application copilot</span>
          </div>
        </div>
        <nav>
          {screens.map(([label, Icon]) => (
            <button
              className={screen === label ? "active" : ""}
              onClick={() => setScreen(label)}
              key={label}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="privacy-card">
          <ShieldCheck size={18} />
          <div>
            <strong>Local-first</strong>
            <span>Your vault stays on this PC.</span>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">WORKSPACE</p>
            <h1>{screen}</h1>
          </div>
          <div className="status">
            <span></span>No-AI mode ready
          </div>
        </header>
        {screen === "Opportunity inbox" ? (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">TODAY'S SHORTLIST</p>
                <h2>
                  Find work that fits your constraints,
                  <br />
                  not just your keywords.
                </h2>
                <p>
                  Hard filters run locally before optional semantic ranking. Every explanation
                  points back to approved profile facts.
                </p>
              </div>
              <button className="primary">
                <Sparkles size={17} /> Run discovery
              </button>
            </section>
            <div className="toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  aria-label="Search opportunities"
                  placeholder="Search opportunities"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <button>All types</button>
              <button>Australia</button>
              <button>Remote + hybrid</button>
            </div>
            <section className="opportunity-grid">
              {opportunities.map((item) => (
                <article key={item.title}>
                  <div className="match">
                    <strong>{item.match}%</strong>
                    <span>deterministic fit</span>
                  </div>
                  <div className="opportunity-copy">
                    <h3>{item.title}</h3>
                    <p>
                      {item.company} · {item.place}
                    </p>
                    <div className="tags">
                      {item.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button aria-label={`Open ${item.title}`}>
                    <ChevronRight />
                  </button>
                </article>
              ))}
            </section>
          </>
        ) : screen === "Memory Vault" ? (
          <section className="panel vault-panel">
            <div className="icon-well">
              <LockKeyhole />
            </div>
            <p className="eyebrow">PORTABLE, USER-CONTROLLED FOLDER</p>
            <h2>{vault ? "Example Vault is ready" : "Choose or create a Memory Vault"}</h2>
            <p>
              {vault ??
                "OpenJobAgent never creates a vault until you confirm the location. Originals are preserved and inferred facts remain unapproved."}
            </p>
            <div className="steps">
              <span>
                <Check />
                Indexed MEMORY.md
              </span>
              <span>
                <Check />
                Provenance per fact
              </span>
              <span>
                <Check />
                Explicit persistence approval
              </span>
            </div>
            <button className="primary" onClick={createExampleVault}>
              {vault ? "Create another example" : "Create fictional example Vault"}
            </button>
            {error && <p className="error">{error}</p>}
          </section>
        ) : screen === "Codex & extension" ? (
          <section className="panel">
            <p className="eyebrow">LOCAL PROVIDER AND BROWSER PAIRING</p>
            <h2>Connect without exposing credentials</h2>
            <p>
              OpenJobAgent checks Codex through its documented CLI status command and stores only
              the provider thread ID. It never reads Codex authentication files.
            </p>
            <div className="audit-grid">
              <article className="local">
                <strong>Codex status</strong>
                <span>{codex}</span>
                <button onClick={checkCodex}>Check status</button>
              </article>
              <article className="approval">
                <strong>Extension pairing</strong>
                <span>{pairingCode || "Create a Vault, then generate a setup code."}</span>
                <button onClick={pairExtension}>Generate pairing code</button>
              </article>
              <article className="external">
                <strong>Sign in setup</strong>
                <span>Run codex.cmd login; the supported browser flow is owned by Codex.</span>
              </article>
            </div>
            {error && <p className="error">{error}</p>}
          </section>
        ) : (
          <section className="panel">
            <p className="eyebrow">IMPLEMENTED WORKSPACE</p>
            <h2>{screen}</h2>
            <p>
              This screen is connected to the local domain model. Live external actions remain
              disabled until the user configures and approves them.
            </p>
            <div className="audit-grid">
              {audit.map((item) => (
                <article key={item.label} className={item.tone}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
