import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import { GcsStore, type GcsStoreConfig } from '../src/index.js';

const hoisted = vi.hoisted(() => {
  const mockSave = vi.fn<() => Promise<void>>();
  const mockExists = vi.fn<() => Promise<[boolean]>>();
  const mockCreateReadStream = vi.fn<() => Readable>();

  const mockFile = vi.fn(() => ({
    save: mockSave,
    exists: mockExists,
    createReadStream: mockCreateReadStream,
  }));

  const mockBucket = vi.fn(() => ({ file: mockFile }));

  const MockStorage = vi.fn(function () {
    return { bucket: mockBucket };
  });

  return { mockSave, mockExists, mockCreateReadStream, mockFile, mockBucket, MockStorage };
});

vi.mock('@google-cloud/storage', () => ({ Storage: hoisted.MockStorage }));

const { mockSave, mockExists, mockCreateReadStream, mockFile, mockBucket, MockStorage } = hoisted;

const baseConfig: GcsStoreConfig = { bucket: 'test-bucket' };

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GcsStore mount()', () => {
  it('throws when bucket is missing', async () => {
    const store = new GcsStore({ ...baseConfig, bucket: '' });
    await expect(store.mount()).rejects.toThrow(/bucket/i);
  });

  it('throws when calling methods before mount()', async () => {
    const store = new GcsStore(baseConfig);
    await expect(store.exists('h')).rejects.toThrow(/not mounted/i);
  });

  it('passes apiEndpoint to Storage when endpoint is set', async () => {
    const store = new GcsStore({ ...baseConfig, endpoint: 'http://localhost:4443' });
    await store.mount();
    expect(MockStorage).toHaveBeenCalledWith({ apiEndpoint: 'http://localhost:4443' });
    store.unmount();
  });

  it('constructs Storage with empty options when no endpoint', async () => {
    const store = new GcsStore(baseConfig);
    await store.mount();
    expect(MockStorage).toHaveBeenCalledWith({});
    store.unmount();
  });
});

describe('GcsStore exists()', () => {
  it('returns true when file exists', async () => {
    mockExists.mockResolvedValue([true]);
    const store = new GcsStore(baseConfig);
    await store.mount();
    expect(await store.exists('abc')).toBe(true);
    store.unmount();
  });

  it('returns false when file does not exist', async () => {
    mockExists.mockResolvedValue([false]);
    const store = new GcsStore(baseConfig);
    await store.mount();
    expect(await store.exists('abc')).toBe(false);
    store.unmount();
  });

  it('returns false on 404 error', async () => {
    mockExists.mockRejectedValue(Object.assign(new Error('Not Found'), { code: 404 }));
    const store = new GcsStore(baseConfig);
    await store.mount();
    expect(await store.exists('abc')).toBe(false);
    store.unmount();
  });

  it('throws classified error on 403', async () => {
    mockExists.mockRejectedValue(Object.assign(new Error('Forbidden'), { code: 403 }));
    const store = new GcsStore(baseConfig);
    await store.mount();
    await expect(store.exists('abc')).rejects.toThrow(/access denied/i);
    store.unmount();
  });
});

describe('GcsStore write()', () => {
  it('saves data to GCS', async () => {
    mockSave.mockResolvedValue(undefined);
    const store = new GcsStore(baseConfig);
    await store.mount();
    const payload = Buffer.from('hello world');
    await store.write('abc', payload);
    expect(mockSave).toHaveBeenCalledWith(payload);
    store.unmount();
  });

  it('encrypts data when encryptionKey is set', async () => {
    let saved: Buffer | undefined;
    mockSave.mockImplementation(async (data: Buffer) => {
      saved = data;
    });
    const store = new GcsStore({ ...baseConfig, encryptionKey: 'super-secret' });
    await store.mount();
    const payload = Buffer.from('hello world');
    await store.write('abc', payload);
    expect(saved).toBeDefined();
    expect(saved!.length).toBeGreaterThan(payload.length);
    expect(saved!.equals(payload)).toBe(false);
    store.unmount();
  });

  it('throws on 404 (bucket not found)', async () => {
    mockSave.mockRejectedValue(Object.assign(new Error('bucket not found'), { code: 404 }));
    const store = new GcsStore(baseConfig);
    await store.mount();
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(
      /bucket "test-bucket" not found/,
    );
    store.unmount();
  });

  it('throws on 403', async () => {
    mockSave.mockRejectedValue(Object.assign(new Error('Forbidden'), { code: 403 }));
    const store = new GcsStore(baseConfig);
    await store.mount();
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(/access denied/i);
    store.unmount();
  });

  it('throws when message includes credentials', async () => {
    mockSave.mockRejectedValue(new Error('Invalid credentials provided'));
    const store = new GcsStore(baseConfig);
    await store.mount();
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(/access denied/i);
    store.unmount();
  });

  it('unwraps JSON-wrapped error messages', async () => {
    mockSave.mockRejectedValue(
      new Error(JSON.stringify({ error: { code: 400, message: 'precondition failed' } })),
    );
    const store = new GcsStore(baseConfig);
    await store.mount();
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(/precondition failed/);
    store.unmount();
  });
});

