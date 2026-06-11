import { PassThrough, type Readable } from 'node:stream';
import { posix } from 'node:path';
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import configSchema from '../configSchema.json' with { type: 'json' };
import { DecryptTransform, deriveKey, encryptBuffer } from './encryption.js';
import { classifyError, isNotFound } from './errors.js';
import { buildCredentials } from './credentials.js';

export { configSchema };

export interface S3StoreConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  prefix?: string;
  encryptionKey?: string;
  ssoProfile?: string;
  disableChecksum?: boolean;
  serverSideEncryption?: boolean;
}

export class S3Store implements CacheiroStore, Describable {
  private client: S3Client | undefined;
  private encryptionKey: Buffer | undefined;
  private useSse: boolean = false;

  constructor(private readonly config: S3StoreConfig) {}

  async mount(): Promise<void> {
    if (!this.config.bucket) throw new Error('S3Store: "bucket" is required');
    if (!this.config.region) throw new Error('S3Store: "region" is required');

    const hasKey =
      typeof this.config.encryptionKey === 'string' && this.config.encryptionKey.length > 0;
    const sseEnabled = this.config.serverSideEncryption === true;
    if (hasKey && sseEnabled) {
      console.warn(
        'S3Store: both "encryptionKey" and "serverSideEncryption" set — using client-side encryption only',
      );
      this.useSse = false;
    } else {
      this.useSse = sseEnabled;
    }
    if (hasKey) this.encryptionKey = deriveKey(this.config.encryptionKey!);

    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      forcePathStyle: this.config.forcePathStyle,
      credentials: buildCredentials(this.config),
      responseChecksumValidation: this.config.disableChecksum ? 'WHEN_REQUIRED' : 'WHEN_SUPPORTED',
    });
  }

  unmount(): void {
    this.client?.destroy();
    this.client = undefined;
  }

  describe(): [string, string][] {
    const rows: [string, string][] = [
      ['bucket', this.config.bucket],
      ['region', this.config.region],
    ];
    if (this.config.endpoint) rows.push(['endpoint', this.config.endpoint]);
    if (this.config.prefix) rows.push(['prefix', this.config.prefix]);
    rows.push([
      'encryption',
      this.encryptionKey ? 'client-side aes-256-cbc' : this.useSse ? 'sse-s3' : 'none',
    ]);
    return rows;
  }

  async exists(hash: string): Promise<boolean> {
    const client = this.requireClient();
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: this.buildKey(hash),
        }),
      );
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw classifyError(err, 'head', this.config.bucket);
    }
  }

  async write(hash: string, data: Buffer): Promise<void> {
    const client = this.requireClient();
    const body = this.encryptionKey ? encryptBuffer(data, this.encryptionKey) : data;
    const params: PutObjectCommandInput = {
      Bucket: this.config.bucket,
      Key: this.buildKey(hash),
      Body: body,
    };
    if (this.useSse) params.ServerSideEncryption = 'AES256';
    try {
      await client.send(new PutObjectCommand(params));
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
    let client: S3Client;
    try {
      client = this.requireClient();
    } catch (err) {
      out.destroy(err as Error);
      return;
    }

    try {
      const res = await client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: this.buildKey(hash),
        }),
      );
      const body = res.Body as Readable | undefined;
      if (!body) {
        out.destroy(new Error('S3Store: empty response body'));
        return;
      }
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

  private requireClient(): S3Client {
    if (!this.client) throw new Error('S3Store: not mounted — call mount() first');
    return this.client;
  }
}
