import type { Readable } from 'node:stream';

export interface ExpiringReadable extends Readable {
  expired?: boolean;
}

export interface CacheiroStore {
  mount(): Promise<void>;
  unmount?(): void;
  exists(hash: string): Promise<boolean>;
  write(hash: string, data: Buffer): Promise<void>;
  read(hash: string): ExpiringReadable;
}

export interface Describable {
  describe(): [string, string][];
}
