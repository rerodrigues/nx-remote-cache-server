import { describe, it, expect } from 'vitest';
import { Ajv } from 'ajv';
import { configSchema } from '../src/config.js';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(configSchema);

function errorPaths(): (string | undefined)[] {
  return validate.errors?.map((e) => e.instancePath) ?? [];
}

describe('configSchema', () => {
  it('accepts an empty config', () => {
    expect(validate({})).toBe(true);
  });

  it('accepts a fully populated config', () => {
    expect(
      validate({
        $schema: './node_modules/@renatorodrigues/cacheiro/configSchema.json',
        server: {
          port: 3000,
          host: '127.0.0.1',
          bodyLimitMb: 100,
          banner: true,
          infobox: true,
          tls: { certFile: '/cert.pem', keyFile: '/key.pem', caFile: '/ca.pem' },
        },
        auth: { token: 'secret', readOnlyToken: 'ro-secret' },
        storeOptions: { cacheDirectory: './cache' },
      }),
    ).toBe(true);
  });

  it('rejects unknown top-level properties', () => {
    expect(validate({ nope: true })).toBe(false);
    expect(errorPaths()).toContain('');
  });

  it('rejects unknown server properties', () => {
    expect(validate({ server: { port: 3000, nope: true } })).toBe(false);
    expect(errorPaths()).toContain('/server');
  });

  it.each([
    [{ port: 'not-a-number' }, '/server/port'],
    [{ port: 0 }, '/server/port'],
    [{ port: 65536 }, '/server/port'],
    [{ host: 123 }, '/server/host'],
    [{ bodyLimitMb: 0 }, '/server/bodyLimitMb'],
    [{ banner: 'yes' }, '/server/banner'],
    [{ infobox: 'yes' }, '/server/infobox'],
  ])('rejects invalid server.%o', (server, expectedPath) => {
    expect(validate({ server })).toBe(false);
    expect(errorPaths()).toContain(expectedPath);
  });

  it('accepts server.tls with only the required fields', () => {
    expect(validate({ server: { tls: { certFile: '/cert.pem', keyFile: '/key.pem' } } })).toBe(
      true,
    );
  });

  it('rejects server.tls missing required fields', () => {
    expect(validate({ server: { tls: { certFile: '/cert.pem' } } })).toBe(false);
    expect(errorPaths()).toContain('/server/tls');
  });

  it('rejects unknown server.tls properties', () => {
    expect(
      validate({
        server: { tls: { certFile: '/cert.pem', keyFile: '/key.pem', nope: true } },
      }),
    ).toBe(false);
    expect(errorPaths()).toContain('/server/tls');
  });

  it('accepts an omitted auth object', () => {
    expect(validate({})).toBe(true);
  });

  it('accepts an empty auth object', () => {
    expect(validate({ auth: {} })).toBe(true);
  });

  it('rejects unknown auth properties', () => {
    expect(validate({ auth: { token: 'x', nope: true } })).toBe(false);
    expect(errorPaths()).toContain('/auth');
  });

  it('accepts auth.token as an empty string (deprecated, but still valid)', () => {
    expect(validate({ auth: { token: '' } })).toBe(true);
  });

  it('rejects a non-string auth.token', () => {
    expect(validate({ auth: { token: 123 } })).toBe(false);
    expect(errorPaths()).toContain('/auth/token');
  });

  it('accepts a config with readOnlyToken set', () => {
    expect(validate({ auth: { token: 'test-token', readOnlyToken: 'ro-token' } })).toBe(true);
  });

  it('rejects an empty readOnlyToken', () => {
    expect(validate({ auth: { token: 'test-token', readOnlyToken: '' } })).toBe(false);
    expect(errorPaths()).toContain('/auth/readOnlyToken');
  });

  it('accepts arbitrary storeOptions shapes', () => {
    expect(validate({ storeOptions: { anything: { nested: true } } })).toBe(true);
  });

  it('rejects a non-object storeOptions', () => {
    expect(validate({ storeOptions: 'nope' })).toBe(false);
    expect(errorPaths()).toContain('/storeOptions');
  });
});
