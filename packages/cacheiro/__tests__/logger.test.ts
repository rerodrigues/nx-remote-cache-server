import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLogger } from '../src/logger.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('buildLogger', () => {
  it("returns plain pino logging for logFormat 'json'", () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(buildLogger('json')).toBe(true);
  });

  it("returns the pino-pretty transport for logFormat 'pretty', even in production", () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(buildLogger('pretty')).toEqual({
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,reqId,req,res,responseTime',
        },
      },
    });
  });

  it('defaults to json in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(buildLogger(undefined)).toBe(true);
  });

  it('defaults to pretty outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(buildLogger(undefined)).toMatchObject({
      transport: { target: 'pino-pretty' },
    });
  });
});
