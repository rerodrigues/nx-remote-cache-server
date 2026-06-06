# NX Remote Cache Server

Self-hosted [NX remote cache](https://nx.dev/recipes/running-tasks/self-hosted-caching) monorepo. Implements the NX 20.8+ custom remote cache specification.

## Packages

| Package                                                              | Description                                    |
| -------------------------------------------------------------------- | ---------------------------------------------- |
| [`@renatorodrigues/cacheiro`](./packages/cacheiro)                   | Cache server (Fastify + OpenAPI)               |
| [`@renatorodrigues/cacheiro-store-fs`](./packages/cacheiro-store-fs) | Filesystem store implementation                |
| [`@renatorodrigues/cacheiro-store-s3`](./packages/cacheiro-store-s3) | S3 store implementation (pending)              |
| [`@renatorodrigues/cacheiro-store-gcs`](./packages/cacheiro-store-gcs) | GCS store implementation (pending)           |
| [`@renatorodrigues/cacheiro-types`](./packages/cacheiro-types)       | Shared TypeScript interfaces (`Store`)         |

## Getting started

```sh
npm install
cd packages/cacheiro
cp config/local.json.example config/local.json
npm run dev
```

See [`packages/cacheiro`](./packages/cacheiro) for full configuration and deployment docs.
