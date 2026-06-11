import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileSystemStore } from '../src/index.js';
import { sweepShards } from '../src/sweep.js';

const H1 = '0123456789abcdef0123456789abcdef';
const H2 = 'fedcba9876543210fedcba9876543210';
const H3 = 'cafebabedeadbeefcafebabedeadbeef';

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
    expect(await store.exists(H1)).toBe(false);
  });

  it('write() + exists() returns true', async () => {
    await store.write(H1, Buffer.from('data'));
    expect(await store.exists(H1)).toBe(true);
  });

  it('write() + read() returns correct content', async () => {
    const payload = Buffer.from('hello world');
    await store.write(H1, payload);
    const chunks: Buffer[] = [];
    for await (const chunk of store.read(H1)) {
      chunks.push(chunk as Buffer);
    }
    expect(Buffer.concat(chunks)).toEqual(payload);
  });

  it('write() creates shard dir if missing', async () => {
    await rm(dir, { recursive: true, force: true });
    await store.write(H1, Buffer.from('data'));
    expect(await store.exists(H1)).toBe(true);
  });

  it('mount() is idempotent', async () => {
    await expect(store.mount()).resolves.toBeUndefined();
  });

  it('places artifact at <dir>/<h[0:2]>/<h[2:4]>/<hash>', async () => {
    await store.write(H1, Buffer.from('data'));
    const expected = join(dir, H1.slice(0, 2), H1.slice(2, 4), H1);
    expect(existsSync(expected)).toBe(true);
  });

  it('leaves no .tmp- files behind after a successful write', async () => {
    await store.write(H1, Buffer.from('data'));
    const shard = join(dir, H1.slice(0, 2), H1.slice(2, 4));
    const entries = await readdir(shard);
    expect(entries.some((e) => e.includes('.tmp-'))).toBe(false);
    expect(entries).toContain(H1);
  });

  it('a stray .tmp- file does not register as a hit', async () => {
    const shard = join(dir, H1.slice(0, 2), H1.slice(2, 4));
    await store.write(H2, Buffer.from('seed'));
    const stray = join(shard.replace(H1.slice(2, 4), H2.slice(2, 4)), `${H1}.tmp-deadbeef`);
    await rm(stray, { force: true });
    expect(await store.exists(H1)).toBe(false);
  });

  it('concurrent writes to the same hash leave a complete file', async () => {
    const a = Buffer.alloc(64 * 1024, 0xaa);
    const b = Buffer.alloc(64 * 1024, 0xbb);
    await Promise.all([store.write(H1, a), store.write(H1, b)]);
    const chunks: Buffer[] = [];
    for await (const chunk of store.read(H1)) chunks.push(chunk as Buffer);
    const result = Buffer.concat(chunks);
    expect(result.length).toBe(64 * 1024);
    const first = result[0];
    expect(result.every((byte) => byte === first)).toBe(true);
    expect(first === 0xaa || first === 0xbb).toBe(true);
  });

  it('rejects hash containing path separators', async () => {
    await expect(store.write('abc/../etc', Buffer.from('x'))).rejects.toThrow('Invalid hash');
    await expect(store.exists('abc/../etc')).rejects.toThrow('Invalid hash');
  });

  it('rejects hash containing ..', async () => {
    await expect(store.write('..abcd', Buffer.from('x'))).rejects.toThrow('Invalid hash');
  });

  it('rejects hash shorter than 4 chars', async () => {
    await expect(store.write('abc', Buffer.from('x'))).rejects.toThrow('Invalid hash');
  });
});

