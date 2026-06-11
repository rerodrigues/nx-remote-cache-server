# `@renatorodrigues/cacheiro`

Core library for the NX remote cache server. Implements the [NX 20.8+ custom remote cache](https://nx.dev/recipes/running-tasks/self-hosted-caching) specification.

This package provides the server logic and the public API. It is not a runnable application — use [`@renatorodrigues/cacheiro-runner`](../cacheiro-runner) to run it, or build your own runner on top of the exported API.

## Requirements

- Node.js 22+

## API

### `new Cacheiro(store: CacheiroStore, config: CacheiroConfig)`

Creates a server instance. Accepts a `CacheiroStore` implementation and a `CacheiroConfig` object. Config is not validated at runtime — only TypeScript types are enforced. Validate before constructing using `configSchema`.

### `cacheiro.start(): Promise<FastifyInstance>`

Builds the Fastify server and returns the Fastify instance. The server is not yet listening — use the returned instance to add custom routes, hooks, or plugins before calling `listen()`.

### `cacheiro.listen(): Promise<void>`

Binds the server to the configured host and port, then prints the startup banner.

### `cacheiro.stop(): Promise<void>`

Drains open connections and shuts down the server gracefully.

```ts
import { Cacheiro } from '@renatorodrigues/cacheiro';
import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';

const store = new FileSystemStore({
  cacheDirectory: './cache',
  ttlDays: 7,
  sweepIntervalHours: 24,
});

const cacheiro = new Cacheiro(store, {
  server: { port: 3000, host: '127.0.0.1', bodyLimitMb: 100, banner: true, infobox: true },
  auth: { token: 'my-secret-token' },
});

const server = await cacheiro.start();

// add custom routes, hooks, or plugins here before listen()

await cacheiro.listen();
```

### `CacheiroStore`

Interface that all store implementations must satisfy. Import it to build a custom store:

```ts
import type { CacheiroStore } from '@renatorodrigues/cacheiro';
```

### `CacheiroConfig`

TypeScript interface describing the server configuration shape. Import it to type your own config loader:

```ts
import type { CacheiroConfig } from '@renatorodrigues/cacheiro';
```

### `configSchema`

JSON Schema (draft-07) for `CacheiroConfig`. Exported for runners and custom integrations to validate config before constructing `Cacheiro`:

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

Store packages implement the `CacheiroStore` interface and are independent of this package. Instantiate the store of your choice and pass it to the `Cacheiro` constructor.

See [`@renatorodrigues/cacheiro-types`](../cacheiro-types) for the full list of available stores and instructions on implementing a custom store.

## Development

```sh
npm run watch        # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # run tests
npm run test:watch   # watch mode
npm run lint         # oxlint
npm run fmt          # oxfmt
```

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
