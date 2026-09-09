# `@renatorodrigues/cacheiro-types`

Shared TypeScript interfaces for the cacheiro ecosystem.

## `CacheiroStore`

Contract every store implementation must satisfy:

```ts
export interface CacheiroStore {
  mount(): Promise<void>;
  unmount?(): void;
  exists(hash: string): Promise<boolean>;
  write(hash: string, data: Buffer): Promise<void>;
  read(hash: string): ExpiringReadable;
}
```

| Method      | Description                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mount()`   | Called on server startup. Create directories, start timers, etc.                                                                                                           |
| `unmount()` | Optional. Called on server shutdown. Stop timers, flush buffers, etc.                                                                                                      |
| `exists()`  | Returns `true` if artifact exists (regardless of expiry — lazy expiry is checked in `read()`).                                                                             |
| `write()`   | Persist artifact data for the given hash.                                                                                                                                  |
| `read()`    | Return an `ExpiringReadable` for the artifact — see [`ExpiringReadable`](#expiringreadable) below. Signal not-found via a stream `'error'` event, not a synchronous throw. |

## `ExpiringReadable`

A `Readable` stream with an optional `.expired` flag, returned by `CacheiroStore.read()`:

```ts
import type { Readable } from 'node:stream';

export interface ExpiringReadable extends Readable {
  expired?: boolean;
}
```

Set `.expired = true` when the artifact being served is past its TTL and is being returned one last time before removal — see [`cacheiro-store-fs`](https://www.npmjs.com/package/@renatorodrigues/cacheiro-store-fs) for TTL behavior. Since `expired` is optional, a plain `Readable` satisfies this interface — stores without TTL support (e.g. `cacheiro-store-s3`/`gcs`/`azure`) can just return a regular stream.

## `Describable`

Optional interface for stores that want to expose config info to the startup banner:

```ts
export interface Describable {
  describe(): [string, string][];
}
```

Returns a list of `[label, value]` rows displayed in the banner info box. The banner duck-types `'describe' in store` — implementing this interface is optional.

## Available stores

| Package                                                                                       | Description                                                |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [`cacheiro-store-fs`](https://www.npmjs.com/package/@renatorodrigues/cacheiro-store-fs)       | Local filesystem                                           |
| [`cacheiro-store-s3`](https://www.npmjs.com/package/@renatorodrigues/cacheiro-store-s3)       | AWS S3 and S3-compatible storage (MinIO, LocalStack, etc.) |
| [`cacheiro-store-gcs`](https://www.npmjs.com/package/@renatorodrigues/cacheiro-store-gcs)     | Google Cloud Storage                                       |
| [`cacheiro-store-azure`](https://www.npmjs.com/package/@renatorodrigues/cacheiro-store-azure) | Azure Blob Storage                                         |

## Adding a custom store

Implement the `CacheiroStore` interface:

```ts
import type { CacheiroStore, ExpiringReadable } from '@renatorodrigues/cacheiro-types';

export class MyStore implements CacheiroStore {
  async mount(): Promise<void> { ... }
  async exists(hash: string): Promise<boolean> { ... }
  async write(hash: string, data: Buffer): Promise<void> { ... }
  read(hash: string): ExpiringReadable { ... }
}
```

See [`cacheiro-store-fs`](https://www.npmjs.com/package/@renatorodrigues/cacheiro-store-fs) as a reference implementation.

## Development

```sh
npm run watch        # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
```

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
