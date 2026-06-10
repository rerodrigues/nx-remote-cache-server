# `@renatorodrigues/cacheiro-store-azure`

Azure Blob Storage store for [`@renatorodrigues/cacheiro`](../cacheiro). Stores NX task artifacts in an Azure Blob Storage container.

> **Note:** Implementation is pending. Methods currently throw `AzureStore: not implemented`.

## Usage

```ts
import { AzureStore } from '@renatorodrigues/cacheiro-store-azure';

const store = new AzureStore({
  container: 'my-nx-cache',
  accountName: 'myazurestorageaccount',
});

await store.mount();
```

## Config

| Field              | Type     | Required | Description                                                                        |
| ------------------ | -------- | -------- | ---------------------------------------------------------------------------------- |
| `container`        | `string` | Yes      | Azure Blob Storage container name.                                                 |
| `accountName`      | `string` | No       | Azure Storage account name. Used to construct the blob endpoint URL.               |
| `connectionString` | `string` | No       | Full Azure Blob Storage connection string. Overrides `accountName` if provided.    |
| `prefix`           | `string` | No       | Key prefix for all cache entries. Useful when sharing a container across projects. |
| `encryptionKey`    | `string` | No       | AES-256-CBC encryption key. When set, all artifacts are encrypted at rest.         |

See [Environment variables reference](#environment-variables-reference) for conventional env var names.

## Config validation

This package exports a JSON Schema (draft-07) and a TypeScript type for the config shape. Use them to validate and cast a raw config object before constructing the store — the example below uses AJV, but any JSON Schema validator works:

```ts
import { configSchema, type AzureStoreConfig } from '@renatorodrigues/cacheiro-store-azure';
import { Ajv } from 'ajv';

const validate = new Ajv({ allErrors: true }).compile(configSchema);

// example — error handling is up to your runner
if (!validate(raw)) throw new Error('invalid store config');
const store = new AzureStore(raw as unknown as AzureStoreConfig);
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

| Variable                          | Config field       |
| --------------------------------- | ------------------ |
| `AZURE_CONTAINER`                 | `container`        |
| `AZURE_ACCOUNT_NAME`              | `accountName`      |
| `AZURE_STORAGE_CONNECTION_STRING` | `connectionString` |
| `AZURE_PREFIX`                    | `prefix`           |
| `AZURE_ENCRYPTION_KEY`            | `encryptionKey`    |
