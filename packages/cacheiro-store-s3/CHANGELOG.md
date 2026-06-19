# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
