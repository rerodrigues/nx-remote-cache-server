# `@renatorodrigues/cacheiro-store-fs`

Filesystem store for [`@renatorodrigues/cacheiro`](https://www.npmjs.com/package/@renatorodrigues/cacheiro). Stores artifacts in a sharded directory layout with atomic temp+rename writes, `fsync` for durability, and optional TTL with background sweep.

## On-disk layout

Artifacts are stored at `<cacheDirectory>/<hash[0:2]>/<hash[2:4]>/<hash>`. The two-level shard prefix (256 × 256 = 65 536 buckets) keeps any single directory small even at millions of entries, avoiding filesystem slowdowns from oversized `readdir` results.

## Atomic writes

Each `write` lands in `<final>.tmp-<random>` (same shard), is `fsync`-ed, then atomically `rename`-d to its final path. Readers always see a complete file — never a partial write. If the process dies mid-write, the leftover `.tmp-*` is invisible to `exists` and gets reaped by the sweep.

## TTL behavior

- **Lazy expiry**: expired artifacts are served one last time then deleted asynchronously. Since the cache is hash-based, the content is always valid for a given hash — this avoids forcing the client to re-run a task just to re-upload the identical file.
- **Background sweep**: when both `ttlDays > 0` and `sweepIntervalHours > 0`, a `setInterval` timer walks the two-level shard tree and deletes expired files. Timer is `unref()`-ed so it does not keep the process alive.
- **Sweep errors** are logged via `console.warn` and do not crash the server.

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

## Config validation

This package exports a JSON Schema (draft-07) and a TypeScript type for the config shape. Use them to validate and cast a raw config object before constructing the store — the example below uses AJV, but any JSON Schema validator works:

```ts
import { configSchema, type FileSystemStoreConfig } from '@renatorodrigues/cacheiro-store-fs';
import { Ajv } from 'ajv';

const validate = new Ajv({ allErrors: true }).compile(configSchema);

// example — error handling is up to your runner
if (!validate(raw)) throw new Error('invalid store config');
const store = new FileSystemStore(raw as unknown as FileSystemStoreConfig);
```

## Development

```sh
npm run watch        # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # vitest run
npm run test:watch
npm run lint
npm run fmt
```

## Config

| Field                | Type     | Required | Description                                                           |
| -------------------- | -------- | -------- | --------------------------------------------------------------------- |
| `cacheDirectory`     | `string` | Yes      | Directory where artifacts are stored.                                 |
| `ttlDays`            | `number` | Yes      | Artifact TTL in days. `0` disables expiration.                        |
| `sweepIntervalHours` | `number` | Yes      | How often to sweep for expired artifacts (hours). `0` disables sweep. |

See [Environment variables reference](#environment-variables-reference) for conventional env var names.

## Environment variables reference

| Variable                              | Config field         |
| ------------------------------------- | -------------------- |
| `CACHEIRO_CACHE_DIRECTORY`            | `cacheDirectory`     |
| `CACHEIRO_CACHE_TTL_DAYS`             | `ttlDays`            |
| `CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS` | `sweepIntervalHours` |

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
