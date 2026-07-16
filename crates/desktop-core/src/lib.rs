use anyhow::{Context, Result};
use rusqlite::{Connection, params};
use std::{fs, path::Path};

const MIGRATIONS: &[&str] = &[
    r#"CREATE TABLE opportunities(id TEXT PRIMARY KEY, canonical_url TEXT NOT NULL, fingerprint TEXT NOT NULL UNIQUE, payload TEXT NOT NULL, discovered_at TEXT NOT NULL);
CREATE TABLE applications(id TEXT PRIMARY KEY, opportunity_id TEXT, status TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE form_snapshots(id TEXT PRIMARY KEY, application_id TEXT, payload TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE application_sessions(id TEXT PRIMARY KEY, application_id TEXT NOT NULL, provider_thread_id TEXT, created_at TEXT NOT NULL);
CREATE TABLE chat_messages(id TEXT PRIMARY KEY, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE answer_drafts(id TEXT PRIMARY KEY, session_id TEXT NOT NULL, payload TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0);
CREATE TABLE gmail_message_links(message_id TEXT PRIMARY KEY, application_id TEXT NOT NULL, category TEXT NOT NULL);
CREATE TABLE scheduler_runs(id TEXT PRIMARY KEY, task TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, error TEXT);
CREATE TABLE audit_events(id TEXT PRIMARY KEY, category TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE adapter_health(adapter TEXT PRIMARY KEY, status TEXT NOT NULL, checked_at TEXT NOT NULL, detail TEXT);"#,
];

pub struct Database {
    connection: Connection,
}
impl Database {
    pub fn open(path: &Path) -> Result<Self> {
        let connection = Connection::open(path)
            .with_context(|| format!("open SQLite database {}", path.display()))?;
        connection.pragma_update(None, "foreign_keys", "ON")?;
        connection.execute("CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)", [])?;
        for (index, sql) in MIGRATIONS.iter().enumerate() {
            let version = (index + 1) as u32;
            let exists: bool = connection.query_row(
                "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = ?1)",
                [version],
                |row| row.get(0),
            )?;
            if !exists {
                let transaction = connection.unchecked_transaction()?;
                transaction.execute_batch(sql)?;
                transaction.execute("INSERT INTO schema_migrations(version, applied_at) VALUES (?1, datetime('now'))", [version])?;
                transaction.commit()?;
            }
        }
        Ok(Self { connection })
    }
    pub fn schema_version(&self) -> u32 {
        self.connection
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0)
    }
    pub fn record_audit(&self, category: &str, detail: &str) -> Result<String> {
        let id = uuid::Uuid::new_v4().to_string();
        self.connection.execute("INSERT INTO audit_events(id, category, detail, created_at) VALUES (?1, ?2, ?3, datetime('now'))", params![id, category, detail])?;
        Ok(id)
    }
}

pub fn create_example_vault(root: &Path) -> Result<()> {
    if root.exists() {
        anyhow::bail!("Vault destination already exists");
    }
    for directory in [
        "profile",
        "experiences",
        "stories",
        "resumes/original",
        "resumes/parsed",
        "resumes/generated",
        "answer-bank",
        "applications",
        "imports",
        "private",
    ] {
        fs::create_dir_all(root.join(directory))?;
    }
    fs::write(
        root.join("vault.yaml"),
        "version: 1\ndefault_resume: fictional-resume\n",
    )?;
    fs::write(
        root.join("MEMORY.md"),
        "# Example Memory Vault\n\nFictional demonstration data only.\n\n- [Approved facts](profile/facts.yaml)\n- [Education](profile/education.md)\n\nOnly verified and user-asserted facts may ground answers.\n",
    )?;
    fs::write(
        root.join("profile/facts.yaml"),
        r#"facts:
  - id: fact.education.degree
    value: Bachelor of Computer Science
    status: verified
    source:
      type: user_confirmed
      reference: profile/education.md
    updated_at: 2026-01-01
    allowed_uses:
      - job_application
      - cover_letter
    sensitivity: personal
  - id: fact.skills.programming
    value:
      - TypeScript
      - Rust
    status: user_asserted
    source:
      type: user_confirmed
      reference: profile/skills.yaml
    updated_at: 2026-01-01
    allowed_uses:
      - job_application
    sensitivity: personal
"#,
    )?;
    fs::write(
        root.join("profile/education.md"),
        "# Education\n\nFictional University — Bachelor of Computer Science (fictional example).\n",
    )?;
    fs::write(
        root.join("profile/skills.yaml"),
        "skills:\n  - TypeScript\n  - Rust\n",
    )?;
    fs::write(
        root.join("answer-bank/approved.json"),
        "{\n  \"are you authorised to work in australia?\": \"Yes\"\n}\n",
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn runs_sqlite_migrations_once() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("state.db");
        assert_eq!(Database::open(&path).unwrap().schema_version(), 1);
        assert_eq!(Database::open(&path).unwrap().schema_version(), 1);
    }
    #[test]
    fn creates_fictional_vault_without_overwriting() {
        let directory = tempfile::tempdir().unwrap();
        let root = directory.path().join("vault");
        create_example_vault(&root).unwrap();
        assert!(root.join("MEMORY.md").exists());
        assert!(create_example_vault(&root).is_err());
    }
}
