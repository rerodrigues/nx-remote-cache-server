import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';

const hoisted = vi.hoisted(() => {
  type RestErrorInit = { statusCode?: number; code?: string; message?: string };
  class FakeRestError extends Error {
    statusCode?: number;
    code?: string;
    constructor(init: RestErrorInit = {}) {
      super(init.message ?? 'rest error');
      this.name = 'RestError';
      this.statusCode = init.statusCode;
      this.code = init.code;
    }
  }

  type BlobMock = {
    exists: ReturnType<typeof vi.fn>;
    download: ReturnType<typeof vi.fn>;
  };
  type BlockBlobMock = {
    uploadData: ReturnType<typeof vi.fn>;
  };

  const blobs = new Map<string, BlobMock>();
  const blockBlobs = new Map<string, BlockBlobMock>();
  const containerClient = {
    getBlobClient: vi.fn((key: string) => {
      let m = blobs.get(key);
      if (!m) {
        m = { exists: vi.fn(), download: vi.fn() };
        blobs.set(key, m);
      }
      return m;
    }),
    getBlockBlobClient: vi.fn((key: string) => {
      let m = blockBlobs.get(key);
      if (!m) {
        m = { uploadData: vi.fn() };
        blockBlobs.set(key, m);
      }
      return m;
    }),
  };
  const fromConnectionString = vi.fn(() => ({
    getContainerClient: vi.fn(() => containerClient),
  }));
  const BlobServiceClientCtor = vi.fn(function () {
    return { getContainerClient: vi.fn(() => containerClient) };
  });

  return {
    FakeRestError,
    blobs,
    blockBlobs,
    containerClient,
    fromConnectionString,
    BlobServiceClientCtor,
  };
});

vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: Object.assign(hoisted.BlobServiceClientCtor, {
    fromConnectionString: hoisted.fromConnectionString,
  }),
  RestError: hoisted.FakeRestError,
}));

vi.mock('@azure/identity', () => ({
  DefaultAzureCredential: vi.fn(),
}));

const {
  FakeRestError,
  blobs,
  blockBlobs,
  containerClient,
  fromConnectionString,
  BlobServiceClientCtor,
} = hoisted;

import { AzureStore, type AzureStoreConfig } from '../src/index.js';

const baseConfig: AzureStoreConfig = {
  container: 'test-container',
  connectionString:
    'DefaultEndpointsProtocol=https;AccountName=x;AccountKey=y;EndpointSuffix=core.windows.net',
};

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

beforeEach(() => {
  blobs.clear();
  blockBlobs.clear();
  containerClient.getBlobClient.mockClear();
  containerClient.getBlockBlobClient.mockClear();
  fromConnectionString.mockClear();
  BlobServiceClientCtor.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AzureStore mount()', () => {
  it('throws when container is missing', async () => {
    const store = new AzureStore({ ...baseConfig, container: '' });
    await expect(store.mount()).rejects.toThrow(/container/i);
  });

  it('throws when neither accountName nor connectionString is set', async () => {
    const store = new AzureStore({ container: 'c' });
    await expect(store.mount()).rejects.toThrow(/accountName.*connectionString/);
  });

  it('uses connectionString when provided', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    expect(fromConnectionString).toHaveBeenCalledWith(baseConfig.connectionString);
    store.unmount();
  });

  it('uses accountName + DefaultAzureCredential when no connectionString', async () => {
    const store = new AzureStore({ container: 'c', accountName: 'mystorage' });
    await store.mount();
    expect(BlobServiceClientCtor).toHaveBeenCalled();
    const url = BlobServiceClientCtor.mock.calls[0]?.[0];
    expect(url).toBe('https://mystorage.blob.core.windows.net');
    store.unmount();
  });

  it('throws when calling methods before mount()', async () => {
    const store = new AzureStore(baseConfig);
    await expect(store.exists('h')).rejects.toThrow(/not mounted/i);
  });
});

