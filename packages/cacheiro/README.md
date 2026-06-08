# `@renatorodrigues/cacheiro`

Core library for the NX remote cache server. Implements the [NX 20.8+ custom remote cache](https://nx.dev/recipes/running-tasks/self-hosted-caching) specification.

This package provides the server logic, store orchestration, and the public API. It is not a runnable application — use [`@renatorodrigues/cacheiro-runner`](../cacheiro-runner) to run it, or build your own runner on top of the exported API.

## Requirements

- Node.js 22+

## API

### `new Cacheiro(config: CacheiroConfig)`

Creates a server instance. Accepts a validated `CacheiroConfig` object — use `configSchema` with AJV to validate before constructing.

### `cacheiro.start(): Promise<FastifyInstance>`

Creates the store, builds the Fastify server, and returns the Fastify instance. The server is not yet listening — use the returned instance to add custom routes, hooks, or plugins before calling `listen()`.

### `cacheiro.listen(): Promise<void>`

Binds the server to the configured host and port, then prints the startup banner.

### `cacheiro.stop(): Promise<void>`

Drains open connections and shuts down the server gracefully.

```ts
import { Cacheiro } from '@renatorodrigues/cacheiro';

const cacheiro = new Cacheiro({
  server: { port: 3000, host: '0.0.0.0', bodyLimitMb: 100, banner: true, infobox: true },
  auth: { token: 'my-secret-token' },
  store: {
    type: 'filesystem',
    filesystem: { cacheDirectory: './cache', ttlDays: 7, sweepIntervalHours: 24 },
  },
});

const server = await cacheiro.start();

// add custom routes, hooks, or plugins here before listen()

await cacheiro.listen();
```

### `CacheiroConfig`

TypeScript interface describing the full configuration shape. Import it to type your own config loader:

```ts
import type { CacheiroConfig } from '@renatorodrigues/cacheiro';
```

### `configSchema`

JSON Schema (draft-07) for `CacheiroConfig`. Use it with AJV or any JSON Schema validator to validate config before constructing `Cacheiro`:

```ts
import { configSchema } from '@renatorodrigues/cacheiro';
import { Ajv } from 'ajv';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(configSchema);
```

## HTTP API

Defined by [`swagger.json`](./swagger.json) (OpenAPI 3.0).

| Method | Path              | Description              |
| ------ | ----------------- | ------------------------ |
| `PUT`  | `/v1/cache/:hash` | Upload a task artifact   |
| `GET`  | `/v1/cache/:hash` | Download a task artifact |

All endpoints require an `Authorization: Bearer <token>` header when `auth.token` is set.

## Stores

The storage backend is selected via `config.store.type`.

### `filesystem` (default)

Stores artifacts on the local filesystem. See [`@renatorodrigues/cacheiro-store-fs`](../cacheiro-store-fs).

### `s3`

Stores artifacts in an S3 bucket. Compatible with AWS S3 and S3-compatible storage (MinIO, LocalStack, etc.). See [`@renatorodrigues/cacheiro-store-s3`](../cacheiro-store-s3).

> **Note:** S3 store implementation is pending.

### `gcs`

Stores artifacts in a Google Cloud Storage bucket. See [`@renatorodrigues/cacheiro-store-gcs`](../cacheiro-store-gcs).

> **Note:** GCS store implementation is pending.

### `azure`

Stores artifacts in an Azure Blob Storage container. See [`@renatorodrigues/cacheiro-store-azure`](../cacheiro-store-azure).

> **Note:** Azure store implementation is pending.

### Adding a new store

1. Implement the [`Store`](../cacheiro-types/src/index.ts) interface from `@renatorodrigues/cacheiro-types`.
2. Publish the store as a separate package (see [`@renatorodrigues/cacheiro-store-fs`](../cacheiro-store-fs) as reference).
3. Add a `case` to `createStore()` in `src/store.ts`.

## Development

```sh
npm run watch          # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # run tests
npm run test:watch   # watch mode
npm run lint         # oxlint
npm run fmt          # oxfmt
```
