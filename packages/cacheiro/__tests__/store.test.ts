import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LocalStore } from '../src/store/local.js';

let dir: string;
let store: LocalStore;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cacheiro-test-'));
  store = new LocalStore(dir);
  await store.init();
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('LocalStore', () => {
  it('exists() returns false for unknown hash', async () => {
    expect(await store.exists('missing')).toBe(false);
  });

  it('write() + exists() returns true', async () => {
    await store.write('abc', Buffer.from('data'));
    expect(await store.exists('abc')).toBe(true);
  });

  it('write() + read() returns correct content', async () => {
    const payload = Buffer.from('hello world');
    await store.write('abc', payload);
    const chunks: Buffer[] = [];
    for await (const chunk of store.read('abc')) {
      chunks.push(chunk as Buffer);
    }
    expect(Buffer.concat(chunks)).toEqual(payload);
  });

  it('write() creates dir if missing', async () => {
    await rm(dir, { recursive: true, force: true });
    await store.write('abc', Buffer.from('data'));
    expect(await store.exists('abc')).toBe(true);
  });

  it('init() is idempotent', async () => {
    await expect(store.init()).resolves.toBeUndefined();
  });
});
