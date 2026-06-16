import { PassThrough, type Readable } from 'node:stream';
import { posix } from 'node:path';
import {
  BlobServiceClient,
  type ContainerClient,
  type BlockBlobClient,
  type BlobClient,
} from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import configSchema from '../configSchema.json' with { type: 'json' };
import { DecryptTransform, deriveKey, encryptBuffer } from './encryption.js';
import { classifyError, isNotFound } from './errors.js';

export { configSchema };

export interface AzureStoreConfig {
  container: string;
  accountName?: string;
  connectionString?: string;
  prefix?: string;
  encryptionKey?: string;
  encryptionScope?: string;
}

export class AzureStore implements CacheiroStore, Describable {
  private serviceClient: BlobServiceClient | undefined;
  private containerClient: ContainerClient | undefined;
  private encryptionKey: Buffer | undefined;

  constructor(private readonly config: AzureStoreConfig) {}

  async mount(): Promise<void> {
    if (!this.config.container) throw new Error('AzureStore: "container" is required');
    if (!this.config.connectionString && !this.config.accountName) {
      throw new Error('AzureStore: "accountName" or "connectionString" is required');
    }

    if (typeof this.config.encryptionKey === 'string' && this.config.encryptionKey.length > 0) {
      this.encryptionKey = deriveKey(this.config.encryptionKey);
    }

    if (this.config.connectionString) {
      this.serviceClient = BlobServiceClient.fromConnectionString(this.config.connectionString);
    } else {
      this.serviceClient = new BlobServiceClient(
        `https://${this.config.accountName}.blob.core.windows.net`,
        new DefaultAzureCredential(),
      );
    }
    this.containerClient = this.serviceClient.getContainerClient(this.config.container);
  }

  unmount(): void {
    this.containerClient = undefined;
    this.serviceClient = undefined;
  }

  describe(): [string, string][] {
    const rows: [string, string][] = [['container', this.config.container]];
    if (this.config.accountName) rows.push(['accountName', this.config.accountName]);
    if (this.config.connectionString) rows.push(['connectionString', '<redacted>']);
    if (this.config.prefix) rows.push(['prefix', this.config.prefix]);
    if (this.config.encryptionScope) rows.push(['encryptionScope', this.config.encryptionScope]);
    rows.push(['encryption', this.encryptionLabel()]);
    return rows;
  }

  private encryptionLabel(): string {
    const scope = this.config.encryptionScope;
    if (this.encryptionKey) {
      return scope ? `client-side aes-256-cbc + scope "${scope}"` : 'client-side aes-256-cbc';
    }
    return scope ? `scope "${scope}"` : 'service-managed';
  }

  async exists(hash: string): Promise<boolean> {
    const container = this.requireContainer();
    const blobClient: BlobClient = container.getBlobClient(this.buildKey(hash));
    try {
      return await blobClient.exists();
    } catch (err) {
      if (isNotFound(err)) return false;
      throw classifyError(err, 'head', this.config.container);
    }
  }

  async write(hash: string, data: Buffer): Promise<void> {
    const container = this.requireContainer();
    const body = this.encryptionKey ? encryptBuffer(data, this.encryptionKey) : data;
    const blockBlobClient: BlockBlobClient = container.getBlockBlobClient(this.buildKey(hash));
    try {
      await blockBlobClient.uploadData(
        body,
        this.config.encryptionScope ? { encryptionScope: this.config.encryptionScope } : undefined,
      );
    } catch (err) {
      throw classifyError(err, 'write', this.config.container);
    }
  }

  read(hash: string): Readable {
    const out = new PassThrough();
    void this.fetchInto(hash, out);
    return out;
  }

  private async fetchInto(hash: string, out: PassThrough): Promise<void> {
    let container: ContainerClient;
    try {
      container = this.requireContainer();
    } catch (err) {
      out.destroy(err as Error);
      return;
    }

    try {
      const blobClient = container.getBlobClient(this.buildKey(hash));
      const res = await blobClient.download();
      const body = res.readableStreamBody as Readable | undefined;
      if (!body) {
        out.destroy(new Error('AzureStore: empty response body'));
        return;
      }
      const onErr = (e: unknown) => out.destroy(classifyError(e, 'read', this.config.container));
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
      out.destroy(classifyError(err, 'read', this.config.container));
    }
  }

  private buildKey(hash: string): string {
    if (!hash || hash.includes('/') || hash.includes('\\') || hash.includes('..')) {
      throw new Error('Invalid hash');
    }
    return this.config.prefix ? posix.join(this.config.prefix, hash) : hash;
  }

  private requireContainer(): ContainerClient {
    if (!this.containerClient) throw new Error('AzureStore: not mounted — call mount() first');
    return this.containerClient;
  }
}
