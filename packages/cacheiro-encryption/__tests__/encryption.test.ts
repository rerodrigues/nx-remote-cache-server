import { describe, expect, it } from 'vitest';
import { createDecipheriv, scryptSync } from 'node:crypto';
import { Readable } from 'node:stream';
import { createEncryption } from '../src/index.js';

const enc = createEncryption({ store: 'TestStore', salt: 'cacheiro-store-test:v1' });
const key = enc.deriveKey('super-secret');
const payload = Buffer.from('hello world');

async function decrypt(blob: Buffer, k: Buffer, split = 5): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const out = Readable.from([blob.subarray(0, split), blob.subarray(split)]).pipe(
    enc.createDecryptStream(k),
  );
  for await (const chunk of out) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

describe('deriveKey', () => {
  it('derives a 32-byte scrypt key from the passphrase and salt', () => {
    expect(key).toHaveLength(32);
    expect(key.equals(scryptSync('super-secret', 'cacheiro-store-test:v1', 32))).toBe(true);
  });

  it('derives different keys for different salts', () => {
    const other = createEncryption({ store: 'TestStore', salt: 'cacheiro-store-other:v1' });
    expect(other.deriveKey('super-secret').equals(key)).toBe(false);
  });
});

describe('encrypt', () => {
  it('prefixes the ciphertext with a 16-byte IV', () => {
    const blob = enc.encrypt(payload, key);
    expect(blob).toHaveLength(16 + 16);
    const decipher = createDecipheriv('aes-256-cbc', key, blob.subarray(0, 16));
    expect(Buffer.concat([decipher.update(blob.subarray(16)), decipher.final()])).toEqual(payload);
  });

  it('uses a fresh IV for every call', () => {
    expect(enc.encrypt(payload, key).equals(enc.encrypt(payload, key))).toBe(false);
  });
});

describe('createDecryptStream', () => {
  it('roundtrips', async () => {
    expect((await decrypt(enc.encrypt(payload, key), key)).equals(payload)).toBe(true);
  });

  it('roundtrips an empty artifact', async () => {
    expect(await decrypt(enc.encrypt(Buffer.alloc(0), key), key)).toHaveLength(0);
  });

  it('roundtrips when the IV is split across chunks', async () => {
    const blob = enc.encrypt(payload, key);
    expect((await decrypt(blob, key, 3)).equals(payload)).toBe(true);
  });

  it('prefixes the error with the store name when the key is wrong', async () => {
    const blob = enc.encrypt(Buffer.alloc(1024, 7), key);
    const wrong = enc.deriveKey('other-secret');
    await expect(decrypt(blob, wrong)).rejects.toThrow(
      'TestStore: failed to decrypt — encryption key may be incorrect',
    );
  });
});
