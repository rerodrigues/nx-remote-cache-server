import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readCoreConfig } from '../src/core-config.js';

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
});

afterEach(() => {
  process.env = originalEnv;
  vi.restoreAllMocks();
});

describe('readCoreConfig', () => {
  it('fails fast when CACHEIRO_PORT is missing', () => {
    delete process.env.CACHEIRO_PORT;
    process.env.CACHEIRO_HOST = '0.0.0.0';

    expect(() => readCoreConfig()).toThrow();
  });

  it('fails fast when CACHEIRO_HOST is missing', () => {
    process.env.CACHEIRO_PORT = '3000';
    delete process.env.CACHEIRO_HOST;

    expect(() => readCoreConfig()).toThrow();
  });

  it('returns server config with defaults when only port/host are set', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';

    const config = readCoreConfig();

    expect(config).toEqual({
      server: { port: 3000, host: '0.0.0.0', bodyLimitMb: 100, banner: true, infobox: true },
    });
  });

  it('respects overrides for bodyLimitMb/banner/infobox', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';
    process.env.CACHEIRO_BODY_LIMIT_MB = '50';
    process.env.CACHEIRO_BANNER = 'false';
    process.env.CACHEIRO_INFOBOX = 'false';

    const config = readCoreConfig();

    expect(config.server.bodyLimitMb).toBe(50);
    expect(config.server.banner).toBe(false);
    expect(config.server.infobox).toBe(false);
  });

  it('leaves server.logFormat unset by default', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';

    expect(readCoreConfig().server).not.toHaveProperty('logFormat');
  });

  it('reads CACHEIRO_LOG_FORMAT into server.logFormat', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';
    process.env.CACHEIRO_LOG_FORMAT = 'pretty';

    expect(readCoreConfig().server.logFormat).toBe('pretty');
  });

  it('fails fast when CACHEIRO_LOG_FORMAT is not pretty or json', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';
    process.env.CACHEIRO_LOG_FORMAT = 'xml';

    expect(() => readCoreConfig()).toThrow();
  });

  it('builds server.tls when both cert and key files are set', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';
    process.env.CACHEIRO_TLS_CERT_FILE = '/cert.pem';
    process.env.CACHEIRO_TLS_KEY_FILE = '/key.pem';

    expect(readCoreConfig().server.tls).toEqual({ certFile: '/cert.pem', keyFile: '/key.pem' });
  });

  it('includes caFile in server.tls when set', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';
    process.env.CACHEIRO_TLS_CERT_FILE = '/cert.pem';
    process.env.CACHEIRO_TLS_KEY_FILE = '/key.pem';
    process.env.CACHEIRO_TLS_CA_FILE = '/ca.pem';

    expect(readCoreConfig().server.tls).toEqual({
      certFile: '/cert.pem',
      keyFile: '/key.pem',
      caFile: '/ca.pem',
    });
  });

  it('omits server.tls when only the cert file is set', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';
    process.env.CACHEIRO_TLS_CERT_FILE = '/cert.pem';
    delete process.env.CACHEIRO_TLS_KEY_FILE;

    expect(readCoreConfig().server.tls).toBeUndefined();
  });

  it('omits auth entirely when no auth env vars are set', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';

    expect(readCoreConfig().auth).toBeUndefined();
  });

  it('builds auth.token when CACHEIRO_AUTH_TOKEN is set', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';
    process.env.CACHEIRO_AUTH_TOKEN = 'secret';

    expect(readCoreConfig().auth).toEqual({ token: 'secret' });
  });

  it('builds auth.readOnlyToken alongside auth.token', () => {
    process.env.CACHEIRO_PORT = '3000';
    process.env.CACHEIRO_HOST = '0.0.0.0';
    process.env.CACHEIRO_AUTH_TOKEN = 'secret';
    process.env.CACHEIRO_AUTH_READ_ONLY_TOKEN = 'ro-secret';

    expect(readCoreConfig().auth).toEqual({ token: 'secret', readOnlyToken: 'ro-secret' });
  });
});
