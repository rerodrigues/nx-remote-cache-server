# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-types@1.0.0...@renatorodrigues/cacheiro-types@1.1.0) (2026-06-19)

### Features

- **cacheiro-store-gcs:** implement Google Cloud Storage store

## [1.0.0] - 2026-06-14

### Added

- `CacheiroStore` interface — contract for all store implementations (`mount`, `unmount`, `exists`, `write`, `read`)
- `Describable` interface — optional contract for stores that expose a human-readable description
