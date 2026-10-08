# `@renatorodrigues/cacheiro-instants`

Store-agnostic runtime behind the **Cacheiro Instants** Docker images — ready-to-use images for each Cacheiro store flavor (`fs`, `s3`, `gcs`, `azure`). Picks the store implementation at startup via `CACHEIRO_STORE_TYPE`, builds config from plain environment variables, validates with AJV, then starts a `Cacheiro` server.

This is a runnable application, not a library. Not to be confused with [`@renatorodrigues/cacheiro-runner`](../cacheiro-runner) — that's the fs-only reference runner for local development; this package is the store-agnostic runtime shipped in the published Docker images.

## Requirements

- Node.js 22+ (or Docker)

## Quick start (Docker)

Each flavor is published as its own image: `ghcr.io/rerodrigues/cacheiro-instants-fs`, `-s3`, `-gcs`, `-azure`.

### Filesystem

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -v $(pwd)/cache:/cache \
  ghcr.io/rerodrigues/cacheiro-instants-fs
```

### S3 (also works with MinIO, LocalStack, R2, Spaces — any S3-compatible endpoint)

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -e S3_BUCKET=my-nx-cache \
  -e S3_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  ghcr.io/rerodrigues/cacheiro-instants-s3
```

### GCS

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -e GCS_BUCKET=my-nx-cache \
  -v $(pwd)/gcp-credentials.json:/creds.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/creds.json \
  ghcr.io/rerodrigues/cacheiro-instants-gcs
```

### Azure

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -e AZURE_CONTAINER=my-nx-cache \
  -e AZURE_STORAGE_CONNECTION_STRING="..." \
  ghcr.io/rerodrigues/cacheiro-instants-azure
```

With TLS (any flavor):

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -e CACHEIRO_TLS_CERT_FILE=/certs/cert.pem \
  -e CACHEIRO_TLS_KEY_FILE=/certs/key.pem \
  -v $(pwd)/certs:/certs:ro \
  ghcr.io/rerodrigues/cacheiro-instants-fs
```

## Building locally

Build from the repo root (the Dockerfile needs access to the full monorepo). `STORE_TYPE` picks which store package gets bundled — `fs` (default), `s3`, `gcs`, or `azure`:

```sh
docker build -f packages/cacheiro-instants/Dockerfile --build-arg STORE_TYPE=s3 -t cacheiro-instants-s3 .
```

Multi-arch (`linux/amd64` + `linux/arm64`), no QEMU needed — none of the 4 store SDKs use native addons, so cross-arch builds are plain JS file copies:

```sh
docker buildx build -f packages/cacheiro-instants/Dockerfile --build-arg STORE_TYPE=s3 \
  --platform linux/amd64,linux/arm64 -t cacheiro-instants-s3 .
```

## Configuration

Plain environment variables only — no config files. Environment variables shared by all flavors (server + auth):

| Variable                        | Default       | Description                                                                                                                         |
| ------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `CACHEIRO_PORT`                 | image default | Port to listen on. Required — no code-level default, baked into the image as `3000`                                                 |
| `CACHEIRO_HOST`                 | image default | Host to bind to. Required — no code-level default, baked into the image as `0.0.0.0`                                                |
| `CACHEIRO_BODY_LIMIT_MB`        | `100`         | Max request body size in MB                                                                                                         |
| `CACHEIRO_BANNER`               | `true`        | Show ASCII art startup banner                                                                                                       |
| `CACHEIRO_INFOBOX`              | `true`        | Show the info box with version, URL, and store details                                                                              |
| `CACHEIRO_TLS_CERT_FILE`        | —             | Path to PEM certificate file. Enables HTTPS when set with `KEY_FILE`                                                                |
| `CACHEIRO_TLS_KEY_FILE`         | —             | Path to PEM private key file                                                                                                        |
| `CACHEIRO_TLS_CA_FILE`          | —             | Path to CA certificate file (optional)                                                                                              |
| `CACHEIRO_AUTH_TOKEN`           | —             | Bearer token required on all requests. Omit to disable auth                                                                         |
| `CACHEIRO_AUTH_READ_ONLY_TOKEN` | —             | Optional read-only bearer token (GET only). Requires `AUTH_TOKEN`                                                                   |
| `CACHEIRO_STORE_TYPE`           | image default | `fs`, `s3`, `gcs`, or `azure`. Required — no code-level default, baked in per image, override only for local testing across flavors |

### Filesystem (`cacheiro-instants-fs`)

| Variable                              | Default  | Description                                                |
| ------------------------------------- | -------- | ---------------------------------------------------------- |
| `CACHEIRO_CACHE_DIRECTORY`            | `/cache` | Directory where artifacts are stored (image default)       |
| `CACHEIRO_CACHE_TTL_DAYS`             | `7`      | Artifact TTL in days. `0` disables expiration              |
| `CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS` | `24`     | How often to sweep expired artifacts (hours). `0` disables |

### S3 (`cacheiro-instants-s3`)

See [`cacheiro-store-s3`'s environment variables reference](../cacheiro-store-s3#environment-variables-reference) — `S3_BUCKET`, `S3_REGION` required; `S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_PROFILE`, `S3_FORCE_PATH_STYLE`, `S3_PREFIX`, `S3_ENCRYPTION_KEY`, `S3_DISABLE_CHECKSUM`, `S3_SERVER_SIDE_ENCRYPTION` optional.

### GCS (`cacheiro-instants-gcs`)

See [`cacheiro-store-gcs`'s environment variables reference](../cacheiro-store-gcs#environment-variables-reference) — `GCS_BUCKET` required; `GCS_ENDPOINT`, `GCS_PREFIX`, `GCS_ENCRYPTION_KEY` optional. Google application credentials are picked up the standard way (`GOOGLE_APPLICATION_CREDENTIALS`, workload identity, etc.).

### Azure (`cacheiro-instants-azure`)

See [`cacheiro-store-azure`'s environment variables reference](../cacheiro-store-azure#environment-variables-reference) — `AZURE_CONTAINER` required, plus one of `AZURE_ACCOUNT_NAME`/`AZURE_STORAGE_CONNECTION_STRING`; `AZURE_PREFIX`, `AZURE_ENCRYPTION_KEY`, `AZURE_ENCRYPTION_SCOPE` optional.

Invalid or missing required fields fail fast at startup with a clear AJV error listing every problem — the container won't silently start half-configured.

## Development

```sh
npm run dev            # watch + watch:others (full hot reload)
npm run build          # compile TypeScript
npm start              # run the compiled server
npm test               # vitest run
npm run test:watch     # watch mode
npm run lint           # oxlint
npm run lint:fix       # oxlint --fix
npm run fmt            # oxfmt
npm run fmt:check      # oxfmt --check
```

To try a flavor locally without Docker:

```sh
npm run build -w packages/cacheiro-instants
CACHEIRO_STORE_TYPE=fs CACHEIRO_CACHE_DIRECTORY=./cache CACHEIRO_AUTH_TOKEN=dev-token \
  node packages/cacheiro-instants/dist/index.js
```

## Versioning and tags

Each flavor's image tag tracks `@renatorodrigues/cacheiro-instants`'s own version (e.g. `cacheiro-instants-s3:1.4.0`) — one tag, one immutable build. `latest` always points at the most recent build per flavor. Rebuilds trigger on changes to the store package, `cacheiro`, `cacheiro-types`, or this package itself. The store package version used in a given build is recorded as an image label (`io.renatorodrigues.store-version`), visible via `docker inspect`.

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