describe('AzureStore exists()', () => {
  it('returns true when blob exists', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = { exists: vi.fn().mockResolvedValue(true), download: vi.fn() };
      blobs.set(key, m);
      return m;
    });
    expect(await store.exists('abc')).toBe(true);
    store.unmount();
  });

  it('returns false when blob does not exist', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = { exists: vi.fn().mockResolvedValue(false), download: vi.fn() };
      blobs.set(key, m);
      return m;
    });
    expect(await store.exists('abc')).toBe(false);
    store.unmount();
  });

  it('returns false when SDK throws 404', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi
          .fn()
          .mockRejectedValue(new FakeRestError({ statusCode: 404, code: 'BlobNotFound' })),
        download: vi.fn(),
      };
      blobs.set(key, m);
      return m;
    });
    expect(await store.exists('abc')).toBe(false);
    store.unmount();
  });

  it('throws access-denied on 403', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi.fn().mockRejectedValue(new FakeRestError({ statusCode: 403 })),
        download: vi.fn(),
      };
      blobs.set(key, m);
      return m;
    });
    await expect(store.exists('abc')).rejects.toThrow(/access denied/);
    store.unmount();
  });

  it('throws container-not-found on ContainerNotFound', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi
          .fn()
          .mockRejectedValue(new FakeRestError({ statusCode: 404, code: 'ContainerNotFound' })),
        download: vi.fn(),
      };
      blobs.set(key, m);
      return m;
    });
    await expect(store.exists('abc')).rejects.toThrow(/container "test-container" not found/);
    store.unmount();
  });
});

describe('AzureStore write() + read() roundtrip', () => {
  it('plaintext roundtrip', async () => {
    const stored: Buffer[] = [];
    const store = new AzureStore(baseConfig);
    await store.mount();

    containerClient.getBlockBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        uploadData: vi.fn(async (body: Buffer) => {
          stored.push(body);
        }),
      };
      blockBlobs.set(key, m);
      return m;
    });
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi.fn(),
        download: vi.fn(async () => ({
          readableStreamBody: Readable.from(stored[stored.length - 1]!),
        })),
      };
      blobs.set(key, m);
      return m;
    });

    const payload = Buffer.from('hello world');
    await store.write('abc', payload);
    expect(stored[0]?.equals(payload)).toBe(true);

    const out = await streamToBuffer(store.read('abc'));
    expect(out.equals(payload)).toBe(true);
    store.unmount();
  });

  it('encrypted roundtrip with encryptionKey', async () => {
    const stored: Buffer[] = [];
    const store = new AzureStore({ ...baseConfig, encryptionKey: 'super-secret' });
    await store.mount();

    containerClient.getBlockBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        uploadData: vi.fn(async (body: Buffer) => {
          stored.push(body);
        }),
      };
      blockBlobs.set(key, m);
      return m;
    });
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi.fn(),
        download: vi.fn(async () => ({
          readableStreamBody: Readable.from(stored[stored.length - 1]!),
        })),
      };
      blobs.set(key, m);
      return m;
    });

    const payload = Buffer.from('hello world');
    await store.write('abc', payload);
    expect(stored[0]).toBeDefined();
    expect(stored[0]!.length).toBeGreaterThan(payload.length);
    expect(stored[0]!.equals(payload)).toBe(false);

    const out = await streamToBuffer(store.read('abc'));
    expect(out.equals(payload)).toBe(true);
    store.unmount();
  });

  it('honors prefix when building keys (posix join)', async () => {
    const store = new AzureStore({ ...baseConfig, prefix: 'cache/v1' });
    await store.mount();

    containerClient.getBlockBlobClient.mockImplementationOnce((key: string) => {
      const m = { uploadData: vi.fn(async () => {}) };
      blockBlobs.set(key, m);
      return m;
    });
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = { exists: vi.fn().mockResolvedValue(true), download: vi.fn() };
      blobs.set(key, m);
      return m;
    });

    await store.write('abc', Buffer.from('data'));
    await store.exists('abc');
    expect(containerClient.getBlockBlobClient).toHaveBeenCalledWith('cache/v1/abc');
    expect(containerClient.getBlobClient).toHaveBeenCalledWith('cache/v1/abc');
    store.unmount();
  });
});

describe('AzureStore read() error paths', () => {
  it('emits stream error for missing blob (404)', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi.fn(),
        download: vi
          .fn()
          .mockRejectedValue(new FakeRestError({ statusCode: 404, code: 'BlobNotFound' })),
      };
      blobs.set(key, m);
      return m;
    });
    const stream = store.read('missing');
    await expect(streamToBuffer(stream)).rejects.toThrow();
    store.unmount();
  });

  it('emits stream error on 403', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi.fn(),
        download: vi.fn().mockRejectedValue(new FakeRestError({ statusCode: 403 })),
      };
      blobs.set(key, m);
      return m;
    });
    await expect(streamToBuffer(store.read('abc'))).rejects.toThrow(/access denied/);
    store.unmount();
  });

  it('emits stream error when readableStreamBody is missing', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi.fn(),
        download: vi.fn(async () => ({ readableStreamBody: undefined })),
      };
      blobs.set(key, m);
      return m;
    });
    await expect(streamToBuffer(store.read('abc'))).rejects.toThrow(/empty response body/);
    store.unmount();
  });

  it('emits decryption error with friendly message', async () => {
    const store = new AzureStore({ ...baseConfig, encryptionKey: 'right-key' });
    await store.mount();
    containerClient.getBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        exists: vi.fn(),
        download: vi.fn(async () => ({
          readableStreamBody: Readable.from(Buffer.alloc(64, 1)),
        })),
      };
      blobs.set(key, m);
      return m;
    });
    await expect(streamToBuffer(store.read('abc'))).rejects.toThrow(/decrypt/i);
    store.unmount();
  });
});

