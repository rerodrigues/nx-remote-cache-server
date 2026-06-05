# `@renatorodrigues/cacheiro-store-fs`

Filesystem store for [`@renatorodrigues/cacheiro`](../cacheiro). Stores NX task artifacts as flat files in a local directory with optional TTL expiration and background sweep.

## Usage

```ts
import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';

const store = new FileSystemStore({
  dir: './cache',
  ttlDays: 7,
  sweepIntervalHours: 24,
});

await store.init();
```

## Config

| Field                | Type     | Description                                                           |
| -------------------- | -------- | --------------------------------------------------------------------- |
| `dir`                | `string` | Directory where artifacts are stored.                                 |
| `ttlDays`            | `number` | Artifact TTL in days. `0` disables expiration.                        |
| `sweepIntervalHours` | `number` | How often to sweep for expired artifacts (hours). `0` disables sweep. |

## TTL behavior

- **Lazy expiry**: `exists()` and `read()` check `mtime` on every call. Expired artifacts are deleted and treated as missing.
- **Background sweep**: When both `ttlDays > 0` and `sweepIntervalHours > 0`, a `setInterval` timer scans the directory and deletes expired files. Timer is `unref()`-ed so it does not keep the process alive.
- **Sweep errors** are logged via `console.warn` and do not crash the server.

## Development

```sh
npm test          # vitest run
npm run test:watch
npm run lint
npm run fmt
```
