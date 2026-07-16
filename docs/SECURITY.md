# Security policy

## Report a vulnerability

Do not open a public issue for a suspected credential leak, path traversal, native-host bypass or unintended submission. Contact the maintainers privately through the repository's security advisory channel. Include the affected commit, reproduction steps and impact; omit real personal data and credentials.

## Supported versions

The project is pre-release. Security fixes target the latest `main` branch until versioned releases begin.

## Enforced controls

- Page and job-description text is untrusted data, not instructions.
- Only approved fact statuses can ground answers.
- Native Messaging uses a 32-bit little-endian length prefix, a 1 MiB cap, strict schemas, extension-ID allowlisting and constant-time HMAC verification.
- The extension cannot send a path, URL or shell command to the host.
- Vault path checks reject traversal.
- Credentials use Windows Credential Manager through `secure-storage`.
- Generic forms cannot auto-submit, and sensitive demographic fields are manual-only.
- Codex credential files are never accessed.

## Release checks

`pnpm check` must pass. A release review must also scan tracked files for credentials and personal fixtures, inspect dependency advisories, confirm native-host manifest origins, and test installer uninstall behavior.
