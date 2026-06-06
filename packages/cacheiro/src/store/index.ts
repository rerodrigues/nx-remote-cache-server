import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';
import { S3Store } from '@renatorodrigues/cacheiro-store-s3';
import { GcsStore } from '@renatorodrigues/cacheiro-store-gcs';
import { cfg } from '../config.js';
import type { Store } from '@renatorodrigues/cacheiro-types';

export type { Store };

export function createStore(): Store {
  switch (cfg.store.type) {
    case 'filesystem':
      if (!cfg.store.filesystem)
        throw new Error('store.filesystem config is required when store.type is "filesystem"');
      return new FileSystemStore(cfg.store.filesystem);
    case 's3':
      if (!cfg.store.s3) throw new Error('store.s3 config is required when store.type is "s3"');
      return new S3Store(cfg.store.s3);
    case 'gcs':
      if (!cfg.store.gcs) throw new Error('store.gcs config is required when store.type is "gcs"');
      return new GcsStore(cfg.store.gcs);
  }
}
