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

## Development

```sh
npm run watch          # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # vitest run
npm run test:watch
npm run lint
npm run fmt
```
