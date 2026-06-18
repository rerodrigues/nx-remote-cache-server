# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-azure@1.0.0...@renatorodrigues/cacheiro-store-azure@1.0.1) (2026-06-18)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-azure

## [1.0.0] - 2026-06-16

### Added

- `AzureStore` — Azure Blob Storage store for `cacheiro`
- Authentication via connection string or `DefaultAzureCredential` (env vars, managed identity, Azure CLI)
- Optional key prefix for sharing a container across projects
- Optional client-side AES-256-CBC encryption with scrypt-derived key
- Optional `encryptionScope` for server-side scope-keyed encryption (Key Vault CMK)
- `configSchema` — JSON Schema for config validation
