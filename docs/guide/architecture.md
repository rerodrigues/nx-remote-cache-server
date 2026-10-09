# Architecture

Cacheiro is split into focused packages so you only take what you need. The core library is independently usable. The runner and the Docker images are two ready-made ways to run it.

## Packages

| Package | Description |
| --- | --- |
| [`@renatorodrigues/cacheiro`](/packages/core) | Core cache server library |
| [`@renatorodrigues/cacheiro-instants`](/packages/instants) | Store-agnostic runtime behind the ready-to-use Docker images |
| [`@renatorodrigues/cacheiro-runner`](/packages/runner) | Reference runner that loads config and starts the server |
| [`@renatorodrigues/cacheiro-store-fs`](/packages/store-fs) | Filesystem store with sharded layout and atomic writes |
| [`@renatorodrigues/cacheiro-store-s3`](/packages/store-s3) | S3 store |
| [`@renatorodrigues/cacheiro-store-gcs`](/packages/store-gcs) | Google Cloud Storage store |
| [`@renatorodrigues/cacheiro-store-azure`](/packages/store-azure) | Azure Blob Storage store |
| [`@renatorodrigues/cacheiro-types`](/packages/types) | Shared TypeScript types |

Filesystem, S3, Azure Blob, and GCS stores are production-ready.

## Which one do I use?

- **Just want a cache server:** use [Instants](/packages/instants). Pull the image for your store, set environment variables, run.
- **Want to start from a working app:** use [Runner](/packages/runner). It is a reference implementation you can deploy as-is or fork. It ships with the filesystem store and is not published to npm.
- **Want to embed or extend:** use [Core](/packages/core) with a store package. Add custom routes, hooks, or plugins before `listen()`.
- **Need another storage backend:** implement `CacheiroStore` from [Types](/packages/types).

## How it fits together

`Cacheiro` (core) takes a store that implements `CacheiroStore` and a config object, and serves the Nx remote cache HTTP API on top of Fastify. Store packages are independent of core, so adding or swapping a backend never touches the server logic. Cacheiro is a toolkit, not an opinionated framework.
