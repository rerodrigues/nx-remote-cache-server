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

export interface CacheHitEvent {
  hash: string;
  expired: boolean;
}

export interface CacheMissEvent {
  hash: string;
}

export interface CacheSetEvent {
  hash: string;
}

export interface ServerErrorEvent {
  error: Error;
}

export interface CacheiroEvents {
  cacheHit: CacheHitEvent;
  cacheMiss: CacheMissEvent;
  cacheSet: CacheSetEvent;
  serverStart: undefined;
  serverStop: undefined;
  serverError: ServerErrorEvent;
}

export interface CacheiroHooks {
  onCacheHit?(event: CacheHitEvent): void;
  onCacheMiss?(event: CacheMissEvent): void;
  onCacheSet?(event: CacheSetEvent): void;
  onServerStart?(): void;
  onServerStop?(): void;
  onServerError?(event: ServerErrorEvent): void;
}