describe('AzureStore write() error paths', () => {
  it('throws on ContainerNotFound', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlockBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        uploadData: vi
          .fn()
          .mockRejectedValue(new FakeRestError({ statusCode: 404, code: 'ContainerNotFound' })),
      };
      blockBlobs.set(key, m);
      return m;
    });
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(
      /container "test-container" not found/,
    );
    store.unmount();
  });

  it('throws on 403', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlockBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        uploadData: vi.fn().mockRejectedValue(new FakeRestError({ statusCode: 403 })),
      };
      blockBlobs.set(key, m);
      return m;
    });
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(/access denied/);
    store.unmount();
  });

  it('throws on AuthenticationError name', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlockBlobClient.mockImplementationOnce((key: string) => {
      const err = Object.assign(new Error('auth'), { name: 'AuthenticationError' });
      const m = { uploadData: vi.fn().mockRejectedValue(err) };
      blockBlobs.set(key, m);
      return m;
    });
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(/access denied/);
    store.unmount();
  });
});

describe('AzureStore describe()', () => {
  it('returns container + connectionString redacted + encryption=service-managed', async () => {
    const store = new AzureStore(baseConfig);
    await store.mount();
    const rows = store.describe();
    expect(rows).toContainEqual(['container', 'test-container']);
    expect(rows).toContainEqual(['connectionString', '<redacted>']);
    expect(rows).toContainEqual(['encryption', 'service-managed']);
    store.unmount();
  });

  it('reports accountName + prefix when set', async () => {
    const store = new AzureStore({
      container: 'c',
      accountName: 'mystorage',
      prefix: 'cache/v1',
    });
    await store.mount();
    const rows = store.describe();
    expect(rows).toContainEqual(['accountName', 'mystorage']);
    expect(rows).toContainEqual(['prefix', 'cache/v1']);
    store.unmount();
  });

  it('reports client-side encryption when encryptionKey is set', async () => {
    const store = new AzureStore({ ...baseConfig, encryptionKey: 'k' });
    await store.mount();
    expect(store.describe()).toContainEqual(['encryption', 'client-side aes-256-cbc']);
    store.unmount();
  });

  it('reports scope when encryptionScope is set', async () => {
    const store = new AzureStore({ ...baseConfig, encryptionScope: 'scope-a' });
    await store.mount();
    const rows = store.describe();
    expect(rows).toContainEqual(['encryptionScope', 'scope-a']);
    expect(rows).toContainEqual(['encryption', 'scope "scope-a"']);
    store.unmount();
  });

  it('reports combined client-side + scope when both set', async () => {
    const store = new AzureStore({
      ...baseConfig,
      encryptionKey: 'k',
      encryptionScope: 'scope-a',
    });
    await store.mount();
    expect(store.describe()).toContainEqual([
      'encryption',
      'client-side aes-256-cbc + scope "scope-a"',
    ]);
    store.unmount();
  });
});

describe('AzureStore write() with encryptionScope', () => {
  it('passes encryptionScope to uploadData when set', async () => {
    const calls: Array<unknown> = [];
    const store = new AzureStore({ ...baseConfig, encryptionScope: 'scope-a' });
    await store.mount();
    containerClient.getBlockBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        uploadData: vi.fn(async (_body: Buffer, opts?: unknown) => {
          calls.push(opts);
        }),
      };
      blockBlobs.set(key, m);
      return m;
    });
    await store.write('abc', Buffer.from('data'));
    expect(calls[0]).toEqual({ encryptionScope: 'scope-a' });
    store.unmount();
  });

  it('omits options when encryptionScope is unset', async () => {
    const calls: Array<unknown> = [];
    const store = new AzureStore(baseConfig);
    await store.mount();
    containerClient.getBlockBlobClient.mockImplementationOnce((key: string) => {
      const m = {
        uploadData: vi.fn(async (_body: Buffer, opts?: unknown) => {
          calls.push(opts);
        }),
      };
      blockBlobs.set(key, m);
      return m;
    });
    await store.write('abc', Buffer.from('data'));
    expect(calls[0]).toBeUndefined();
    store.unmount();
  });
});
