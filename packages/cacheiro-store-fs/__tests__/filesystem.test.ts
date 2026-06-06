import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, utimes } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileSystemStore } from '../src/index.js';

let dir: string;
let store: FileSystemStore;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cacheiro-test-'));
  store = new FileSystemStore({ cacheDirectory: dir, ttlDays: 0, sweepIntervalHours: 1 });
  await store.mount();
});

afterEach(async () => {
  store.unmount();
  await rm(dir, { recursive: true, force: true });
});

describe('FileSystemStore', () => {
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

  it('mount() is idempotent', async () => {
    await expect(store.mount()).resolves.toBeUndefined();
  });
});

describe('FileSystemStore TTL', () => {
  const TWO_DAYS_AGO = new Date(Date.now() - 2 * 86_400_000);

  async function writeAndBackdate(hash: string): Promise<string> {
    await store.write(hash, Buffer.from('data'));
    const filePath = join(dir, hash);
    await utimes(filePath, TWO_DAYS_AGO, TWO_DAYS_AGO);
    return filePath;
  }

  it('exists() returns false for expired file', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await writeAndBackdate('expired');
    expect(await ttlStore.exists('expired')).toBe(false);
    ttlStore.unmount();
  });

  it('exists() returns true for non-expired file', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 7,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await ttlStore.write('fresh', Buffer.from('data'));
    expect(await ttlStore.exists('fresh')).toBe(true);
    ttlStore.unmount();
  });

  it('exists() returns true for backdated file when ttlDays is 0 (disabled)', async () => {
    await writeAndBackdate('old');
    expect(await store.exists('old')).toBe(true);
  });

  it('read() throws for expired file', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await writeAndBackdate('expired');
    expect(() => ttlStore.read('expired')).toThrow(/ENOENT/);
    ttlStore.unmount();
  });

  it('sweep() deletes expired files and keeps fresh ones', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await writeAndBackdate('expired');
    await ttlStore.write('fresh', Buffer.from('data'));

    await (ttlStore as unknown as { sweep(): Promise<void> }).sweep();

    expect(await ttlStore.exists('expired')).toBe(false);
    expect(await ttlStore.exists('fresh')).toBe(true);
    ttlStore.unmount();
  });
});

describe('FileSystemStore sweep disabled (sweepIntervalHours: 0)', () => {
  it('expired files are not swept automatically', async () => {
    const noSweepStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 0,
    });
    await noSweepStore.mount();
    await noSweepStore.write('expired', Buffer.from('data'));
    const past = new Date(Date.now() - 2 * 86_400_000);
    await utimes(join(dir, 'expired'), past, past);

    await (noSweepStore as unknown as { sweep(): Promise<void> }).sweep();

    expect(await noSweepStore.exists('expired')).toBe(false);
    noSweepStore.unmount();
  });

  it('lazy expiry on exists() still works when sweep is disabled', async () => {
    const noSweepStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 0,
    });
    await noSweepStore.mount();
    await noSweepStore.write('expired', Buffer.from('data'));
    const past = new Date(Date.now() - 2 * 86_400_000);
    await utimes(join(dir, 'expired'), past, past);

    expect(await noSweepStore.exists('expired')).toBe(false);
    noSweepStore.unmount();
  });
});
