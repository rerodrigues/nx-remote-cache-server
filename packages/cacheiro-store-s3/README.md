# `@renatorodrigues/cacheiro-store-s3`

S3 store for [`@renatorodrigues/cacheiro`](../cacheiro). Stores NX task artifacts in an AWS S3 bucket (or any S3-compatible storage: MinIO, LocalStack, DigitalOcean Spaces, Cloudflare R2).

> **Note:** Implementation is pending. Methods currently throw `S3Store: not implemented`.

## Usage

```ts
import { S3Store } from '@renatorodrigues/cacheiro-store-s3';

const store = new S3Store({
  bucket: 'my-nx-cache',
  region: 'us-east-1',
});

await store.mount();
```

## Config

| Field             | Type      | Required | Description                                                                                               |
| ----------------- | --------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `bucket`          | `string`  | Yes      | S3 bucket name.                                                                                           |
| `region`          | `string`  | Yes      | AWS region (e.g. `us-east-1`).                                                                            |
| `endpoint`        | `string`  | No       | Custom S3-compatible endpoint URL (MinIO, LocalStack, etc.).                                              |
| `accessKeyId`     | `string`  | No       | AWS access key ID. Falls back to `AWS_ACCESS_KEY_ID` env / IAM role.                                      |
| `secretAccessKey` | `string`  | No       | AWS secret access key. Falls back to `AWS_SECRET_ACCESS_KEY` env / IAM role.                              |
| `forcePathStyle`  | `boolean` | No       | Use path-style URLs instead of virtual-hosted. Required for most S3-compatible storage. Default: `false`. |
| `prefix`          | `string`  | No       | Key prefix for all cache entries. Useful when sharing a bucket across projects.                           |
| `encryptionKey`   | `string`  | No       | AES-256-CBC encryption key. When set, all artifacts are encrypted at rest.                                |

## Development

```sh
npm run watch          # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # vitest run
npm run test:watch
npm run lint
npm run fmt
```
