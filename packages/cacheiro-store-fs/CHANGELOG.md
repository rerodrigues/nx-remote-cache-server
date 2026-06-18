# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-fs@1.0.0...@renatorodrigues/cacheiro-store-fs@1.0.1) (2026-06-18)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-fs

## [1.0.0] - 2026-06-14

### Added

- `FileSystemStore` — filesystem store for `cacheiro` with sharded directory layout and atomic temp+rename writes
- `fsync` on write for durability guarantees
- Optional TTL-based expiration with configurable background sweep interval
- `configSchema` — JSON Schema for config validation
