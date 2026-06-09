import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import configSchema from '../configSchema.json' with { type: 'json' };

export { configSchema };

export interface FileSystemConfig {
  cacheDirectory: string;
  ttlDays: number;
  sweepIntervalHours: number;
}

export class FileSystemStore implements CacheiroStore, Describable {
  private readonly dir: string;
  private readonly ttlMs: number;
  private readonly sweepIntervalMs: number;
  private sweepTimer: NodeJS.Timeout | undefined;

  constructor(config: FileSystemConfig) {
    this.dir = config.cacheDirectory;
    this.ttlMs = config.ttlDays * 24 * 60 * 60 * 1000;
    this.sweepIntervalMs = config.sweepIntervalHours * 60 * 60 * 1000;
  }

  private isExpired(filePath: string): boolean {
    if (this.ttlMs === 0) return false;
    const stat = statSync(filePath);
    return Date.now() - stat.mtimeMs > this.ttlMs;
  }

  async mount(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    if (this.ttlMs > 0 && this.sweepIntervalMs > 0) {
      this.sweepTimer = setInterval(() => {
        this.sweep().catch((err) => {
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
    const filePath = join(this.dir, hash);
    if (!existsSync(filePath)) return false;
    if (this.isExpired(filePath)) {
      unlink(filePath).catch(() => {});
      return false;
    }
    return true;
  }

  async write(hash: string, data: Buffer): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, hash), data);
  }

  read(hash: string): Readable {
    const filePath = join(this.dir, hash);
    if (this.ttlMs > 0 && this.isExpired(filePath)) {
      unlink(filePath).catch(() => {});
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    return createReadStream(filePath);
  }

  private async sweep(): Promise<void> {
    const files = await readdir(this.dir).catch(() => []);
    for (const file of files) {
      const filePath = join(this.dir, file);
      if (this.isExpired(filePath)) await unlink(filePath).catch(() => {});
    }
  }
}
