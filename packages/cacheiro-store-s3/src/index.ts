import type { Readable } from 'node:stream';
import type { Store } from '@renatorodrigues/cacheiro-types';

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

export class S3Store implements Store {
  constructor(private readonly config: S3StoreConfig) {}

  async init(): Promise<void> {}

  stop(): void {}

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
