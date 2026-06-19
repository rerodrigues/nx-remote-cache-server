# `@renatorodrigues/cacheiro-store-gcs`

Google Cloud Storage store for [`@renatorodrigues/cacheiro`](https://www.npmjs.com/package/@renatorodrigues/cacheiro). Stores NX task artifacts in a GCS bucket.

## Usage

```ts
import { GcsStore } from '@renatorodrigues/cacheiro-store-gcs';

const store = new GcsStore({
  bucket: 'my-nx-cache',
});

await store.mount();
```

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
npm run watch        # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # vitest run
npm run test:watch
npm run lint
npm run fmt
```

## Config

| Field           | Type     | Required | Description                                                                     |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------- |
| `bucket`        | `string` | Yes      | GCS bucket name.                                                                |
| `endpoint`      | `string` | No       | Custom GCS-compatible endpoint URL (e.g. for local emulators).                  |
| `prefix`        | `string` | No       | Key prefix for all cache entries. Useful when sharing a bucket across projects. |
| `encryptionKey` | `string` | No       | AES-256-CBC encryption key. When set, all artifacts are encrypted at rest.      |

See [Environment variables reference](#environment-variables-reference) for conventional env var names.

## Encryption

GCS encrypts every object at rest by default with Google-managed keys — no configuration needed. For additional client-side encryption, set `encryptionKey`:

| `encryptionKey` | Behavior                                                     |
| --------------- | ------------------------------------------------------------ |
| unset           | Google-managed server-side encryption only.                  |
| set             | Client-side AES-256-CBC on top of Google-managed encryption. |

Client-side keys are stretched with `scrypt` (fixed salt, default cost) to a 32-byte AES key. The IV is randomly generated per write and prepended to the ciphertext: `[16-byte IV][ciphertext]`. The salt is scoped to this store (`cacheiro-store-gcs:v1`), so GCS and S3 stores with the same passphrase produce incompatible ciphertexts.

## Environment variables reference

| Variable             | Config field    |
| -------------------- | --------------- |
| `GCS_BUCKET`         | `bucket`        |
| `GCS_ENDPOINT`       | `endpoint`      |
| `GCS_PREFIX`         | `prefix`        |
| `GCS_ENCRYPTION_KEY` | `encryptionKey` |

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
