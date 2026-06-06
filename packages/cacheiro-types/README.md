# `@renatorodrigues/cacheiro-types`

Shared TypeScript interfaces for the cacheiro ecosystem.

## `Store`

Contract every store implementation must satisfy:

```ts
import type { Readable } from 'node:stream';

export interface Store {
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
