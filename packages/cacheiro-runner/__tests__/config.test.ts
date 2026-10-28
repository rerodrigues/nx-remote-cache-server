import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configSchema as storeSchema } from '@renatorodrigues/cacheiro-store-fs';
import { validateConfig } from '../src/validate.js';

const ENV = {
  CACHEIRO_PORT: '3001',
  CACHEIRO_BODY_LIMIT_MB: '5',
  CACHEIRO_CACHE_TTL_DAYS: '2',
  CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS: '3',
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('CACHEIRO_AUTH_TOKEN', 'test-token');
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('config environment variables', () => {
  it('parses numeric env vars as numbers and passes validation', async () => {
    const { default: config } = await import('config');
    const { storeOptions, ...cacheiroOptions } = config.util.toObject() as Record<
      string,
      Record<string, unknown>
    >;

    expect(cacheiroOptions.server.port).toBe(3001);
    expect(cacheiroOptions.server.bodyLimitMb).toBe(5);
    expect(storeOptions.ttlDays).toBe(2);
    expect(storeOptions.sweepIntervalHours).toBe(3);
    expect(() => validateConfig(cacheiroOptions, storeOptions, storeSchema)).not.toThrow();
  });
});
