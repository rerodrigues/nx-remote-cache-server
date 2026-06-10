import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import { mockClient } from 'aws-sdk-client-mock';
import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { S3Store, type S3StoreConfig } from '../src/index.js';

const s3Mock = mockClient(S3Client);
const baseConfig: S3StoreConfig = {
  bucket: 'test-bucket',
  region: 'us-east-1',
  accessKeyId: 'TEST',
  secretAccessKey: 'secret',
};

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

beforeEach(() => {
  s3Mock.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('S3Store mount()', () => {
  it('throws when bucket is missing', async () => {
    const store = new S3Store({ ...baseConfig, bucket: '' });
    await expect(store.mount()).rejects.toThrow(/bucket/i);
  });

  it('throws when region is missing', async () => {
    const store = new S3Store({ ...baseConfig, region: '' });
    await expect(store.mount()).rejects.toThrow(/region/i);
  });

  it('warns when both encryptionKey and serverSideEncryption are set', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = new S3Store({
      ...baseConfig,
      encryptionKey: 'k',
      serverSideEncryption: true,
    });
    await store.mount();
    expect(warn).toHaveBeenCalled();
    store.unmount();
  });

  it('throws when calling methods before mount()', async () => {
    const store = new S3Store(baseConfig);
    await expect(store.exists('h')).rejects.toThrow(/not mounted/i);
  });
});

describe('S3Store exists()', () => {
  it('returns true on HeadObject success', async () => {
    s3Mock.on(HeadObjectCommand).resolves({});
    const store = new S3Store(baseConfig);
    await store.mount();
    expect(await store.exists('abc')).toBe(true);
    store.unmount();
  });

  it('returns false on NotFound', async () => {
    s3Mock.on(HeadObjectCommand).rejects(
      Object.assign(new Error('Not Found'), {
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      }),
    );
    const store = new S3Store(baseConfig);
    await store.mount();
    expect(await store.exists('abc')).toBe(false);
    store.unmount();
  });

  it('throws on NoSuchBucket', async () => {
    s3Mock
      .on(HeadObjectCommand)
      .rejects(Object.assign(new Error('No bucket'), { name: 'NoSuchBucket' }));
    const store = new S3Store(baseConfig);
    await store.mount();
    await expect(store.exists('abc')).rejects.toThrow(/bucket "test-bucket" not found/);
    store.unmount();
  });

  it('throws auth error on 403', async () => {
    s3Mock.on(HeadObjectCommand).rejects(
      new S3ServiceException({
        name: 'Forbidden',
        $fault: 'client',
        $metadata: { httpStatusCode: 403 },
        message: 'Forbidden',
      }),
    );
    const store = new S3Store(baseConfig);
    await store.mount();
    await expect(store.exists('abc')).rejects.toThrow(/access denied/);
    store.unmount();
  });
});

describe('S3Store write() + read() roundtrip', () => {
  it('plaintext roundtrip', async () => {
    const stored: Buffer[] = [];
    s3Mock.on(PutObjectCommand).callsFake((input) => {
      stored.push(input.Body as Buffer);
      return {};
    });
    s3Mock
      .on(GetObjectCommand)
      .callsFake(() => ({ Body: Readable.from(stored[stored.length - 1]!) }));

    const store = new S3Store(baseConfig);
    await store.mount();
    const payload = Buffer.from('hello world');
    await store.write('abc', payload);
    expect(stored[0]?.equals(payload)).toBe(true);

    const out = await streamToBuffer(store.read('abc'));
    expect(out.equals(payload)).toBe(true);
    store.unmount();
  });

  it('encrypted roundtrip with encryptionKey', async () => {
    const stored: Buffer[] = [];
    s3Mock.on(PutObjectCommand).callsFake((input) => {
      stored.push(input.Body as Buffer);
      return {};
    });
    s3Mock
      .on(GetObjectCommand)
      .callsFake(() => ({ Body: Readable.from(stored[stored.length - 1]!) }));

    const store = new S3Store({ ...baseConfig, encryptionKey: 'super-secret' });
    await store.mount();
    const payload = Buffer.from('hello world');
    await store.write('abc', payload);

    expect(stored[0]).toBeDefined();
    expect(stored[0]!.length).toBeGreaterThan(payload.length);
    expect(stored[0]!.equals(payload)).toBe(false);

    const out = await streamToBuffer(store.read('abc'));
    expect(out.equals(payload)).toBe(true);
    store.unmount();
  });

  it('serverSideEncryption sends ServerSideEncryption: AES256', async () => {
    const calls: PutObjectCommand['input'][] = [];
    s3Mock.on(PutObjectCommand).callsFake((input) => {
      calls.push(input);
      return {};
    });

    const store = new S3Store({ ...baseConfig, serverSideEncryption: true });
    await store.mount();
    await store.write('abc', Buffer.from('data'));
    expect(calls[0]?.ServerSideEncryption).toBe('AES256');
    store.unmount();
  });

  it('ignores serverSideEncryption when encryptionKey is set', async () => {
    const calls: PutObjectCommand['input'][] = [];
    s3Mock.on(PutObjectCommand).callsFake((input) => {
      calls.push(input);
      return {};
    });

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = new S3Store({
      ...baseConfig,
      encryptionKey: 'k',
      serverSideEncryption: true,
    });
    await store.mount();
    await store.write('abc', Buffer.from('data'));
    expect(calls[0]?.ServerSideEncryption).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    store.unmount();
  });

  it('honors prefix when building keys (posix join)', async () => {
    const putKeys: string[] = [];
    const headKeys: string[] = [];
    s3Mock.on(PutObjectCommand).callsFake((input) => {
      putKeys.push(input.Key as string);
      return {};
    });
    s3Mock.on(HeadObjectCommand).callsFake((input) => {
      headKeys.push(input.Key as string);
      return {};
    });

    const store = new S3Store({ ...baseConfig, prefix: 'cache/v1' });
    await store.mount();
    await store.write('abc', Buffer.from('data'));
    await store.exists('abc');
    expect(putKeys[0]).toBe('cache/v1/abc');
    expect(headKeys[0]).toBe('cache/v1/abc');
    store.unmount();
  });
});

describe('S3Store read() error paths', () => {
  it('emits stream error for missing key', async () => {
    s3Mock.on(GetObjectCommand).rejects(
      Object.assign(new Error('No such key'), {
        name: 'NoSuchKey',
        $metadata: { httpStatusCode: 404 },
      }),
    );
    const store = new S3Store(baseConfig);
    await store.mount();
    const stream = store.read('missing');
    await expect(streamToBuffer(stream)).rejects.toThrow();
    store.unmount();
  });

  it('emits stream error on 403', async () => {
    s3Mock.on(GetObjectCommand).rejects(
      new S3ServiceException({
        name: 'Forbidden',
        $fault: 'client',
        $metadata: { httpStatusCode: 403 },
        message: 'Forbidden',
      }),
    );
    const store = new S3Store(baseConfig);
    await store.mount();
    await expect(streamToBuffer(store.read('abc'))).rejects.toThrow(/access denied/);
    store.unmount();
  });

  it('emits decryption error with friendly message', async () => {
    s3Mock.on(GetObjectCommand).callsFake(() => ({ Body: Readable.from(Buffer.alloc(64, 1)) }));

    const store = new S3Store({ ...baseConfig, encryptionKey: 'right-key' });
    await store.mount();
    await expect(streamToBuffer(store.read('abc'))).rejects.toThrow(/decrypt/i);
    store.unmount();
  });
});

describe('S3Store write() error paths', () => {
  it('throws on NoSuchBucket', async () => {
    s3Mock
      .on(PutObjectCommand)
      .rejects(Object.assign(new Error('No bucket'), { name: 'NoSuchBucket' }));
    const store = new S3Store(baseConfig);
    await store.mount();
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(
      /bucket "test-bucket" not found/,
    );
    store.unmount();
  });

  it('throws on 403', async () => {
    s3Mock.on(PutObjectCommand).rejects(
      new S3ServiceException({
        name: 'Forbidden',
        $fault: 'client',
        $metadata: { httpStatusCode: 403 },
        message: 'Forbidden',
      }),
    );
    const store = new S3Store(baseConfig);
    await store.mount();
    await expect(store.write('abc', Buffer.from('d'))).rejects.toThrow(/access denied/);
    store.unmount();
  });
});

describe('S3Store describe()', () => {
  it('returns bucket, region, encryption=none by default', async () => {
    const store = new S3Store(baseConfig);
    await store.mount();
    const rows = store.describe();
    expect(rows).toContainEqual(['bucket', 'test-bucket']);
    expect(rows).toContainEqual(['region', 'us-east-1']);
    expect(rows).toContainEqual(['encryption', 'none']);
    store.unmount();
  });

  it('reports endpoint and prefix when set', async () => {
    const store = new S3Store({
      ...baseConfig,
      endpoint: 'http://localhost:9000',
      prefix: 'cache/v1',
    });
    await store.mount();
    const rows = store.describe();
    expect(rows).toContainEqual(['endpoint', 'http://localhost:9000']);
    expect(rows).toContainEqual(['prefix', 'cache/v1']);
    store.unmount();
  });

  it('reports client-side encryption when encryptionKey is set', async () => {
    const store = new S3Store({ ...baseConfig, encryptionKey: 'k' });
    await store.mount();
    expect(store.describe()).toContainEqual(['encryption', 'client-side aes-256-cbc']);
    store.unmount();
  });

  it('reports sse-s3 when serverSideEncryption is set', async () => {
    const store = new S3Store({ ...baseConfig, serverSideEncryption: true });
    await store.mount();
    expect(store.describe()).toContainEqual(['encryption', 'sse-s3']);
    store.unmount();
  });
});
