# `@renatorodrigues/cacheiro-encryption`

Client-side encryption (AES-256-CBC) shared by the Cacheiro cloud stores: [`cacheiro-store-s3`](https://github.com/rerodrigues/nx-remote-cache-server/tree/main/packages/cacheiro-store-s3), [`cacheiro-store-gcs`](https://github.com/rerodrigues/nx-remote-cache-server/tree/main/packages/cacheiro-store-gcs) and [`cacheiro-store-azure`](https://github.com/rerodrigues/nx-remote-cache-server/tree/main/packages/cacheiro-store-azure).

You normally do not install this package directly. It is a dependency of those stores, and you enable encryption by setting `encryptionKey` on the store. Use it directly only when building a custom store that needs the same on-disk format.

## Install

```sh
npm install @renatorodrigues/cacheiro-encryption
```

Requires Node.js 22+.

## Usage

```ts
import { createEncryption } from '@renatorodrigues/cacheiro-encryption';

const encryption = createEncryption({ store: 'MyStore', salt: 'my-store:v1' });
const key = encryption.deriveKey(process.env.MY_STORE_ENCRYPTION_KEY!);

const blob = encryption.encrypt(artifact, key);

source.pipe(encryption.createDecryptStream(key)).pipe(destination);
```

## API

### `createEncryption(options)`

| Option  | Type     | Description                                                                                            |
| ------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `store` | `string` | Store name, used as the prefix of error messages (e.g. `S3Store`).                                     |
| `salt`  | `string` | Scrypt salt for key derivation. Changing it makes every artifact written with the old salt unreadable. |

Returns an `Encryption` object:

| Member                     | Description                                                                    |
| -------------------------- | ------------------------------------------------------------------------------ |
| `deriveKey(passphrase)`    | Derives a 32-byte key from the passphrase with scrypt and the configured salt. |
| `encrypt(data, key)`       | Returns the blob `[IV][ciphertext]`, using a fresh random IV per call.         |
| `createDecryptStream(key)` | Transform stream that reads a blob and emits the plaintext.                    |

## Format

```
[16-byte IV][ciphertext]
```

AES-256-CBC with PKCS#7 padding. The format is not authenticated: it provides confidentiality but does not detect a modified artifact. A wrong key usually fails with a padding error, but that is not guaranteed.

## Errors

When the key is wrong, decryption fails with `<store>: failed to decrypt — encryption key may be incorrect`, where `<store>` is the `store` option.

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
