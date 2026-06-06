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
