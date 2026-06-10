# `@renatorodrigues/cacheiro-store-gcs`

Google Cloud Storage store for [`@renatorodrigues/cacheiro`](../cacheiro). Stores NX task artifacts in a GCS bucket.

> **Note:** Implementation is pending. Methods currently throw `GcsStore: not implemented`.

## Usage

```ts
import { GcsStore } from '@renatorodrigues/cacheiro-store-gcs';

const store = new GcsStore({
  bucket: 'my-nx-cache',
});

await store.mount();
```

## Config

| Field           | Type     | Required | Description                                                                     |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------- |
| `bucket`        | `string` | Yes      | GCS bucket name.                                                                |
| `endpoint`      | `string` | No       | Custom GCS-compatible endpoint URL (e.g. for local emulators).                  |
| `prefix`        | `string` | No       | Key prefix for all cache entries. Useful when sharing a bucket across projects. |
| `encryptionKey` | `string` | No       | AES-256-CBC encryption key. When set, all artifacts are encrypted at rest.      |

See [Environment variables reference](#environment-variables-reference) for conventional env var names.

## Config validation

This package exports a JSON Schema (draft-07) and a TypeScript type for the config shape. Use them to validate and cast a raw config object before constructing the store — the example below uses AJV, but any JSON Schema validator works:

```ts
import { configSchema, type GcsStoreConfig } from '@renatorodrigues/cacheiro-store-gcs';
import { Ajv } from 'ajv';

const validate = new Ajv({ allErrors: true }).compile(configSchema);

// example — error handling is up to your runner
if (!validate(raw)) throw new Error('invalid store config');
const store = new GcsStore(raw as unknown as GcsStoreConfig);
```

## Development

```sh
npm run watch          # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # vitest run
npm run test:watch
npm run lint
npm run fmt
```

## Environment variables reference

| Variable             | Config field    |
| -------------------- | --------------- |
| `GCS_BUCKET`         | `bucket`        |
| `GCS_ENDPOINT`       | `endpoint`      |
| `GCS_PREFIX`         | `prefix`        |
| `GCS_ENCRYPTION_KEY` | `encryptionKey` |