describe('GcsStore read() + write() roundtrip', () => {
  it('plaintext roundtrip', async () => {
    const payload = Buffer.from('hello world');
    mockSave.mockImplementation(async () => {});
    mockCreateReadStream.mockImplementation(() => Readable.from(payload));

    const store = new GcsStore(baseConfig);
    await store.mount();
    await store.write('abc', payload);
    const out = await streamToBuffer(store.read('abc'));
    expect(out.equals(payload)).toBe(true);
    store.unmount();
  });

  it('encrypted roundtrip with encryptionKey', async () => {
    let stored: Buffer | undefined;
    mockSave.mockImplementation(async (data: Buffer) => {
      stored = data;
    });
    mockCreateReadStream.mockImplementation(() => {
      if (!stored) throw new Error('nothing stored');
      return Readable.from(stored);
    });

    const store = new GcsStore({ ...baseConfig, encryptionKey: 'super-secret' });
    await store.mount();
    const payload = Buffer.from('hello world');
    await store.write('abc', payload);
    const out = await streamToBuffer(store.read('abc'));
    expect(out.equals(payload)).toBe(true);
    store.unmount();
  });
});

describe('GcsStore read() error paths', () => {
  it('emits stream error on 404', async () => {
    mockCreateReadStream.mockImplementation(() => {
      const stream = new Readable({ read() {} });
      process.nextTick(() =>
        stream.emit('error', Object.assign(new Error('Not Found'), { code: 404 })),
      );
      return stream;
    });
    const store = new GcsStore(baseConfig);
    await store.mount();
    await expect(streamToBuffer(store.read('missing'))).rejects.toThrow(/object not found/i);
    store.unmount();
  });

  it('emits stream error on 403', async () => {
    mockCreateReadStream.mockImplementation(() => {
      const stream = new Readable({ read() {} });
      process.nextTick(() =>
        stream.emit('error', Object.assign(new Error('Forbidden'), { code: 403 })),
      );
      return stream;
    });
    const store = new GcsStore(baseConfig);
    await store.mount();
    await expect(streamToBuffer(store.read('abc'))).rejects.toThrow(/access denied/i);
    store.unmount();
  });

  it('emits decrypt error with friendly message', async () => {
    const garbage = Buffer.alloc(64, 0x42);
    mockCreateReadStream.mockImplementation(() => Readable.from(garbage));

    const store = new GcsStore({ ...baseConfig, encryptionKey: 'right-key' });
    await store.mount();
    await expect(streamToBuffer(store.read('abc'))).rejects.toThrow(/decrypt/i);
    store.unmount();
  });
});

describe('GcsStore describe()', () => {
  it('returns bucket and encryption=none by default', async () => {
    const store = new GcsStore(baseConfig);
    await store.mount();
    const rows = store.describe();
    expect(rows).toContainEqual(['bucket', 'test-bucket']);
    expect(rows).toContainEqual(['encryption', 'none']);
    store.unmount();
  });

  it('reports endpoint and prefix when set', async () => {
    const store = new GcsStore({
      ...baseConfig,
      endpoint: 'http://localhost:4443',
      prefix: 'cache/v1',
    });
    await store.mount();
    const rows = store.describe();
    expect(rows).toContainEqual(['endpoint', 'http://localhost:4443']);
    expect(rows).toContainEqual(['prefix', 'cache/v1']);
    store.unmount();
  });

  it('reports client-side encryption when encryptionKey is set', async () => {
    const store = new GcsStore({ ...baseConfig, encryptionKey: 'k' });
    await store.mount();
    expect(store.describe()).toContainEqual(['encryption', 'client-side aes-256-cbc']);
    store.unmount();
  });
});

describe('GcsStore prefix', () => {
  it('builds key with prefix using posix join', async () => {
    mockExists.mockResolvedValue([true]);
    const store = new GcsStore({ ...baseConfig, prefix: 'cache/v1' });
    await store.mount();
    await store.exists('abc');
    expect(mockFile).toHaveBeenCalledWith('cache/v1/abc');
    store.unmount();
  });

  it('uses hash directly when no prefix', async () => {
    mockExists.mockResolvedValue([true]);
    const store = new GcsStore(baseConfig);
    await store.mount();
    await store.exists('abc');
    expect(mockFile).toHaveBeenCalledWith('abc');
    store.unmount();
  });

  it('uses same bucket name when making calls', async () => {
    mockExists.mockResolvedValue([true]);
    const store = new GcsStore(baseConfig);
    await store.mount();
    await store.exists('abc');
    expect(mockBucket).toHaveBeenCalledWith('test-bucket');
    store.unmount();
  });
});
