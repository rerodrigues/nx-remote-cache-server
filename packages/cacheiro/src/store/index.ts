import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';
import { S3Store } from '@renatorodrigues/cacheiro-store-s3';
import { GcsStore } from '@renatorodrigues/cacheiro-store-gcs';
import { AzureStore } from '@renatorodrigues/cacheiro-store-azure';
import { cfg } from '../config.js';
import type { Store } from '@renatorodrigues/cacheiro-types';

export type { Store };

export function createStore(): Store {
  switch (cfg.store.type) {
    case 'filesystem':
      return new FileSystemStore(cfg.store.filesystem);
    case 's3':
      return new S3Store(cfg.store.s3);
    case 'gcs':
      return new GcsStore(cfg.store.gcs);
    case 'azure':
      return new AzureStore(cfg.store.azure);
  }
}
