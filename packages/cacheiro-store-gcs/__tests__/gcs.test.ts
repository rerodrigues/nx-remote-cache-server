import { describe, it, expect } from 'vitest';
import { GcsStore } from '../src/index.js';

const config = { bucket: 'test-bucket' };

describe('GcsStore', () => {
  it('can be instantiated', () => {
    expect(() => new GcsStore(config)).not.toThrow();
  });

  it('mount() resolves', async () => {
    const store = new GcsStore(config);
    await expect(store.mount()).resolves.toBeUndefined();
  });

  it('exists() throws not implemented', async () => {
    const store = new GcsStore(config);
    await expect(store.exists('abc')).rejects.toThrow('GcsStore: not implemented');
  });

  it('write() throws not implemented', async () => {
    const store = new GcsStore(config);
    await expect(store.write('abc', Buffer.from('data'))).rejects.toThrow(
      'GcsStore: not implemented',
    );
  });

  it('read() throws not implemented', () => {
    const store = new GcsStore(config);
    expect(() => store.read('abc')).toThrow('GcsStore: not implemented');
  });
});