describe('FileSystemStore TTL', () => {
  const TWO_DAYS_AGO = new Date(Date.now() - 2 * 86_400_000);

  async function writeAndBackdate(s: FileSystemStore, hash: string): Promise<string> {
    await s.write(hash, Buffer.from('data'));
    const filePath = join(dir, hash.slice(0, 2), hash.slice(2, 4), hash);
    await utimes(filePath, TWO_DAYS_AGO, TWO_DAYS_AGO);
    return filePath;
  }

  it('exists() returns true for expired file (lazy expiry)', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await writeAndBackdate(ttlStore, H1);
    expect(await ttlStore.exists(H1)).toBe(true);
    ttlStore.unmount();
  });

  it('exists() returns true for non-expired file', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 7,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await ttlStore.write(H1, Buffer.from('data'));
    expect(await ttlStore.exists(H1)).toBe(true);
    ttlStore.unmount();
  });

  it('exists() returns true for backdated file when ttlDays is 0 (disabled)', async () => {
    await writeAndBackdate(store, H1);
    expect(await store.exists(H1)).toBe(true);
  });

  it('read() serves expired file then deletes it asynchronously', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await writeAndBackdate(ttlStore, H1);
    const chunks: Buffer[] = [];
    for await (const chunk of ttlStore.read(H1)) {
      chunks.push(chunk as Buffer);
    }
    expect(Buffer.concat(chunks).toString()).toBe('data');
    await new Promise((r) => setTimeout(r, 50));
    expect(await ttlStore.exists(H1)).toBe(false);
    ttlStore.unmount();
  });

  it('sweep() deletes expired files and keeps fresh ones', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await writeAndBackdate(ttlStore, H1);
    await ttlStore.write(H2, Buffer.from('data'));

    await sweepShards(dir, 86_400_000);

    expect(await ttlStore.exists(H1)).toBe(false);
    expect(await ttlStore.exists(H2)).toBe(true);
    ttlStore.unmount();
  });

  it('sweep() also removes expired stray .tmp- files (orphans from killed writes)', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await writeAndBackdate(ttlStore, H3);
    const shard = join(dir, H3.slice(0, 2), H3.slice(2, 4));
    const stray = join(shard, `${H3}.tmp-deadbeef`);
    await writeFile(stray, 'partial');
    await utimes(stray, TWO_DAYS_AGO, TWO_DAYS_AGO);

    await sweepShards(dir, 86_400_000);

    expect(existsSync(stray)).toBe(false);
    expect(await ttlStore.exists(H3)).toBe(false);
    ttlStore.unmount();
  });

  it('sweep() keeps fresh stray .tmp- files (an in-flight write is not stolen)', async () => {
    const ttlStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 1,
    });
    await ttlStore.mount();
    await ttlStore.write(H2, Buffer.from('seed'));
    const shard = join(dir, H2.slice(0, 2), H2.slice(2, 4));
    const fresh = join(shard, `${H2}.tmp-cafef00d`);
    await writeFile(fresh, 'in-flight');

    await sweepShards(dir, 86_400_000);

    expect(existsSync(fresh)).toBe(true);
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
    await noSweepStore.write(H1, Buffer.from('data'));
    const past = new Date(Date.now() - 2 * 86_400_000);
    await utimes(join(dir, H1.slice(0, 2), H1.slice(2, 4), H1), past, past);

    await sweepShards(dir, 86_400_000);

    expect(await noSweepStore.exists(H1)).toBe(false);
    noSweepStore.unmount();
  });

  it('read() serves expired file and deletes it even when sweep is disabled', async () => {
    const noSweepStore = new FileSystemStore({
      cacheDirectory: dir,
      ttlDays: 1,
      sweepIntervalHours: 0,
    });
    await noSweepStore.mount();
    await noSweepStore.write(H1, Buffer.from('data'));
    const past = new Date(Date.now() - 2 * 86_400_000);
    await utimes(join(dir, H1.slice(0, 2), H1.slice(2, 4), H1), past, past);

    const chunks: Buffer[] = [];
    for await (const chunk of noSweepStore.read(H1)) {
      chunks.push(chunk as Buffer);
    }
    expect(Buffer.concat(chunks).toString()).toBe('data');
    await new Promise((r) => setTimeout(r, 50));
    expect(await noSweepStore.exists(H1)).toBe(false);
    noSweepStore.unmount();
  });
});
