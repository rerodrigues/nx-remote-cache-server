import { createCipheriv, randomBytes } from 'node:crypto';
import { ALGORITHM, IV_LENGTH } from './format.js';

export function encryptBuffer(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  return Buffer.concat([iv, cipher.update(data), cipher.final()]);
}
