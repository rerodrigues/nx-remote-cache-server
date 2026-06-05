import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import type { Store } from './index.js';

export interface FileSystemConfig {
  dir: string;
}

export class FileSystemStore implements Store {
  private readonly dir: string;

  constructor(config: FileSystemConfig) {
    this.dir = config.dir;
  }

  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async exists(hash: string): Promise<boolean> {
    return existsSync(join(this.dir, hash));
  }

  async write(hash: string, data: Buffer): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, hash), data);
  }

  read(hash: string): Readable {
    return createReadStream(join(this.dir, hash));
  }
}
