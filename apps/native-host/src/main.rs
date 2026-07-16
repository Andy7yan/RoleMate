use anyhow::{Context, Result};
use native_messaging::{
    ErrorPayload, Request, Response, authenticate, dispatch, read_message, write_message,
};
use secure_storage::{OsSecretStore, SecretStore};
use std::{collections::HashMap, env, fs, io, path::PathBuf};

fn load_answer_bank(store: &dyn SecretStore) -> Result<HashMap<String, String>> {
    let vault_path = env::var("OPENJOBAGENT_VAULT_PATH")
        .ok()
        .or_else(|| store.get("vault-path").ok())
        .context("Memory Vault is not configured")?;
    let vault = PathBuf::from(vault_path)
        .canonicalize()
        .context("Memory Vault does not exist")?;
    let canonical_bank = vault
        .join("answer-bank")
        .join("approved.json")
        .canonicalize()
        .context("approved Answer Bank does not exist")?;
    if !canonical_bank.starts_with(&vault) {
        anyhow::bail!("Answer Bank escapes Memory Vault");
    }
    serde_json::from_slice(&fs::read(canonical_bank)?).context("parse approved Answer Bank")
}

fn main() -> Result<()> {
    let extension_id =
        env::var("OPENJOBAGENT_EXTENSION_ID").unwrap_or_else(|_| "development-extension-id".into());
    let store = OsSecretStore::new("OpenJobAgent");
    let secret = env::var("OPENJOBAGENT_NATIVE_SECRET")
        .ok()
        .or_else(|| store.get("native-messaging").ok())
        .context("native pairing secret is not configured")?;
    let bank = load_answer_bank(&store)?;
    let (mut input, mut output) = (io::stdin().lock(), io::stdout().lock());
    loop {
        let request = match read_message(&mut input) {
            Ok(value) => value,
            Err(native_messaging::ProtocolError::Truncated) => return Ok(()),
            Err(error) => {
                let response = Response {
                    request_id: "invalid".into(),
                    ok: false,
                    payload: ErrorPayload {
                        error: error.to_string(),
                    },
                };
                write_message(&mut output, &response)?;
                continue;
            }
        };
        let request_id = match &request {
            Request::Hello { request_id, .. } | Request::PrepareAnswer { request_id, .. } => {
                request_id.clone()
            }
        };
        if let Err(error) = authenticate(&request, &extension_id, &secret) {
            let response = Response {
                request_id,
                ok: false,
                payload: ErrorPayload {
                    error: error.to_string(),
                },
            };
            write_message(&mut output, &response)?;
            continue;
        }
        write_message(&mut output, &dispatch(request, &bank))?;
    }
}
