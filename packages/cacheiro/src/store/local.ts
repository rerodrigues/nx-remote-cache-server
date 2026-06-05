import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { cfg } from '../config.js';
import type { Store } from './index.js';

export class LocalStore implements Store {
  private readonly dir: string;

  constructor(dir = cfg.store.local.dir) {
    this.dir = dir;
  }

  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async exists(hash: string): Promise<boolean> {
    return existsSync(join(this.dir, hash));
  }

  async write(hash: string, data: Buffer): Promise<void> {
    await writeFile(join(this.dir, hash), data);
  }

  read(hash: string): Readable {
    return createReadStream(join(this.dir, hash));
  }
}
