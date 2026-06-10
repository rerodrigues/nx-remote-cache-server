# `@renatorodrigues/cacheiro-store-s3`

S3 store for [`@renatorodrigues/cacheiro`](../cacheiro). Stores Nx cache artifacts in an AWS S3 bucket (or any S3-compatible storage: MinIO, LocalStack, DigitalOcean Spaces, Cloudflare R2).

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

| Field                  | Type      | Required | Description                                                                                                                          |
| ---------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `bucket`               | `string`  | Yes      | S3 bucket name.                                                                                                                      |
| `region`               | `string`  | Yes      | AWS region (e.g. `us-east-1`).                                                                                                       |
| `endpoint`             | `string`  | No       | Custom S3-compatible endpoint URL (MinIO, LocalStack, etc.).                                                                         |
| `accessKeyId`          | `string`  | No       | AWS access key ID. Falls back to the AWS credential chain (`AWS_ACCESS_KEY_ID` env var, `AWS_PROFILE`, IAM role, etc.) when omitted. |
| `secretAccessKey`      | `string`  | No       | AWS secret access key. Falls back to the AWS credential chain (`AWS_SECRET_ACCESS_KEY` env var, IAM role, etc.) when omitted.        |
| `forcePathStyle`       | `boolean` | No       | Use path-style URLs instead of virtual-hosted. Required for most S3-compatible storage. Default: `false`.                            |
| `prefix`               | `string`  | No       | Key prefix for all cache entries. Useful when sharing a bucket across projects.                                                      |
| `encryptionKey`        | `string`  | No       | Client-side AES-256-CBC encryption key. When set, artifacts are encrypted before upload.                                             |
| `ssoProfile`           | `string`  | No       | AWS SSO profile name. Falls back to the `AWS_PROFILE` env var when omitted.                                                          |
| `disableChecksum`      | `boolean` | No       | Disable AWS response checksum validation. Default: `false`.                                                                          |
| `serverSideEncryption` | `boolean` | No       | Enable S3 SSE-S3 (`AES256`) server-side encryption. Ignored when `encryptionKey` is set. Default: `false`.                           |

See [Environment variables reference](#environment-variables-reference) for conventional env var names.

## Encryption

Two mutually exclusive modes are supported:

| `encryptionKey` | `serverSideEncryption` | Behavior                                                        |
| --------------- | ---------------------- | --------------------------------------------------------------- |
| set             | `false`                | Client-side AES-256-CBC. Bytes encrypted locally before upload. |
| unset           | `true`                 | S3 SSE-S3. AWS encrypts at rest with managed keys.              |
| set             | `true`                 | Warns and uses client-side only.                                |
| unset           | `false`                | No encryption (relies on bucket policies and TLS in transit).   |

Client-side keys are pad/repeated and truncated to 32 bytes (no KDF). The IV is randomly generated per write and prepended to the ciphertext: `[16-byte IV][ciphertext]`.

## Config validation

This package exports a JSON Schema (draft-07) and a TypeScript type for the config shape. Use them to validate and cast a raw config object before constructing the store — the example below uses AJV, but any JSON Schema validator works:

```ts
import { configSchema, type S3StoreConfig } from '@renatorodrigues/cacheiro-store-s3';
import { Ajv } from 'ajv';

const validate = new Ajv({ allErrors: true }).compile(configSchema);

// example — error handling is up to your runner
if (!validate(raw)) throw new Error('invalid store config');
const store = new S3Store(raw as unknown as S3StoreConfig);
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

## Environment variables reference

| Variable                    | Config field           |
| --------------------------- | ---------------------- |
| `S3_BUCKET`                 | `bucket`               |
| `S3_REGION`                 | `region`               |
| `S3_ENDPOINT`               | `endpoint`             |
| `AWS_ACCESS_KEY_ID`         | `accessKeyId`          |
| `AWS_SECRET_ACCESS_KEY`     | `secretAccessKey`      |
| `AWS_PROFILE`               | `ssoProfile`           |
| `S3_FORCE_PATH_STYLE`       | `forcePathStyle`       |
| `S3_PREFIX`                 | `prefix`               |
| `S3_ENCRYPTION_KEY`         | `encryptionKey`        |
| `S3_DISABLE_CHECKSUM`       | `disableChecksum`      |
| `S3_SERVER_SIDE_ENCRYPTION` | `serverSideEncryption` |

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
