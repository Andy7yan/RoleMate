use secure_storage::{OsSecretStore, SecretStore};
use std::{path::PathBuf, process::Command};

#[tauri::command]
fn create_example_vault() -> Result<String, String> {
    let root = std::env::temp_dir().join(format!(
        "OpenJobAgentVault-example-{}",
        uuid::Uuid::new_v4()
    ));
    desktop_core::create_example_vault(&root).map_err(|error| error.to_string())?;
    Ok(root.to_string_lossy().to_string())
}

#[tauri::command]
fn database_status(path: PathBuf) -> Result<u32, String> {
    desktop_core::Database::open(&path)
        .map(|db| db.schema_version())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn configure_native_pairing(vault_path: PathBuf) -> Result<String, String> {
    if !vault_path.join("vault.yaml").is_file() {
        return Err("The selected folder is not an OpenJobAgent Memory Vault".into());
    }
    let vault_path = vault_path
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let secret = format!("{}{}", uuid::Uuid::new_v4(), uuid::Uuid::new_v4());
    let store = OsSecretStore::new("OpenJobAgent");
    store
        .set("native-messaging", &secret)
        .map_err(|error| error.to_string())?;
    store
        .set("vault-path", &vault_path.to_string_lossy())
        .map_err(|error| error.to_string())?;
    Ok(secret)
}

#[tauri::command]
fn codex_status() -> Result<String, String> {
    let output = Command::new("cmd.exe")
        .args(["/C", "codex.cmd", "login", "status"])
        .output()
        .map_err(|error| error.to_string())?;
    let text = if output.status.success() {
        String::from_utf8_lossy(&output.stdout)
    } else {
        String::from_utf8_lossy(&output.stderr)
    };
    Ok(text.trim().to_string())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_example_vault,
            database_status,
            configure_native_pairing,
            codex_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenJobAgent");
}
