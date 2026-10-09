import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SchemaObject } from 'ajv';
import { validateConfig } from '../src/validate.js';

const validCacheiroOptions = {
  server: { port: 3000, host: '127.0.0.1' },
  auth: { token: 'test-token' },
};

const storeSchema: SchemaObject = {
  type: 'object',
  required: ['cacheDirectory'],
  properties: { cacheDirectory: { type: 'string' } },
  additionalProperties: false,
};

const validStoreOptions = { cacheDirectory: './cache' };

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('validateConfig', () => {
  it('does not exit when both configs are valid', () => {
    expect(() =>
      validateConfig(validCacheiroOptions, validStoreOptions, storeSchema),
    ).not.toThrow();
    expect(process.exit).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('exits with code 1 when cacheiroOptions has an unknown property', () => {
    expect(() =>
      validateConfig({ ...validCacheiroOptions, bogus: true }, validStoreOptions, storeSchema),
    ).toThrow('process.exit(1)');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid configuration'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('bogus'));
  });

  it('exits with code 1 when cacheiroOptions is not an object', () => {
    expect(() => validateConfig('nope', validStoreOptions, storeSchema)).toThrow('process.exit(1)');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('must be object'));
  });

  it('exits with code 1 when storeOptions is invalid', () => {
    expect(() => validateConfig(validCacheiroOptions, {}, storeSchema)).toThrow('process.exit(1)');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid store configuration'),
    );
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('storeOptions'));
  });

  it('reports additional store properties by name', () => {
    expect(() =>
      validateConfig(validCacheiroOptions, { ...validStoreOptions, extra: 1 }, storeSchema),
    ).toThrow('process.exit(1)');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('extra'));
  });

  it('does not validate store options when cacheiroOptions is invalid', () => {
    expect(() => validateConfig({ bogus: true }, {}, storeSchema)).toThrow('process.exit(1)');
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
