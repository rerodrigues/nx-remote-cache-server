import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';
import { cfg } from '../config.js';
import type { Store } from '@renatorodrigues/cacheiro-types';

export type { Store };

export function createStore(): Store {
  const type = cfg.store.type;
  switch (type) {
    case 'filesystem':
      return new FileSystemStore(cfg.store.filesystem);
    default:
      throw new Error(`Unknown store type: "${type}"`);
  }
}
