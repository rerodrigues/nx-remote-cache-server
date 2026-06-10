# `@renatorodrigues/cacheiro-types`

Shared TypeScript interfaces for the cacheiro ecosystem.

## `CacheiroStore`

Contract every store implementation must satisfy:

```ts
import type { Readable } from 'node:stream';

export interface CacheiroStore {
  mount(): Promise<void>;
  unmount?(): void;
  exists(hash: string): Promise<boolean>;
  write(hash: string, data: Buffer): Promise<void>;
  read(hash: string): Readable;
}
```

| Method       | Description                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| `mount()`    | Called on server startup. Create directories, start timers, etc.               |
| `unmount()`  | Optional. Called on server shutdown. Stop timers, flush buffers, etc.          |
| `exists()`   | Returns `true` if artifact exists and is not expired.                          |
| `write()`    | Persist artifact data for the given hash.                                      |
| `read()`     | Return a `Readable` stream for the artifact. Throw if not found or expired.    |

## `Describable`

Optional interface for stores that want to expose config info to the startup banner:

```ts
export interface Describable {
  describe(): [string, string][];
}
```

Returns a list of `[label, value]` rows displayed in the banner info box. The banner duck-types `'describe' in store` — implementing this interface is optional.

## Available stores

| Package                                                  | Description                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| [`cacheiro-store-fs`](../cacheiro-store-fs)              | Local filesystem                                             |
| [`cacheiro-store-s3`](../cacheiro-store-s3)              | AWS S3 and S3-compatible storage (MinIO, LocalStack, etc.)   |
| [`cacheiro-store-gcs`](../cacheiro-store-gcs)            | Google Cloud Storage                                         |
| [`cacheiro-store-azure`](../cacheiro-store-azure)        | Azure Blob Storage                                           |

> **Note:** S3, GCS, and Azure store implementations are pending.

## Adding a custom store

Implement the `CacheiroStore` interface:

```ts
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';

export class MyStore implements CacheiroStore {
  async mount(): Promise<void> { ... }
  async exists(hash: string): Promise<boolean> { ... }
  async write(hash: string, data: Buffer): Promise<void> { ... }
  read(hash: string): Readable { ... }
}
```

See [`cacheiro-store-fs`](../cacheiro-store-fs) as a reference implementation.

## Development

```sh
npm run watch        # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
```

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
