# NX Remote Cache Server

Self-hosted [NX remote cache](https://nx.dev/recipes/running-tasks/self-hosted-caching) monorepo. Implements the NX 20.8+ custom remote cache specification.

## Packages

| Package                                                                        | Description                                              |
| ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| [`@renatorodrigues/cacheiro`](./packages/cacheiro)                             | Core cache server library (Fastify + OpenAPI)            |
| [`@renatorodrigues/cacheiro-runner`](./packages/cacheiro-runner)               | Reference runner — loads config and starts the server    |
| [`@renatorodrigues/cacheiro-store-fs`](./packages/cacheiro-store-fs)           | Filesystem store implementation                          |
| [`@renatorodrigues/cacheiro-store-s3`](./packages/cacheiro-store-s3)           | S3 store implementation (pending)                        |
| [`@renatorodrigues/cacheiro-store-gcs`](./packages/cacheiro-store-gcs)         | GCS store implementation (pending)                       |
| [`@renatorodrigues/cacheiro-store-azure`](./packages/cacheiro-store-azure)     | Azure Blob Storage store implementation (pending)        |
| [`@renatorodrigues/cacheiro-types`](./packages/cacheiro-types)                 | Shared TypeScript interfaces                                  |

## Getting started

```sh
npm install
cd packages/cacheiro-runner
cp config/local.json.example config/local.json
npm run dev
```

`npm run dev` (inside `packages/cacheiro-runner`) runs the server with hot reload and watches all dependency packages — if any dep recompiles, the runner restarts automatically.

See [`packages/cacheiro-runner`](./packages/cacheiro-runner) for full configuration and deployment docs.
See [`packages/cacheiro`](./packages/cacheiro) for the server core library API.

## Local emulators

A `docker-compose.yml` at the repo root provides local emulators for all cloud store backends:

| Service     | Emulates              | Port    |
| ----------- | --------------------- | ------- |
| `local-s3`  | AWS S3                | `4566`  |
| `local-gcs` | Google Cloud Storage  | `4443`  |
| `local-azure` | Azure Blob Storage  | `10000` |

Start all emulators:

```sh
docker compose up
```

Or start a specific one:

```sh
docker compose up local-s3
docker compose up local-gcs
docker compose up local-azure
```

Then configure `packages/cacheiro-runner/config/local.json` using the emulator snippets in `local.json.example`.
