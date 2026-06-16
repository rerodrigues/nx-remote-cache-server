# Changelog

## [1.0.0] - 2026-06-16

### Added

- `AzureStore` — Azure Blob Storage store for `cacheiro`
- Authentication via connection string or `DefaultAzureCredential` (env vars, managed identity, Azure CLI)
- Optional key prefix for sharing a container across projects
- Optional client-side AES-256-CBC encryption with scrypt-derived key
- Optional `encryptionScope` for server-side scope-keyed encryption (Key Vault CMK)
- `configSchema` — JSON Schema for config validation
