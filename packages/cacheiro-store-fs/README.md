# `@renatorodrigues/cacheiro-store-fs`

Filesystem store for [`@renatorodrigues/cacheiro`](../cacheiro). Stores NX task artifacts as flat files in a local directory with optional TTL expiration and background sweep.

## Usage

```ts
import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';

const store = new FileSystemStore({
  cacheDirectory: './cache',
  ttlDays: 7,
  sweepIntervalHours: 24,
});

await store.mount();
```

## Config

| Field                | Type     | Required | Description                                                           |
| -------------------- | -------- | -------- | --------------------------------------------------------------------- |
| `cacheDirectory`     | `string` | Yes      | Directory where artifacts are stored.                                 |
| `ttlDays`            | `number` | Yes      | Artifact TTL in days. `0` disables expiration.                        |
| `sweepIntervalHours` | `number` | Yes      | How often to sweep for expired artifacts (hours). `0` disables sweep. |

## Environment variables

Conventional env var names for these config fields:

| Variable                              | Config field         |
| ------------------------------------- | -------------------- |
| `CACHEIRO_CACHE_DIRECTORY`            | `cacheDirectory`     |
| `CACHEIRO_CACHE_TTL_DAYS`             | `ttlDays`            |
| `CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS` | `sweepIntervalHours` |

## Config validation

This package exports a JSON Schema (draft-07) and a TypeScript type for the config shape. Use them to validate and cast a raw config object before constructing the store — the example below uses AJV, but any JSON Schema validator works:

```ts
import { configSchema, type FileSystemStoreConfig } from '@renatorodrigues/cacheiro-store-fs';
import { Ajv } from 'ajv';

const validate = new Ajv({ allErrors: true }).compile(configSchema);

if (!validate(raw)) throw new Error('invalid store config');
const store = new FileSystemStore(raw as unknown as FileSystemStoreConfig);
```

## TTL behavior

- **Lazy expiry**: `exists()` and `read()` check `mtime` on every call. Expired artifacts are deleted and treated as missing.
- **Background sweep**: When both `ttlDays > 0` and `sweepIntervalHours > 0`, a `setInterval` timer scans the directory and deletes expired files. Timer is `unref()`-ed so it does not keep the process alive.
- **Sweep errors** are logged via `console.warn` and do not crash the server.

## Development

```sh
npm run watch          # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # vitest run
npm run test:watch
npm run lint
npm run fmt
```
