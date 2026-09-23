import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PassThrough } from 'node:stream';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../src/server.js';
import { CacheiroEmitter } from '../src/hooks.js';
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

  read(hash: string): PassThrough {
    const stream = new PassThrough();
    stream.end(this.data.get(hash)!);
    return stream;
  }
}

class ExpiringMemoryStore extends MemoryStore {
  override read(hash: string): PassThrough & { expired?: boolean } {
    const stream = super.read(hash) as PassThrough & { expired?: boolean };
    stream.expired = true;
    return stream;
  }
}

class FailingStore implements CacheiroStore {
  async mount(): Promise<void> {}

  async exists(): Promise<boolean> {
    throw new Error('store unavailable');
  }

  async write(): Promise<void> {}

  read(): PassThrough {
    return new PassThrough();
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

describe('hooks', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it('emits cacheMiss when the artifact does not exist', async () => {
    const emitter = new CacheiroEmitter();
    const misses: { hash: string }[] = [];
    emitter.on('cacheMiss', (e) => misses.push(e));
    const app = await createServer(store, testConfig, emitter);

    await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: AUTH },
    });

    expect(misses).toEqual([{ hash: 'abc123' }]);
  });

  it('emits cacheHit with expired:false on a normal hit', async () => {
    const emitter = new CacheiroEmitter();
    const hits: { hash: string; expired: boolean }[] = [];
    emitter.on('cacheHit', (e) => hits.push(e));
    const app = await createServer(store, testConfig, emitter);
    await store.write('abc123', Buffer.from('hello'));

    await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: AUTH },
    });

    expect(hits).toEqual([{ hash: 'abc123', expired: false }]);
  });

  it('emits cacheSet after a successful PUT', async () => {
    const emitter = new CacheiroEmitter();
    const sets: { hash: string }[] = [];
    emitter.on('cacheSet', (e) => sets.push(e));
    const app = await createServer(store, testConfig, emitter);

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

  it('does not emit cacheSet when the artifact already exists (409)', async () => {
    const emitter = new CacheiroEmitter();
    const sets: { hash: string }[] = [];
    emitter.on('cacheSet', (e) => sets.push(e));
    const app = await createServer(store, testConfig, emitter);
    await store.write('abc123', Buffer.from('hello'));

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

    expect(sets).toEqual([]);
  });

  it('emits cacheHit with expired:true when the store marks the stream expired', async () => {
    const expiringStore = new ExpiringMemoryStore();
    await expiringStore.write('abc123', Buffer.from('hello'));
    const emitter = new CacheiroEmitter();
    const hits: { hash: string; expired: boolean }[] = [];
    emitter.on('cacheHit', (e) => hits.push(e));
    const app = await createServer(expiringStore, testConfig, emitter);

    await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: AUTH },
    });

    expect(hits).toEqual([{ hash: 'abc123', expired: true }]);
  });

  it('emits serverError and returns 500 when a handler throws', async () => {
    const failingStore = new FailingStore();
    const emitter = new CacheiroEmitter();
    const errors: { error: Error }[] = [];
    emitter.on('serverError', (e) => errors.push(e));
    const app = await createServer(failingStore, testConfig, emitter);

    const res = await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: AUTH },
    });

    expect(res.statusCode).toBe(500);
    expect(errors).toHaveLength(1);
    expect(errors[0].error.message).toBe('store unavailable');
  });

  it('off() stops a listener from receiving further events', async () => {
    const emitter = new CacheiroEmitter();
    const misses: { hash: string }[] = [];
    const listener = (e: { hash: string }) => misses.push(e);
    emitter.on('cacheMiss', listener);
    emitter.off('cacheMiss', listener);
    const app = await createServer(store, testConfig, emitter);

    await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: AUTH },
    });

    expect(misses).toEqual([]);
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

  it('throws a clear error when a TLS file is empty', async () => {
    const tlsConfig: CacheiroConfig = {
      ...testConfig,
      server: {
        ...testConfig.server,
        tls: { certFile: join(FIXTURES, 'empty.pem'), keyFile: join(FIXTURES, 'key.pem') },
      },
    };
    await expect(createServer(store, tlsConfig)).rejects.toThrow(
      `TLS certFile file is empty: ${join(FIXTURES, 'empty.pem')}`,
    );
  });

  it('reads caFile when present', async () => {
    const { Server: TLSServer } = await import('node:tls');
    const tlsConfig: CacheiroConfig = {
      ...testConfig,
      server: {
        ...testConfig.server,
        tls: {
          certFile: join(FIXTURES, 'cert.pem'),
          keyFile: join(FIXTURES, 'key.pem'),
          caFile: join(FIXTURES, 'cert.pem'),
        },
      },
    };
    const app = await createServer(store, tlsConfig);
    expect(app.server).toBeInstanceOf(TLSServer);
  });
});

