# `@renatorodrigues/cacheiro-runner`

Reference runner for [`@renatorodrigues/cacheiro`](../cacheiro). Loads config via the [`config`](https://www.npmjs.com/package/config) npm package, validates it with AJV using the schema exported from `cacheiro`, then instantiates and starts a `Cacheiro` server.

This is a runnable application, not a library. It is not published to npm (`private: true`). Use it as-is, fork it, or write your own runner on top of `cacheiro`'s exported API.

## Requirements

- Node.js 22+

## Getting started

```sh
cp config/local.json.example config/local.json
# edit config/local.json — set auth.token and adjust store config
npm run dev
```

## Configuration

Two layers: JSON config files + environment variables. Environment variables always win.

### Config files

Resolved in order — later entries override earlier ones:

| File                                       | Purpose                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `config/default.json`                      | Base defaults (port 3000, filesystem store, 100 MB body limit)                        |
| `config/production.json`                   | Production overrides — applied when `NODE_ENV=production`                             |
| `config/local.json`                        | Local overrides — highest file priority, gitignored, create from `local.json.example` |
| `config/custom-environment-variables.json` | Maps env vars to config keys — overrides all files when the env var is set            |

### Config values

See [Config values reference](#config-values-reference) below.

### Environment variables

See [Environment variables reference](#environment-variables-reference) below.

## Deployment

### Dev (hot reload)

```sh
npm run dev
```

### Node (built)

```sh
npm run build
node dist/index.js
```

### PM2

```sh
npm start
# uses ecosystem.config.cjs — runs node dist/index.js under pm2-runtime
```

### Docker

Build from the repo root (the Dockerfile needs access to the full monorepo):

```sh
docker build -f packages/cacheiro-runner/Dockerfile -t cacheiro-runner .
```

Run:

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -e NODE_ENV=production \
  -v $(pwd)/cache:/cache \
  cacheiro-runner
```

For cloud stores, pass the relevant env vars instead of mounting a volume:

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -e NODE_ENV=production \
  -e CACHEIRO_STORE=s3 \
  -e S3_BUCKET=my-nx-cache \
  -e S3_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  cacheiro-runner
```

## Development

```sh
npm run dev            # watch + watch:others (full hot reload — server and dep packages)
npm run watch          # tsx watch src/index.ts — server only
npm run watch:others   # rebuilds dep packages on change (silent unless error)
npm run build          # compile TypeScript
npm run lint           # oxlint
npm run lint:fix       # oxlint --fix
npm run fmt            # oxfmt
npm run fmt:check      # oxfmt --check
```

## Config values reference

| Key                                   | Default        | Description                                                                                                                          |
| ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `server.port`                         | `3000`         | HTTP port to listen on                                                                                                               |
| `server.host`                         | `0.0.0.0`      | Host to bind to                                                                                                                      |
| `server.bodyLimitMb`                  | `100`          | Max request body size in MB                                                                                                          |
| `server.banner`                       | `true`         | Show ASCII art startup banner. When `false`, prints a compact single-line header instead.                                            |
| `server.infobox`                      | `true`         | Show the info box with version, URL, and store details. When `false`, the version is shown inline instead.                           |
| `auth.token`                          | `""`           | Bearer token required on all requests. Auth is disabled if empty.                                                                    |
| `store.type`                          | `"filesystem"` | Storage backend. One of `filesystem`, `s3`, `gcs`, `azure`.                                                                          |
| `store.filesystem.cacheDirectory`     | `"./cache"`    | Directory where artifacts are stored.                                                                                                |
| `store.filesystem.ttlDays`            | `7`            | Artifact TTL in days. `0` disables expiration.                                                                                       |
| `store.filesystem.sweepIntervalHours` | `24`           | How often to sweep for expired artifacts (hours). `0` disables the sweep.                                                            |
| `store.s3.bucket`                     | `""`           | S3 bucket name.                                                                                                                      |
| `store.s3.region`                     | `"us-east-1"`  | AWS region.                                                                                                                          |
| `store.s3.endpoint`                   | `""`           | Custom S3-compatible endpoint URL (MinIO, LocalStack, etc.).                                                                         |
| `store.s3.accessKeyId`                | `""`           | AWS access key ID. Falls back to the AWS credential chain (`AWS_ACCESS_KEY_ID` env var, `AWS_PROFILE`, IAM role, etc.) when omitted. |
| `store.s3.secretAccessKey`            | `""`           | AWS secret access key. Falls back to the AWS credential chain (`AWS_SECRET_ACCESS_KEY` env var, IAM role, etc.) when omitted.        |
| `store.s3.forcePathStyle`             | `false`        | Use path-style URLs. Required for most S3-compatible storage.                                                                        |
| `store.s3.prefix`                     | `""`           | Key prefix for all cache entries.                                                                                                    |
| `store.s3.encryptionKey`              | `""`           | AES-256-GCM encryption key. Encrypts all artifacts client-side before upload.                                                        |
| `store.gcs.bucket`                    | `""`           | GCS bucket name.                                                                                                                     |
| `store.gcs.endpoint`                  | `""`           | Custom GCS-compatible endpoint URL (e.g. for local emulators).                                                                       |
| `store.gcs.prefix`                    | `""`           | Key prefix for all cache entries.                                                                                                    |
| `store.gcs.encryptionKey`             | `""`           | AES-256-GCM encryption key. Encrypts all artifacts client-side before upload.                                                        |
| `store.azure.container`               | `""`           | Azure Blob Storage container name.                                                                                                   |
| `store.azure.accountName`             | `""`           | Azure Storage account name.                                                                                                          |
| `store.azure.connectionString`        | `""`           | Full Azure Blob Storage connection string. Overrides `accountName` if provided.                                                      |
| `store.azure.prefix`                  | `""`           | Key prefix for all cache entries.                                                                                                    |
| `store.azure.encryptionKey`           | `""`           | AES-256-GCM encryption key. Encrypts all artifacts client-side before upload.                                                        |

## Environment variables reference

| Variable                              | Config key                            | Default        |
| ------------------------------------- | ------------------------------------- | -------------- |
| `CACHEIRO_AUTH_TOKEN`                 | `auth.token`                          | `""` (no auth) |
| `CACHEIRO_PORT`                       | `server.port`                         | `3000`         |
| `CACHEIRO_HOST`                       | `server.host`                         | `0.0.0.0`      |
| `CACHEIRO_BODY_LIMIT_MB`              | `server.bodyLimitMb`                  | `100`          |
| `CACHEIRO_BANNER`                     | `server.banner`                       | `true`         |
| `CACHEIRO_INFOBOX`                    | `server.infobox`                      | `true`         |
| `CACHEIRO_STORE`                      | `store.type`                          | `filesystem`   |
| `CACHEIRO_CACHE_DIRECTORY`            | `store.filesystem.cacheDirectory`     | `./cache`      |
| `CACHEIRO_CACHE_TTL_DAYS`             | `store.filesystem.ttlDays`            | `7`            |
| `CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS` | `store.filesystem.sweepIntervalHours` | `24`           |
| `S3_BUCKET`                           | `store.s3.bucket`                     | —              |
| `S3_REGION`                           | `store.s3.region`                     | `us-east-1`    |
| `S3_ENDPOINT`                         | `store.s3.endpoint`                   | —              |
| `AWS_ACCESS_KEY_ID`                   | `store.s3.accessKeyId`                | —              |
| `AWS_SECRET_ACCESS_KEY`               | `store.s3.secretAccessKey`            | —              |
| `S3_FORCE_PATH_STYLE`                 | `store.s3.forcePathStyle`             | `false`        |
| `S3_PREFIX`                           | `store.s3.prefix`                     | —              |
| `S3_ENCRYPTION_KEY`                   | `store.s3.encryptionKey`              | —              |
| `GCS_BUCKET`                          | `store.gcs.bucket`                    | —              |
| `GCS_ENDPOINT`                        | `store.gcs.endpoint`                  | —              |
| `GCS_PREFIX`                          | `store.gcs.prefix`                    | —              |
| `GCS_ENCRYPTION_KEY`                  | `store.gcs.encryptionKey`             | —              |
| `AZURE_CONTAINER`                     | `store.azure.container`               | —              |
| `AZURE_ACCOUNT_NAME`                  | `store.azure.accountName`             | —              |
| `AZURE_STORAGE_CONNECTION_STRING`     | `store.azure.connectionString`        | —              |
| `AZURE_PREFIX`                        | `store.azure.prefix`                  | —              |
| `AZURE_ENCRYPTION_KEY`                | `store.azure.encryptionKey`           | —              |
