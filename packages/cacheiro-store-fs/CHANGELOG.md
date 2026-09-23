# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-fs@1.1.0...@renatorodrigues/cacheiro-store-fs@1.1.1) (2026-09-23)

### Bug Fixes

- **cacheiro,cacheiro-store-\*:** build workspace deps in prepublishOnly ([3be97eb](https://github.com/rerodrigues/nx-remote-cache-server/commit/3be97ebe4ac73ac2199ad4c39b22beb81b124393))

## [1.1.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-fs@1.0.4...@renatorodrigues/cacheiro-store-fs@1.1.0) (2026-09-14)

### Features

- **cacheiro-store-fs:** add local expired/swept events ([7ac191b](https://github.com/rerodrigues/nx-remote-cache-server/commit/7ac191b3c0535e938d90e7d2b89fb31008880c33))
- **cacheiro-types:** add ExpiringReadable for non-breaking TTL signaling ([348d6fa](https://github.com/rerodrigues/nx-remote-cache-server/commit/348d6fad0ecf8ecfb9302c2d64361123cb49bf10))

## [1.0.4](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-fs@1.0.3...@renatorodrigues/cacheiro-store-fs@1.0.4) (2026-09-09)

### Bug Fixes

- run build before publish via prepublishOnly hook ([c90c32e](https://github.com/rerodrigues/nx-remote-cache-server/commit/c90c32ed09244b77faa6e2420bc355f99acd2f23))

## [1.0.3](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-fs@1.0.2...@renatorodrigues/cacheiro-store-fs@1.0.3) (2026-09-03)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-fs

## [1.0.2](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-fs@1.0.1...@renatorodrigues/cacheiro-store-fs@1.0.2) (2026-06-19)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-fs

## [1.0.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-fs@1.0.0...@renatorodrigues/cacheiro-store-fs@1.0.1) (2026-06-18)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-fs

## [1.0.0] - 2026-06-14

### Added

- `FileSystemStore` — filesystem store for `cacheiro` with sharded directory layout and atomic temp+rename writes
- `fsync` on write for durability guarantees
- Optional TTL-based expiration with configurable background sweep interval
- `configSchema` — JSON Schema for config validation
