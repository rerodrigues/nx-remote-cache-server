import type { Readable } from 'node:stream';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import configSchema from '../configSchema.json' with { type: 'json' };

export { configSchema };

export interface GcsStoreConfig {
  bucket: string;
  endpoint?: string;
  prefix?: string;
  encryptionKey?: string;
}

export class GcsStore implements CacheiroStore, Describable {
  constructor(private readonly config: GcsStoreConfig) {}

  async mount(): Promise<void> {}

  unmount(): void {}

  describe(): [string, string][] {
    const rows: [string, string][] = [['bucket', this.config.bucket]];
    if (this.config.endpoint) rows.push(['endpoint', this.config.endpoint]);
    if (this.config.prefix) rows.push(['prefix', this.config.prefix]);
    return rows;
  }

  async exists(_hash: string): Promise<boolean> {
    throw new Error('GcsStore: not implemented');
  }

  async write(_hash: string, _data: Buffer): Promise<void> {
    throw new Error('GcsStore: not implemented');
  }

  read(_hash: string): Readable {
    throw new Error('GcsStore: not implemented');
  }
}
