# `@renatorodrigues/cacheiro-store-azure`

Azure Blob Storage store for [`@renatorodrigues/cacheiro`](../cacheiro). Stores Nx cache artifacts in an Azure Blob Storage container.

## Usage

```ts
import { AzureStore } from '@renatorodrigues/cacheiro-store-azure';

const store = new AzureStore({
  container: 'my-nx-cache',
  accountName: 'myazurestorageaccount',
});

await store.mount();
```

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
npm run watch        # tsc --watch (hot rebuild)
npm run build        # compile TypeScript
npm test             # vitest run
npm run test:watch
npm run lint
npm run fmt
```

## Config

| Field              | Type     | Required | Description                                                                                                                                                 |
| ------------------ | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `container`        | `string` | Yes      | Azure Blob Storage container name.                                                                                                                          |
| `accountName`      | `string` | No       | Azure Storage account name. Used to construct the blob endpoint URL.                                                                                        |
| `connectionString` | `string` | No       | Full Azure Blob Storage connection string. Overrides `accountName` if provided.                                                                             |
| `prefix`           | `string` | No       | Key prefix for all cache entries. Useful when sharing a container across projects.                                                                          |
| `encryptionKey`    | `string` | No       | Client-side AES-256-CBC encryption key. When set, artifacts are encrypted before upload.                                                                    |
| `encryptionScope`  | `string` | No       | Azure encryption scope name. When set, blobs are written under this scope (typically backed by a customer-managed key in Key Vault). Reads are transparent. |

See [Environment variables reference](#environment-variables-reference) for conventional env var names.

## Authentication

Two mutually exclusive modes are supported:

| Mode                     | Setup                                                                         |
| ------------------------ | ----------------------------------------------------------------------------- |
| Connection string        | Set `connectionString`. Uses `BlobServiceClient.fromConnectionString`.        |
| Default Azure Credential | Set `accountName`. The SDK chains env vars, managed identity, Azure CLI, etc. |

When both are set, `connectionString` wins.

## Encryption

Azure encrypts every blob at rest by default with Microsoft-managed keys — this baseline cannot be turned off. Two optional layers stack on top:

| `encryptionKey` | `encryptionScope` | Behavior                                                                         |
| --------------- | ----------------- | -------------------------------------------------------------------------------- |
| unset           | unset             | Service-managed keys (or account-wide CMK if configured on the storage account). |
| unset           | set               | Server-side encryption uses the named scope's key (typically a Key Vault CMK).   |
| set             | unset             | Client-side AES-256-CBC on top of service-managed encryption.                    |
| set             | set               | Client-side AES-256-CBC on top of scope-keyed server-side encryption.            |

`encryptionScope` is write-time only — Azure tracks which scope each blob was written with and decrypts transparently on read. Use scopes when one storage account holds artifacts under multiple keys (per tenant, per environment). For a single account-wide key, configure CMK on the storage account in the Azure portal and leave `encryptionScope` unset.

Client-side keys are stretched with `scrypt` (fixed salt, default cost) to a 32-byte AES key. The IV is randomly generated per write and prepended to the ciphertext: `[16-byte IV][ciphertext]`. This KDF differs from the deprecated official Nx Azure plugin (which used a different scheme), so containers encrypted with the upstream plugin are not interoperable.

## Environment variables reference

| Variable                          | Config field       |
| --------------------------------- | ------------------ |
| `AZURE_CONTAINER`                 | `container`        |
| `AZURE_ACCOUNT_NAME`              | `accountName`      |
| `AZURE_STORAGE_CONNECTION_STRING` | `connectionString` |
| `AZURE_PREFIX`                    | `prefix`           |
| `AZURE_ENCRYPTION_KEY`            | `encryptionKey`    |
| `AZURE_ENCRYPTION_SCOPE`          | `encryptionScope`  |

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
