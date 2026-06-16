# Cacheiro

> Your own *Nx* and *Lerna* remote cache. Self-hosted, open-source, no strings attached.

## Why Cacheiro exists

In May 2026, *Nx* deprecated all their official self-hosted cache packages due to [CVE-2025-36852](https://www.cve.org/CVERecord?id=CVE-2025-36852) — a critical cache poisoning vulnerability. *Nx*'s official recommendation? Migrate to Nx Cloud *(paid)* or build your own cache server from scratch.

So I built one — and made it open-source for everyone in the same boat.

*Cacheiro* implements the [Nx remote cache OpenAPI spec](https://nx.dev/recipes/running-tasks/self-hosted-caching) with no vendor lock-in, no proprietary cloud, and no strings attached.

## Works with Nx and Lerna

*Lerna* uses *Nx* under the hood for task orchestration — if you're on *Lerna*, you're already using *Nx* and will benefit from remote caching automatically.

Point either tool at your *Cacheiro* instance with two env variables and you're done:

```sh
export NX_SELF_HOSTED_REMOTE_CACHE_SERVER="https://mycache.server"
export NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN="your-secure-token-here"  # optional

lerna run build   
# or
nx run-many -t build
```

Huge thanks to the brilliant folks at [NRWL](https://nrwl.io) for creating *Nx* and for bringing *Lerna* back to life. 🙏

## Packages

*Cacheiro* is split into focused packages so you only take what you need.

| Package                                                                        | Description                                              |
| ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| [`@renatorodrigues/cacheiro`](./packages/cacheiro)                             | Core cache server library          |
| [`@renatorodrigues/cacheiro-runner`](./packages/cacheiro-runner)               | Reference runner — loads config and starts the server    |
| [`@renatorodrigues/cacheiro-store-fs`](./packages/cacheiro-store-fs)           | Filesystem store — sharded layout, atomic writes         |
| [`@renatorodrigues/cacheiro-store-s3`](./packages/cacheiro-store-s3)           | S3 store implementation                                  |
| [`@renatorodrigues/cacheiro-store-gcs`](./packages/cacheiro-store-gcs)         | GCS store implementation (pending)                       |
| [`@renatorodrigues/cacheiro-store-azure`](./packages/cacheiro-store-azure)     | Azure Blob Storage store implementation                  |
| [`@renatorodrigues/cacheiro-types`](./packages/cacheiro-types)                 | Shared TypeScript types                             |

> **Status:** Filesystem, S3, and Azure Blob stores are production-ready. GCS store is under development. See the [roadmap](#roadmap) below.

## Architecture

`cacheiro-runner` is a reference implementation — a fully working runner you can deploy as-is or use as a starting point. The core library (`@renatorodrigues/cacheiro`) is independently usable: wire in your own store, config loader, or middleware. *Cacheiro* is a toolkit, not an opinionated framework.

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

A `docker-compose.yml` at the repo root provides local emulators for the three cloud store backends:

| Service       | Emulates             | Port    |
| ------------- | -------------------- | ------- |
| `local-s3`    | AWS S3               | `4566`  |
| `local-gcs`   | Google Cloud Storage | `4443`  |
| `local-azure` | Azure Blob Storage   | `10000` |

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

## Roadmap

- [ ] GCS store
- [x] Azure Blob Storage store (v1.0.0)
- [x] S3 store (v0.3.0)
- [x] Decoupled pluggable store architecture (v0.3.0)
- [x] Separate runner and server packages (v0.2.0)
- [x] Basic cache server (v0.1.0)

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
