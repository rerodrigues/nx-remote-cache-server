import { describe, it, expect } from 'vitest';
import { S3Store } from '../src/index.js';

const config = { bucket: 'test-bucket', region: 'us-east-1' };

describe('S3Store', () => {
  it('can be instantiated', () => {
    expect(() => new S3Store(config)).not.toThrow();
  });

  it('init() resolves', async () => {
    const store = new S3Store(config);
    await expect(store.init()).resolves.toBeUndefined();
  });

  it('exists() throws not implemented', async () => {
    const store = new S3Store(config);
    await expect(store.exists('abc')).rejects.toThrow('S3Store: not implemented');
  });

  it('write() throws not implemented', async () => {
    const store = new S3Store(config);
    await expect(store.write('abc', Buffer.from('data'))).rejects.toThrow(
      'S3Store: not implemented',
    );
  });

  it('read() throws not implemented', () => {
    const store = new S3Store(config);
    expect(() => store.read('abc')).toThrow('S3Store: not implemented');
  });
});
