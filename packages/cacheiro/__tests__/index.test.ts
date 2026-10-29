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

  it('emits cacheMiss when the artifact disappears between exists() and read()', async () => {
    const misses: { hash: string }[] = [];
    const vanishingStore = new MemoryStore();
    vanishingStore.exists = async () => true;
    vanishingStore.read = () => {
      const stream = new PassThrough();
      stream.destroy(Object.assign(new Error('gone'), { code: 'ENOENT' }));
      return stream;
    };
    const cacheiro = new Cacheiro(vanishingStore, testConfig);
    cacheiro.on('cacheMiss', (e) => misses.push(e));
    const app = await cacheiro.start();

    const res = await app.inject({
      method: 'GET',
      url: '/v1/cache/vanished',
      headers: { Authorization: AUTH },
    });

    expect(res.statusCode).toBe(404);
    expect(misses).toEqual([{ hash: 'vanished' }]);
  });

  it('forwards a rejected async listener to serverError instead of crashing', async () => {
    const errors: Error[] = [];
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    const cacheiro = new Cacheiro(store, testConfig);
    cacheiro.on('cacheMiss', async () => {
      throw new Error('async boom');
    });
    cacheiro.on('serverError', ({ error }) => errors.push(error));
    const app = await cacheiro.start();

    const res = await app.inject({
      method: 'GET',
      url: '/v1/cache/missing',
      headers: { Authorization: AUTH },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    process.off('unhandledRejection', onUnhandled);

    expect(res.statusCode).toBe(404);
    expect(errors.map((e) => e.message)).toEqual(['async boom']);
    expect(unhandled).toEqual([]);
  });

  it('does not loop or crash when a serverError listener itself rejects', async () => {
    const calls: number[] = [];
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    const cacheiro = new Cacheiro(store, testConfig);
    cacheiro.on('cacheMiss', async () => {
      throw new Error('async boom');
    });
    cacheiro.on('serverError', async () => {
      calls.push(1);
      throw new Error('handler boom');
    });
    const app = await cacheiro.start();

    await app.inject({
      method: 'GET',
      url: '/v1/cache/missing',
      headers: { Authorization: AUTH },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    process.off('unhandledRejection', onUnhandled);

    expect(calls).toEqual([1]);
    expect(unhandled).toEqual([]);
  });

  it('does not crash when an async rejection reaches a serverError listener that throws', async () => {
    const uncaught: unknown[] = [];
    const onUncaught = (error: unknown) => uncaught.push(error);
    process.on('uncaughtException', onUncaught);
    const cacheiro = new Cacheiro(store, testConfig);
    cacheiro.on('cacheMiss', async () => {
      throw new Error('async boom');
    });
    cacheiro.on('serverError', () => {
      throw new Error('listener boom');
    });
    const app = await cacheiro.start();

    const res = await app.inject({
      method: 'GET',
      url: '/v1/cache/missing',
      headers: { Authorization: AUTH },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    process.off('uncaughtException', onUncaught);

    expect(res.statusCode).toBe(404);
    expect(uncaught).toEqual([]);
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
