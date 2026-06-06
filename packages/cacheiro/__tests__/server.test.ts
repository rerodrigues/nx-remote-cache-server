import { describe, it, expect, beforeEach } from 'vitest';
import { Readable, PassThrough } from 'node:stream';
import { createServer } from '../src/server.js';
import type { Store } from '../src/store/index.js';

class MemoryStore implements Store {
  private data = new Map<string, Buffer>();

  async mount(): Promise<void> {}

  async exists(hash: string): Promise<boolean> {
    return this.data.has(hash);
  }

  async write(hash: string, data: Buffer): Promise<void> {
    this.data.set(hash, data);
  }

  read(hash: string): Readable {
    const stream = new PassThrough();
    stream.end(this.data.get(hash)!);
    return stream;
  }
}

const AUTH = 'Bearer test-token';

describe('PUT /v1/cache/:hash', () => {
  let store: MemoryStore;

  beforeEach(async () => {
    store = new MemoryStore();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const app = await createServer(store);
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/cache/abc123',
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': '5' },
      payload: Buffer.from('hello'),
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 and stores artifact', async () => {
    const app = await createServer(store);
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/cache/abc123',
      headers: {
        Authorization: AUTH,
        'Content-Type': 'application/octet-stream',
        'Content-Length': '5',
      },
      payload: Buffer.from('hello'),
    });
    expect(res.statusCode).toBe(200);
    expect(await store.exists('abc123')).toBe(true);
  });

  it('returns 409 when artifact already exists', async () => {
    const app = await createServer(store);
    await store.write('abc123', Buffer.from('hello'));
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/cache/abc123',
      headers: {
        Authorization: AUTH,
        'Content-Type': 'application/octet-stream',
        'Content-Length': '5',
      },
      payload: Buffer.from('hello'),
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('GET /v1/cache/:hash', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const app = await createServer(store);
    const res = await app.inject({ method: 'GET', url: '/v1/cache/abc123' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 when artifact does not exist', async () => {
    const app = await createServer(store);
    const res = await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: AUTH },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with artifact content', async () => {
    const app = await createServer(store);
    await store.write('abc123', Buffer.from('hello'));
    const res = await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: AUTH },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/octet-stream');
    expect(res.rawPayload).toEqual(Buffer.from('hello'));
  });
});
