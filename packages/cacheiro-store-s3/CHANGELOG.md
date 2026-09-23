# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.6](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-s3@1.0.5...@renatorodrigues/cacheiro-store-s3@1.0.6) (2026-09-23)

### Bug Fixes

- **cacheiro,cacheiro-store-\*:** build workspace deps in prepublishOnly ([3be97eb](https://github.com/rerodrigues/nx-remote-cache-server/commit/3be97ebe4ac73ac2199ad4c39b22beb81b124393))

## [1.0.5](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-s3@1.0.4...@renatorodrigues/cacheiro-store-s3@1.0.5) (2026-09-14)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-s3

## [1.0.4](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-s3@1.0.3...@renatorodrigues/cacheiro-store-s3@1.0.4) (2026-09-09)

### Bug Fixes

- run build before publish via prepublishOnly hook ([c90c32e](https://github.com/rerodrigues/nx-remote-cache-server/commit/c90c32ed09244b77faa6e2420bc355f99acd2f23))

## [1.0.3](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-s3@1.0.2...@renatorodrigues/cacheiro-store-s3@1.0.3) (2026-09-03)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-s3

## [1.0.2](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-s3@1.0.1...@renatorodrigues/cacheiro-store-s3@1.0.2) (2026-06-19)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-s3

## [1.0.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-store-s3@1.0.0...@renatorodrigues/cacheiro-store-s3@1.0.1) (2026-06-18)

**Note:** Version bump only for package @renatorodrigues/cacheiro-store-s3

## [1.0.0] - 2026-06-14

### Added

- `S3Store` — S3 store for `cacheiro`, compatible with AWS S3 and S3-compatible backends (MinIO, LocalStack, Cloudflare R2, DigitalOcean Spaces)
- AWS credential chain support — explicit keys, `AWS_PROFILE`, IAM roles
- Optional key prefix for sharing a bucket across projects
- Optional client-side AES-256-CBC encryption with scrypt-derived key
- `configSchema` — JSON Schema for config validation