describe('auth.readOnlyToken', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  const readOnlyConfig: CacheiroConfig = {
    ...testConfig,
    auth: { token: 'test-token', readOnlyToken: 'ro-token' },
  };
  const READ_ONLY_AUTH = 'Bearer ro-token';

  it('throws when readOnlyToken equals token', async () => {
    const config: CacheiroConfig = {
      ...testConfig,
      auth: { token: 'same', readOnlyToken: 'same' },
    };
    await expect(createServer(store, config)).rejects.toThrow(
      'auth.readOnlyToken must differ from auth.token',
    );
  });

  it('throws when readOnlyToken is an empty string', async () => {
    const config: CacheiroConfig = {
      ...testConfig,
      auth: { token: 'test-token', readOnlyToken: '' },
    };
    await expect(createServer(store, config)).rejects.toThrow(
      'auth.readOnlyToken must not be empty when set',
    );
  });

  it('throws when readOnlyToken is set without token', async () => {
    const config: CacheiroConfig = {
      ...testConfig,
      auth: { readOnlyToken: 'ro-token' },
    };
    await expect(createServer(store, config)).rejects.toThrow(
      'auth.readOnlyToken requires auth.token to be set',
    );
  });

  it('throws when readOnlyToken is set with an empty token', async () => {
    const config: CacheiroConfig = {
      ...testConfig,
      auth: { token: '', readOnlyToken: 'ro-token' },
    };
    await expect(createServer(store, config)).rejects.toThrow(
      'auth.readOnlyToken requires auth.token to be set',
    );
  });

  it('allows GET with the read-only token', async () => {
    const app = await createServer(store, readOnlyConfig);
    await store.write('abc123', Buffer.from('hello'));
    const res = await app.inject({
      method: 'GET',
      url: '/v1/cache/abc123',
      headers: { Authorization: READ_ONLY_AUTH },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 for PUT with the read-only token', async () => {
    const app = await createServer(store, readOnlyConfig);
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/cache/abc123',
      headers: {
        Authorization: READ_ONLY_AUTH,
        'Content-Type': 'application/octet-stream',
        'Content-Length': '5',
      },
      payload: Buffer.from('hello'),
    });
    expect(res.statusCode).toBe(403);
    expect(await store.exists('abc123')).toBe(false);
  });

  it('still allows PUT with the read-write token', async () => {
    const app = await createServer(store, readOnlyConfig);
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
  });
});

describe('auth (optional)', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it('allows GET and PUT without a token when auth is omitted', async () => {
    const config: CacheiroConfig = {
      server: testConfig.server,
    };
    const app = await createServer(store, config);

    const put = await app.inject({
      method: 'PUT',
      url: '/v1/cache/abc123',
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': '5' },
      payload: Buffer.from('hello'),
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({ method: 'GET', url: '/v1/cache/abc123' });
    expect(get.statusCode).toBe(200);
  });

  it('allows GET and PUT without a token when auth is an empty object', async () => {
    const config: CacheiroConfig = { ...testConfig, auth: {} };
    const app = await createServer(store, config);

    const put = await app.inject({
      method: 'PUT',
      url: '/v1/cache/abc123',
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': '5' },
      payload: Buffer.from('hello'),
    });
    expect(put.statusCode).toBe(200);
  });

  it('still disables auth for an empty token, but logs a deprecation warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config: CacheiroConfig = { ...testConfig, auth: { token: '' } };
    const app = await createServer(store, config);

    const res = await app.inject({ method: 'GET', url: '/v1/cache/abc123' });
    expect(res.statusCode).toBe(404);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('auth.token: "" is deprecated');
    warn.mockRestore();
  });

  it('does not warn when token is a non-empty string', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await createServer(store, testConfig);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not warn when auth is omitted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await createServer(store, { server: testConfig.server });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
