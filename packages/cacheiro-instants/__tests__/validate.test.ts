import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SchemaObject } from 'ajv';
import { validateConfig } from '../src/validate.js';

const cacheiroSchema: SchemaObject = {
  type: 'object',
  required: ['server'],
  properties: {
    server: {
      type: 'object',
      required: ['port'],
      properties: { port: { type: 'number' } },
    },
  },
};

const storeSchema: SchemaObject = {
  type: 'object',
  required: ['bucket'],
  properties: { bucket: { type: 'string' } },
};

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
      validateConfig({ server: { port: 3000 } }, cacheiroSchema, { bucket: 'x' }, storeSchema),
    ).not.toThrow();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('exits with code 1 when cacheiroOptions is invalid', () => {
    expect(() =>
      validateConfig({ server: {} }, cacheiroSchema, { bucket: 'x' }, storeSchema),
    ).toThrow('process.exit(1)');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid configuration'));
  });

  it('exits with code 1 when storeOptions is invalid', () => {
    expect(() =>
      validateConfig({ server: { port: 3000 } }, cacheiroSchema, {}, storeSchema),
    ).toThrow('process.exit(1)');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid store configuration'),
    );
  });
});
