import { describe, it, expect } from 'vitest';
import { AzureStore } from '../src/index.js';

const config = { container: 'test-container' };

describe('AzureStore', () => {
  it('can be instantiated', () => {
    expect(() => new AzureStore(config)).not.toThrow();
  });

  it('mount() resolves', async () => {
    const store = new AzureStore(config);
    await expect(store.mount()).resolves.toBeUndefined();
  });

  it('exists() throws not implemented', async () => {
    const store = new AzureStore(config);
    await expect(store.exists('abc')).rejects.toThrow('AzureStore: not implemented');
  });

  it('write() throws not implemented', async () => {
    const store = new AzureStore(config);
    await expect(store.write('abc', Buffer.from('data'))).rejects.toThrow(
      'AzureStore: not implemented',
    );
  });

  it('read() throws not implemented', () => {
    const store = new AzureStore(config);
    expect(() => store.read('abc')).toThrow('AzureStore: not implemented');
  });
});
