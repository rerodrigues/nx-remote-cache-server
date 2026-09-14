import { describe, it, expect, beforeEach } from 'vitest';
import { PassThrough } from 'node:stream';
import { Cacheiro } from '../src/index.js';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';
import type { CacheiroConfig } from '../src/config.js';

class MemoryStore implements CacheiroStore {
  private data = new Map<string, Buffer>();

  async mount(): Promise<void> {}

  async exists(hash: string): Promise<boolean> {
    return this.data.has(hash);
  }

  async write(hash: string, data: Buffer): Promise<void> {
    this.data.set(hash, data);
  }

  read(hash: string): PassThrough {
    const stream = new PassThrough();
    stream.end(this.data.get(hash)!);
    return stream;
  }
}

const testConfig: CacheiroConfig = {
  server: { port: 0, host: '127.0.0.1', bodyLimitMb: 10, banner: false, infobox: false },
  auth: { token: 'test-token' },
};

const AUTH = 'Bearer test-token';

describe('Cacheiro', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it('wires the constructor hooks object without needing .on()', async () => {
    const sets: { hash: string }[] = [];
    const cacheiro = new Cacheiro(store, testConfig, {
      onCacheSet: (e) => sets.push(e),
    });
    const app = await cacheiro.start();

    await app.inject({
      method: 'PUT',
      url: '/v1/cache/abc123',
      headers: {
        Authorization: AUTH,
        'Content-Type': 'application/octet-stream',
        'Content-Length': '5',
      },
      payload: Buffer.from('hello'),
    });

    expect(sets).toEqual([{ hash: 'abc123' }]);
  });

  it('.on() registers listeners alongside constructor hooks', async () => {
    const misses: { hash: string }[] = [];
    const cacheiro = new Cacheiro(store, testConfig);
    cacheiro.on('cacheMiss', (e) => misses.push(e));
    const app = await cacheiro.start();

    await app.inject({
      method: 'GET',
      url: '/v1/cache/missing',
      headers: { Authorization: AUTH },
    });

    expect(misses).toEqual([{ hash: 'missing' }]);
  });

  it('listen() binds the server and emits serverStart', async () => {
    const cacheiro = new Cacheiro(store, testConfig);
    const starts: undefined[] = [];
    cacheiro.on('serverStart', (e) => starts.push(e));

    await cacheiro.start();
    await cacheiro.listen();
    expect(starts).toEqual([undefined]);

    await cacheiro.stop();
  });

  it('stop() closes the server and emits serverStop', async () => {
    const cacheiro = new Cacheiro(store, testConfig);
    const stops: undefined[] = [];
    cacheiro.on('serverStop', (e) => stops.push(e));

    await cacheiro.start();
    await cacheiro.listen();
    await cacheiro.stop();

    expect(stops).toEqual([undefined]);
  });

  it('stop() resolves without error when the server was never started', async () => {
    const cacheiro = new Cacheiro(store, testConfig);
    await expect(cacheiro.stop()).resolves.toBeUndefined();
  });
});
