use std::{collections::HashMap, sync::Mutex};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("credential store error: {0}")]
    Keyring(String),
    #[error("secret not found")]
    NotFound,
}
pub trait SecretStore: Send + Sync {
    fn set(&self, key: &str, value: &str) -> Result<(), StorageError>;
    fn get(&self, key: &str) -> Result<String, StorageError>;
    fn delete(&self, key: &str) -> Result<(), StorageError>;
}

pub struct OsSecretStore {
    service: String,
}
impl OsSecretStore {
    pub fn new(service: impl Into<String>) -> Self {
        Self {
            service: service.into(),
        }
    }
}
impl SecretStore for OsSecretStore {
    fn set(&self, key: &str, value: &str) -> Result<(), StorageError> {
        keyring::Entry::new(&self.service, key)
            .map_err(|e| StorageError::Keyring(e.to_string()))?
            .set_password(value)
            .map_err(|e| StorageError::Keyring(e.to_string()))
    }
    fn get(&self, key: &str) -> Result<String, StorageError> {
        keyring::Entry::new(&self.service, key)
            .map_err(|e| StorageError::Keyring(e.to_string()))?
            .get_password()
            .map_err(|e| {
                if matches!(e, keyring::Error::NoEntry) {
                    StorageError::NotFound
                } else {
                    StorageError::Keyring(e.to_string())
                }
            })
    }
    fn delete(&self, key: &str) -> Result<(), StorageError> {
        keyring::Entry::new(&self.service, key)
            .map_err(|e| StorageError::Keyring(e.to_string()))?
            .delete_credential()
            .map_err(|e| StorageError::Keyring(e.to_string()))
    }
}

#[derive(Default)]
pub struct MemorySecretStore(Mutex<HashMap<String, String>>);
impl SecretStore for MemorySecretStore {
    fn set(&self, key: &str, value: &str) -> Result<(), StorageError> {
        self.0.lock().unwrap().insert(key.into(), value.into());
        Ok(())
    }
    fn get(&self, key: &str) -> Result<String, StorageError> {
        self.0
            .lock()
            .unwrap()
            .get(key)
            .cloned()
            .ok_or(StorageError::NotFound)
    }
    fn delete(&self, key: &str) -> Result<(), StorageError> {
        self.0.lock().unwrap().remove(key);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn memory_store_obeys_contract() {
        let store = MemorySecretStore::default();
        store.set("native", "secret").unwrap();
        assert_eq!(store.get("native").unwrap(), "secret");
        store.delete("native").unwrap();
        assert!(matches!(store.get("native"), Err(StorageError::NotFound)));
    }
}
