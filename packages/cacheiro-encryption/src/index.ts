import { scryptSync } from 'node:crypto';
import { encryptBuffer } from './cipher.js';
import { KEY_LENGTH } from './format.js';
import { DecryptTransform } from './stream.js';

export interface EncryptionOptions {
  store: string;
  salt: string;
}

export interface Encryption {
  deriveKey(passphrase: string): Buffer;
  encrypt(data: Buffer, key: Buffer): Buffer;
  createDecryptStream(key: Buffer): DecryptTransform;
}

export function createEncryption({ store, salt }: EncryptionOptions): Encryption {
  const saltBytes = Buffer.from(salt, 'utf8');
  return {
    deriveKey: (passphrase) => scryptSync(passphrase, saltBytes, KEY_LENGTH),
    encrypt: encryptBuffer,
    createDecryptStream: (key) => new DecryptTransform(key, store),
  };
}

export type { DecryptTransform };
