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

## Development

```sh
npm run watch          # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # vitest run
npm run test:watch
npm run lint
npm run fmt
```
