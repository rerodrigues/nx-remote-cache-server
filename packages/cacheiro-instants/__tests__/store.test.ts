import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadStore, readStoreType } from '../src/store.js';
import { FileSystemStore, configSchema as fsSchema } from '@renatorodrigues/cacheiro-store-fs';
import { S3Store, configSchema as s3Schema } from '@renatorodrigues/cacheiro-store-s3';
import { GcsStore, configSchema as gcsSchema } from '@renatorodrigues/cacheiro-store-gcs';
import { AzureStore, configSchema as azureSchema } from '@renatorodrigues/cacheiro-store-azure';

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

describe('readStoreType', () => {
  it('fails fast when CACHEIRO_STORE_TYPE is missing', () => {
    delete process.env.CACHEIRO_STORE_TYPE;
    expect(() => readStoreType()).toThrow();
  });

  it('fails fast when CACHEIRO_STORE_TYPE is not a known flavor', () => {
    process.env.CACHEIRO_STORE_TYPE = 'nope';
    expect(() => readStoreType()).toThrow();
  });

  it('returns a valid store type', () => {
    process.env.CACHEIRO_STORE_TYPE = 's3';
    expect(readStoreType()).toBe('s3');
  });
});

describe('loadStore("fs")', () => {
  it('uses default values when no fs-specific vars are set', async () => {
    delete process.env.CACHEIRO_CACHE_DIRECTORY;
    delete process.env.CACHEIRO_CACHE_TTL_DAYS;
    delete process.env.CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS;

    const { storeOptions, storeSchema, createStore } = await loadStore('fs');

    expect(storeOptions).toEqual({
      cacheDirectory: './cache',
      ttlDays: 7,
      sweepIntervalHours: 24,
    });
    expect(storeSchema).toEqual(fsSchema);
    expect(createStore()).toBeInstanceOf(FileSystemStore);
  });

  it('respects overrides', async () => {
    process.env.CACHEIRO_CACHE_DIRECTORY = '/data';
    process.env.CACHEIRO_CACHE_TTL_DAYS = '14';
    process.env.CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS = '12';

    const { storeOptions } = await loadStore('fs');

    expect(storeOptions).toEqual({ cacheDirectory: '/data', ttlDays: 14, sweepIntervalHours: 12 });
  });
});

describe('loadStore("s3")', () => {
  const requiredEnv = { S3_BUCKET: 'my-bucket', S3_REGION: 'us-east-1' };

  it('only includes required fields when optional vars are unset', async () => {
    for (const key of [
      'S3_ENDPOINT',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_PROFILE',
      'S3_FORCE_PATH_STYLE',
      'S3_PREFIX',
      'S3_ENCRYPTION_KEY',
      'S3_DISABLE_CHECKSUM',
      'S3_SERVER_SIDE_ENCRYPTION',
    ])
      delete process.env[key];
    Object.assign(process.env, requiredEnv);

    const { storeOptions, storeSchema, createStore } = await loadStore('s3');

    expect(storeOptions).toEqual({ bucket: 'my-bucket', region: 'us-east-1' });
    expect(storeSchema).toEqual(s3Schema);
    expect(createStore()).toBeInstanceOf(S3Store);
  });

  it('maps every env var to its config field', async () => {
    Object.assign(process.env, requiredEnv, {
      S3_ENDPOINT: 'https://s3.example.com',
      AWS_ACCESS_KEY_ID: 'key-id',
      AWS_SECRET_ACCESS_KEY: 'secret-key',
      AWS_PROFILE: 'my-profile',
      S3_FORCE_PATH_STYLE: 'true',
      S3_PREFIX: 'nx-cache',
      S3_ENCRYPTION_KEY: 'enc-key',
      S3_DISABLE_CHECKSUM: 'true',
      S3_SERVER_SIDE_ENCRYPTION: 'true',
    });

    const { storeOptions } = await loadStore('s3');

    expect(storeOptions).toEqual({
      bucket: 'my-bucket',
      region: 'us-east-1',
      endpoint: 'https://s3.example.com',
      accessKeyId: 'key-id',
      secretAccessKey: 'secret-key',
      ssoProfile: 'my-profile',
      forcePathStyle: true,
      prefix: 'nx-cache',
      encryptionKey: 'enc-key',
      disableChecksum: true,
      serverSideEncryption: true,
    });
  });
});

describe('loadStore("gcs")', () => {
  it('only includes required fields when optional vars are unset', async () => {
    for (const key of ['GCS_ENDPOINT', 'GCS_PREFIX', 'GCS_ENCRYPTION_KEY']) delete process.env[key];
    process.env.GCS_BUCKET = 'my-bucket';

    const { storeOptions, storeSchema, createStore } = await loadStore('gcs');

    expect(storeOptions).toEqual({ bucket: 'my-bucket' });
    expect(storeSchema).toEqual(gcsSchema);
    expect(createStore()).toBeInstanceOf(GcsStore);
  });

  it('maps every env var to its config field', async () => {
    process.env.GCS_BUCKET = 'my-bucket';
    process.env.GCS_ENDPOINT = 'https://storage.example.com';
    process.env.GCS_PREFIX = 'nx-cache';
    process.env.GCS_ENCRYPTION_KEY = 'enc-key';

    const { storeOptions } = await loadStore('gcs');

    expect(storeOptions).toEqual({
      bucket: 'my-bucket',
      endpoint: 'https://storage.example.com',
      prefix: 'nx-cache',
      encryptionKey: 'enc-key',
    });
  });
});

describe('loadStore("azure")', () => {
  it('only includes required fields when optional vars are unset', async () => {
    for (const key of [
      'AZURE_ACCOUNT_NAME',
      'AZURE_STORAGE_CONNECTION_STRING',
      'AZURE_PREFIX',
      'AZURE_ENCRYPTION_KEY',
      'AZURE_ENCRYPTION_SCOPE',
    ])
      delete process.env[key];
    process.env.AZURE_CONTAINER = 'my-container';

    const { storeOptions, storeSchema, createStore } = await loadStore('azure');

    expect(storeOptions).toEqual({ container: 'my-container' });
    expect(storeSchema).toEqual(azureSchema);
    expect(createStore()).toBeInstanceOf(AzureStore);
  });

  it('maps every env var to its config field', async () => {
    process.env.AZURE_CONTAINER = 'my-container';
    process.env.AZURE_ACCOUNT_NAME = 'my-account';
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'conn-string';
    process.env.AZURE_PREFIX = 'nx-cache';
    process.env.AZURE_ENCRYPTION_KEY = 'enc-key';
    process.env.AZURE_ENCRYPTION_SCOPE = 'enc-scope';

    const { storeOptions } = await loadStore('azure');

    expect(storeOptions).toEqual({
      container: 'my-container',
      accountName: 'my-account',
      connectionString: 'conn-string',
      prefix: 'nx-cache',
      encryptionKey: 'enc-key',
      encryptionScope: 'enc-scope',
    });
  });
});
