import type { Readable } from 'node:stream';
import { LocalStore } from './local.js';
import { cfg } from '../config.js';

export interface Store {
  init(): Promise<void>;
  exists(hash: string): Promise<boolean>;
  write(hash: string, data: Buffer): Promise<void>;
  read(hash: string): Readable;
}

export function createStore(): Store {
  const type = cfg.store.type;
  switch (type) {
    case 'local':
      return new LocalStore();
    default:
      throw new Error(`Unknown store type: "${type}"`);
  }
}
