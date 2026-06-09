import type { Readable } from 'node:stream';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import configSchema from '../configSchema.json' with { type: 'json' };

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
}

export class S3Store implements CacheiroStore, Describable {
  constructor(private readonly config: S3StoreConfig) {}

  async mount(): Promise<void> {}

  unmount(): void {}

  describe(): [string, string][] {
    const rows: [string, string][] = [
      ['bucket', this.config.bucket],
      ['region', this.config.region],
    ];
    if (this.config.prefix) rows.push(['prefix', this.config.prefix]);
    return rows;
  }

  async exists(_hash: string): Promise<boolean> {
    throw new Error('S3Store: not implemented');
  }

  async write(_hash: string, _data: Buffer): Promise<void> {
    throw new Error('S3Store: not implemented');
  }

  read(_hash: string): Readable {
    throw new Error('S3Store: not implemented');
  }
}
