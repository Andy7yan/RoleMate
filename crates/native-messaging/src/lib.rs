use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::io::{Read, Write};
use thiserror::Error;

pub const MAX_MESSAGE_BYTES: usize = 1024 * 1024;
type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Deserialize)]
#[serde(
    tag = "type",
    rename_all = "snake_case",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum Request {
    Hello {
        request_id: String,
        extension_id: String,
        auth: String,
    },
    PrepareAnswer {
        request_id: String,
        extension_id: String,
        auth: String,
        question: Question,
    },
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Question {
    pub text: String,
    #[serde(rename = "fieldType")]
    pub field_type: String,
    pub required: bool,
    #[serde(rename = "minLength")]
    pub min_length: Option<usize>,
    #[serde(rename = "maxLength")]
    pub max_length: Option<usize>,
    pub options: Option<Vec<String>>,
    #[serde(rename = "jobDescription")]
    pub job_description: Option<String>,
}
#[derive(Debug, Serialize)]
pub struct Response<T: Serialize> {
    pub request_id: String,
    pub ok: bool,
    #[serde(flatten)]
    pub payload: T,
}
#[derive(Debug, Serialize)]
pub struct ErrorPayload {
    pub error: String,
}
#[derive(Debug, Serialize)]
pub struct HelloPayload {
    pub status: &'static str,
}
#[derive(Debug, Serialize)]
pub struct AnswerPayload {
    pub answer: GroundedAnswer,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GroundedAnswer {
    pub status: &'static str,
    pub answer: Option<String>,
    pub evidence_fact_ids: Vec<String>,
    pub evidence_files: Vec<String>,
    pub confidence: f32,
    pub missing_information: Vec<String>,
    pub follow_up_questions: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Error)]
pub enum ProtocolError {
    #[error("message exceeds size limit")]
    Oversized,
    #[error("unexpected end of stream")]
    Truncated,
    #[error("invalid JSON: {0}")]
    InvalidJson(String),
    #[error("extension is not allowlisted")]
    InvalidExtension,
    #[error("authentication failed")]
    Authentication,
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

pub fn read_message<R: Read>(reader: &mut R) -> Result<Request, ProtocolError> {
    let mut prefix = [0_u8; 4];
    reader.read_exact(&mut prefix).map_err(|e| {
        if e.kind() == std::io::ErrorKind::UnexpectedEof {
            ProtocolError::Truncated
        } else {
            ProtocolError::Io(e)
        }
    })?;
    let size = u32::from_le_bytes(prefix) as usize;
    if size > MAX_MESSAGE_BYTES {
        return Err(ProtocolError::Oversized);
    }
    let mut body = vec![0; size];
    reader.read_exact(&mut body).map_err(|e| {
        if e.kind() == std::io::ErrorKind::UnexpectedEof {
            ProtocolError::Truncated
        } else {
            ProtocolError::Io(e)
        }
    })?;
    serde_json::from_slice(&body).map_err(|error| ProtocolError::InvalidJson(error.to_string()))
}
pub fn write_message<W: Write, T: Serialize>(
    writer: &mut W,
    value: &T,
) -> Result<(), ProtocolError> {
    let body = serde_json::to_vec(value).map_err(|e| ProtocolError::InvalidJson(e.to_string()))?;
    if body.len() > MAX_MESSAGE_BYTES {
        return Err(ProtocolError::Oversized);
    }
    writer.write_all(&(body.len() as u32).to_le_bytes())?;
    writer.write_all(&body)?;
    writer.flush()?;
    Ok(())
}

pub fn authenticate(
    request: &Request,
    allowed_extension: &str,
    secret: &str,
) -> Result<(), ProtocolError> {
    let (extension, auth) = match request {
        Request::Hello {
            extension_id, auth, ..
        }
        | Request::PrepareAnswer {
            extension_id, auth, ..
        } => (extension_id, auth),
    };
    if extension != allowed_extension {
        return Err(ProtocolError::InvalidExtension);
    }
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).map_err(|_| ProtocolError::Authentication)?;
    mac.update(extension.as_bytes());
    let expected = hex_encode(&mac.finalize().into_bytes());
    if subtle::ConstantTimeEq::ct_eq(expected.as_bytes(), auth.as_bytes()).into() {
        Ok(())
    } else {
        Err(ProtocolError::Authentication)
    }
}
fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}
pub fn auth_token(extension: &str, secret: &str) -> String {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC accepts arbitrary key length");
    mac.update(extension.as_bytes());
    hex_encode(&mac.finalize().into_bytes())
}

