# Changelog

## [1.0.0] - 2026-06-14

### Added

- `FileSystemStore` — filesystem store for `cacheiro` with sharded directory layout and atomic temp+rename writes
- `fsync` on write for durability guarantees
- Optional TTL-based expiration with configurable background sweep interval
- `configSchema` — JSON Schema for config validation
