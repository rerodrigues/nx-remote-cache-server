import { createReadStream, existsSync } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import configSchema from '../configSchema.json' with { type: 'json' };
import { shardPath } from './paths.js';
import { atomicWrite } from './write.js';
import { isExpired, sweepShards } from './sweep.js';

export { configSchema };

export interface FileSystemStoreConfig {
  cacheDirectory: string;
  ttlDays: number;
  sweepIntervalHours: number;
}

export class FileSystemStore implements CacheiroStore, Describable {
  private readonly dir: string;
  private readonly ttlMs: number;
  private readonly sweepIntervalMs: number;
  private sweepTimer: NodeJS.Timeout | undefined;

  constructor(config: FileSystemStoreConfig) {
    this.dir = config.cacheDirectory;
    this.ttlMs = config.ttlDays * 24 * 60 * 60 * 1000;
    this.sweepIntervalMs = config.sweepIntervalHours * 60 * 60 * 1000;
  }

  async mount(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    if (this.ttlMs > 0 && this.sweepIntervalMs > 0) {
      this.sweepTimer = setInterval(() => {
        sweepShards(this.dir, this.ttlMs).catch((err) => {
          console.warn('cache sweep failed:', err);
        });
      }, this.sweepIntervalMs);
      this.sweepTimer.unref();
    }
  }

  unmount(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  describe(): [string, string][] {
    const ttlMs = this.ttlMs;
    const sweepMs = this.sweepIntervalMs;
    return [
      ['dir', this.dir],
      ['ttl', ttlMs === 0 ? 'disabled' : `${ttlMs / 86_400_000}d`],
      ['sweep', ttlMs === 0 || sweepMs === 0 ? 'disabled' : `every ${sweepMs / 3_600_000}h`],
    ];
  }

  async exists(hash: string): Promise<boolean> {
    const { finalPath } = shardPath(this.dir, hash);
    return existsSync(finalPath);
  }

  async write(hash: string, data: Buffer): Promise<void> {
    const { shardDir, finalPath } = shardPath(this.dir, hash);
    await atomicWrite(shardDir, finalPath, data);
  }

  read(hash: string): Readable {
    const { finalPath } = shardPath(this.dir, hash);
    const stream = createReadStream(finalPath);
    if (this.ttlMs > 0 && isExpired(finalPath, this.ttlMs)) {
      stream.once('open', () => unlink(finalPath).catch(() => {}));
    }
    return stream;
  }
}
