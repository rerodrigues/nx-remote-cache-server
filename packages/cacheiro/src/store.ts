import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';
import { S3Store } from '@renatorodrigues/cacheiro-store-s3';
import { GcsStore } from '@renatorodrigues/cacheiro-store-gcs';
import { AzureStore } from '@renatorodrigues/cacheiro-store-azure';
import type { CacheiroConfig } from './config.js';
import type { Store } from '@renatorodrigues/cacheiro-types';

export type { Store };

export function createStore(config: CacheiroConfig['store']): Store {
  switch (config.type) {
    case 'filesystem':
      return new FileSystemStore(config.filesystem);
    case 's3':
      return new S3Store(config.s3);
    case 'gcs':
      return new GcsStore(config.gcs);
    case 'azure':
      return new AzureStore(config.azure);
  }
}
