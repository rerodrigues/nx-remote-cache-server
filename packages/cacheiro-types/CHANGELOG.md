# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-types@1.1.2...@renatorodrigues/cacheiro-types@1.2.0) (2026-09-14)

### Features

- **cacheiro-types:** add ExpiringReadable for non-breaking TTL signaling ([348d6fa](https://github.com/rerodrigues/nx-remote-cache-server/commit/348d6fad0ecf8ecfb9302c2d64361123cb49bf10))
- **cacheiro:** add lifecycle hooks ([bf0969e](https://github.com/rerodrigues/nx-remote-cache-server/commit/bf0969e0ed323a6ee435cee611f5605defe94ada))

## [1.1.2](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-types@1.1.1...@renatorodrigues/cacheiro-types@1.1.2) (2026-09-09)

### Bug Fixes

- run build before publish via prepublishOnly hook ([c90c32e](https://github.com/rerodrigues/nx-remote-cache-server/commit/c90c32ed09244b77faa6e2420bc355f99acd2f23))

## [1.1.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-types@1.1.0...@renatorodrigues/cacheiro-types@1.1.1) (2026-09-03)

**Note:** Version bump only for package @renatorodrigues/cacheiro-types

## [1.1.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-types@1.0.0...@renatorodrigues/cacheiro-types@1.1.0) (2026-06-19)

### Features

- **cacheiro-store-gcs:** implement Google Cloud Storage store

## [1.0.0] - 2026-06-14

### Added

- `CacheiroStore` interface — contract for all store implementations (`mount`, `unmount`, `exists`, `write`, `read`)
- `Describable` interface — optional contract for stores that expose a human-readable description
