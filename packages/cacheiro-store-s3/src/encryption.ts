import { Transform, type TransformCallback } from 'node:stream';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const KEY_SALT = Buffer.from('cacheiro-store-s3:v1', 'utf8');

export function deriveKey(key: string): Buffer {
  return scryptSync(key, KEY_SALT, KEY_LENGTH);
}

export function encryptBuffer(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  return Buffer.concat([iv, cipher.update(data), cipher.final()]);
}

function mapDecryptError(err: unknown): Error {
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code?: string }).code === 'ERR_OSSL_BAD_DECRYPT'
  ) {
    return new Error('S3Store: failed to decrypt — encryption key may be incorrect');
  }
  return err instanceof Error ? err : new Error(String(err));
}

export class DecryptTransform extends Transform {
  private decipher: ReturnType<typeof createDecipheriv> | null = null;
  private ivBuf: Buffer = Buffer.alloc(0);

  constructor(private readonly key: Buffer) {
    super();
  }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    try {
      if (!this.decipher) {
        this.ivBuf = Buffer.concat([this.ivBuf, chunk]);
        if (this.ivBuf.length < IV_LENGTH) {
          callback();
          return;
        }
        const iv = this.ivBuf.subarray(0, IV_LENGTH);
        const rest = this.ivBuf.subarray(IV_LENGTH);
        this.decipher = createDecipheriv(ALGORITHM, this.key, iv);
        if (rest.length > 0) this.push(this.decipher.update(rest));
      } else {
        this.push(this.decipher.update(chunk));
      }
      callback();
    } catch (err) {
      callback(err as Error);
    }
  }

  override _flush(callback: TransformCallback): void {
    try {
      if (this.decipher) this.push(this.decipher.final());
      callback();
    } catch (err) {
      callback(mapDecryptError(err));
    }
  }
}
