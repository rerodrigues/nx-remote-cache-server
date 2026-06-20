import { describe, it, expect, beforeEach } from 'vitest';
import { Readable, PassThrough } from 'node:stream';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../src/server.js';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';
import type { CacheiroConfig } from '../src/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

class MemoryStore implements CacheiroStore {
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

const testConfig: CacheiroConfig = {
  server: { port: 3000, host: 'localhost', bodyLimitMb: 10, banner: false, infobox: false },
  auth: { token: 'test-token' },
};

const AUTH = 'Bearer test-token';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const store = new MemoryStore();
    const app = await createServer(store, testConfig);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.body).toBe('OK');
  });
});

describe('PUT /v1/cache/:hash', () => {
  let store: MemoryStore;

  beforeEach(async () => {
    store = new MemoryStore();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const app = await createServer(store, testConfig);
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/cache/abc123',
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': '5' },
      payload: Buffer.from('hello'),
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 and stores artifact', async () => {
    const app = await createServer(store, testConfig);
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
    const app = await createServer(store, testConfig);
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
    const app = await createServer(store, testConfig);
    const res = await app.inject({ method: 'GET', url: '/v1/cache/abc123' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 when artifact does not exist', async () => {
    const app = await createServer(store, testConfig);
    const res = await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: AUTH },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with artifact content', async () => {
    const app = await createServer(store, testConfig);
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

describe('TLS', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it('creates an HTTP server when tls config is absent', async () => {
    const { Server: TLSServer } = await import('node:tls');
    const app = await createServer(store, testConfig);
    expect(app.server).not.toBeInstanceOf(TLSServer);
  });

  it('creates an HTTPS server when tls config is present', async () => {
    const { Server: TLSServer } = await import('node:tls');
    const tlsConfig: CacheiroConfig = {
      ...testConfig,
      server: {
        ...testConfig.server,
        tls: {
          certFile: join(FIXTURES, 'cert.pem'),
          keyFile: join(FIXTURES, 'key.pem'),
        },
      },
    };
    const app = await createServer(store, tlsConfig);
    expect(app.server).toBeInstanceOf(TLSServer);
  });

  it('throws a clear error when certFile does not exist', async () => {
    const tlsConfig: CacheiroConfig = {
      ...testConfig,
      server: {
        ...testConfig.server,
        tls: { certFile: '/nonexistent/cert.pem', keyFile: join(FIXTURES, 'key.pem') },
      },
    };
    await expect(createServer(store, tlsConfig)).rejects.toThrow(
      'TLS certFile file not found: /nonexistent/cert.pem',
    );
  });

  it('throws a clear error when keyFile does not exist', async () => {
    const tlsConfig: CacheiroConfig = {
      ...testConfig,
      server: {
        ...testConfig.server,
        tls: { certFile: join(FIXTURES, 'cert.pem'), keyFile: '/nonexistent/key.pem' },
      },
    };
    await expect(createServer(store, tlsConfig)).rejects.toThrow(
      'TLS keyFile file not found: /nonexistent/key.pem',
    );
  });
});
