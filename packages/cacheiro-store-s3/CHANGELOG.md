# Changelog

## [1.0.0] - 2026-06-14

### Added

- `S3Store` — S3 store for `cacheiro`, compatible with AWS S3 and S3-compatible backends (MinIO, LocalStack, Cloudflare R2, DigitalOcean Spaces)
- AWS credential chain support — explicit keys, `AWS_PROFILE`, IAM roles
- Optional key prefix for sharing a bucket across projects
- Optional client-side AES-256-CBC encryption with scrypt-derived key
- `configSchema` — JSON Schema for config validation
