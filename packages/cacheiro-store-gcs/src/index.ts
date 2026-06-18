import { PassThrough, type Readable } from 'node:stream';
import { posix } from 'node:path';
import { Storage, type StorageOptions } from '@google-cloud/storage';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import configSchema from '../configSchema.json' with { type: 'json' };
import { DecryptTransform, deriveKey, encryptBuffer } from './encryption.js';
import { classifyError, isNotFound } from './errors.js';

export { configSchema };

export interface GcsStoreConfig {
  bucket: string;
  endpoint?: string;
  prefix?: string;
  encryptionKey?: string;
}

export class GcsStore implements CacheiroStore, Describable {
  private storage: Storage | undefined;
  private encryptionKey: Buffer | undefined;

  constructor(private readonly config: GcsStoreConfig) {}

  async mount(): Promise<void> {
    if (!this.config.bucket) throw new Error('GcsStore: "bucket" is required');

    if (typeof this.config.encryptionKey === 'string' && this.config.encryptionKey.length > 0) {
      this.encryptionKey = deriveKey(this.config.encryptionKey);
    }

    const options: StorageOptions = {};
    if (this.config.endpoint) options.apiEndpoint = this.config.endpoint;
    this.storage = new Storage(options);
  }

  unmount(): void {
    this.storage = undefined;
  }

  describe(): [string, string][] {
    const rows: [string, string][] = [['bucket', this.config.bucket]];
    if (this.config.endpoint) rows.push(['endpoint', this.config.endpoint]);
    if (this.config.prefix) rows.push(['prefix', this.config.prefix]);
    rows.push(['encryption', this.encryptionKey ? 'client-side aes-256-cbc' : 'none']);
    return rows;
  }

  async exists(hash: string): Promise<boolean> {
    const file = this.requireStorage().bucket(this.config.bucket).file(this.buildKey(hash));
    try {
      const [exists] = await file.exists();
      return exists;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw classifyError(err, 'head', this.config.bucket);
    }
  }

  async write(hash: string, data: Buffer): Promise<void> {
    const body = this.encryptionKey ? encryptBuffer(data, this.encryptionKey) : data;
    const file = this.requireStorage().bucket(this.config.bucket).file(this.buildKey(hash));
    try {
      await file.save(body);
    } catch (err) {
      throw classifyError(err, 'write', this.config.bucket);
    }
  }

  read(hash: string): Readable {
    const out = new PassThrough();
    void this.fetchInto(hash, out);
    return out;
  }

  private async fetchInto(hash: string, out: PassThrough): Promise<void> {
    let storage: Storage;
    try {
      storage = this.requireStorage();
    } catch (err) {
      out.destroy(err as Error);
      return;
    }

    try {
      const body = storage.bucket(this.config.bucket).file(this.buildKey(hash)).createReadStream();
      const onErr = (e: unknown) => out.destroy(classifyError(e, 'read', this.config.bucket));
      if (this.encryptionKey) {
        const decrypt = new DecryptTransform(this.encryptionKey);
        body.on('error', onErr);
        decrypt.on('error', onErr);
        body.pipe(decrypt).pipe(out);
      } else {
        body.on('error', onErr);
        body.pipe(out);
      }
    } catch (err) {
      out.destroy(classifyError(err, 'read', this.config.bucket));
    }
  }

  private buildKey(hash: string): string {
    if (!hash || hash.includes('/') || hash.includes('\\') || hash.includes('..')) {
      throw new Error('Invalid hash');
    }
    return this.config.prefix ? posix.join(this.config.prefix, hash) : hash;
  }

  private requireStorage(): Storage {
    if (!this.storage) throw new Error('GcsStore: not mounted — call mount() first');
    return this.storage;
  }
}
