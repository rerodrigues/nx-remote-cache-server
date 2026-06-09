import type { Readable } from 'node:stream';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import configSchema from '../configSchema.json' with { type: 'json' };

export { configSchema };

export interface AzureStoreConfig {
  container: string;
  accountName?: string;
  connectionString?: string;
  prefix?: string;
  encryptionKey?: string;
}

export class AzureStore implements CacheiroStore, Describable {
  constructor(private readonly config: AzureStoreConfig) {}

  async mount(): Promise<void> {}

  unmount(): void {}

  describe(): [string, string][] {
    const rows: [string, string][] = [['container', this.config.container]];
    if (this.config.accountName) rows.push(['accountName', this.config.accountName]);
    if (this.config.connectionString) rows.push(['connectionString', this.config.connectionString]);
    if (this.config.prefix) rows.push(['prefix', this.config.prefix]);
    return rows;
  }

  async exists(_hash: string): Promise<boolean> {
    throw new Error('AzureStore: not implemented');
  }

  async write(_hash: string, _data: Buffer): Promise<void> {
    throw new Error('AzureStore: not implemented');
  }

  read(_hash: string): Readable {
    throw new Error('AzureStore: not implemented');
  }
}