pub fn dispatch(
    request: Request,
    approved_answers: &std::collections::HashMap<String, String>,
) -> serde_json::Value {
    match request {
        Request::Hello { request_id, .. } => serde_json::to_value(Response {
            request_id,
            ok: true,
            payload: HelloPayload {
                status: "connected",
            },
        })
        .unwrap(),
        Request::PrepareAnswer {
            request_id,
            question,
            ..
        } => {
            let key = question.text.trim().to_lowercase();
            let answer = approved_answers
                .get(&key)
                .map(|value| {
                    let mut value = value.clone();
                    if let Some(max) = question.max_length {
                        value.truncate(value.floor_char_boundary(max));
                    }
                    GroundedAnswer {
                        status: "ready",
                        answer: Some(value),
                        evidence_fact_ids: vec!["answer-bank.approved".into()],
                        evidence_files: vec!["answer-bank/approved.json".into()],
                        confidence: 1.0,
                        missing_information: vec![],
                        follow_up_questions: vec![],
                        warnings: vec![],
                    }
                })
                .unwrap_or_else(|| GroundedAnswer {
                    status: "needs_user_input",
                    answer: None,
                    evidence_fact_ids: vec![],
                    evidence_files: vec![],
                    confidence: 0.0,
                    missing_information: vec![format!(
                        "Approved information needed to answer: {}",
                        question.text
                    )],
                    follow_up_questions: vec![format!(
                        "What truthful information should I use for “{}”?",
                        question.text
                    )],
                    warnings: vec![
                        "No answer was generated because approved evidence is insufficient.".into(),
                    ],
                });
            serde_json::to_value(Response {
                request_id,
                ok: true,
                payload: AnswerPayload { answer },
            })
            .unwrap()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    fn frame(body: &[u8]) -> Vec<u8> {
        let mut framed = (body.len() as u32).to_le_bytes().to_vec();
        framed.extend(body);
        framed
    }
    #[test]
    fn reads_and_authenticates_allowed_message() {
        let auth = auth_token("ext", "secret");
        let raw =
            format!(r#"{{"type":"hello","requestId":"1","extensionId":"ext","auth":"{auth}"}}"#);
        let request = read_message(&mut frame(raw.as_bytes()).as_slice()).unwrap();
        authenticate(&request, "ext", "secret").unwrap();
    }
    #[test]
    fn rejects_unknown_fields_and_types() {
        let raw =
            br#"{"type":"shell","requestId":"1","extensionId":"ext","auth":"x","command":"rm"}"#;
        assert!(matches!(
            read_message(&mut frame(raw).as_slice()),
            Err(ProtocolError::InvalidJson(_))
        ));
    }
    #[test]
    fn rejects_oversized_messages_before_allocating() {
        let input = ((MAX_MESSAGE_BYTES + 1) as u32).to_le_bytes().to_vec();
        assert!(matches!(
            read_message(&mut input.as_slice()),
            Err(ProtocolError::Oversized)
        ));
    }
    #[test]
    fn dispatches_ready_and_missing_answers() {
        let auth = auth_token("ext", "secret");
        let base = |text: &str| Request::PrepareAnswer {
            request_id: "1".into(),
            extension_id: "ext".into(),
            auth: auth.clone(),
            question: Question {
                text: text.into(),
                field_type: "text".into(),
                required: true,
                min_length: None,
                max_length: None,
                options: None,
                job_description: None,
            },
        };
        let mut bank = HashMap::new();
        bank.insert("work authorisation".into(), "Australian citizen".into());
        assert_eq!(
            dispatch(base("Work authorisation"), &bank)["answer"]["status"],
            "ready"
        );
        assert_eq!(
            dispatch(base("Salary expectation"), &bank)["answer"]["status"],
            "needs_user_input"
        );
    }
}
