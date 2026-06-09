import type { Readable } from 'node:stream';

export interface CacheiroStore {
  mount(): Promise<void>;
  unmount?(): void;
  exists(hash: string): Promise<boolean>;
  write(hash: string, data: Buffer): Promise<void>;
  read(hash: string): Readable;
}

export interface Describable {
  describe(): [string, string][];
}
