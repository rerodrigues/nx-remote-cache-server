import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';
import type { FileSystemStoreConfig } from '@renatorodrigues/cacheiro-store-fs';
import type { S3StoreConfig } from '@renatorodrigues/cacheiro-store-s3';
import type { GcsStoreConfig } from '@renatorodrigues/cacheiro-store-gcs';
import type { AzureStoreConfig } from '@renatorodrigues/cacheiro-store-azure';
import type { SchemaObject } from 'ajv';
import { bool, cleanEnv, num, str } from 'envalid';

const STORE_TYPES = ['fs', 's3', 'gcs', 'azure'] as const;
type StoreType = (typeof STORE_TYPES)[number];

type StoreOptions =
  | FileSystemStoreConfig
  | Partial<S3StoreConfig>
  | Partial<GcsStoreConfig>
  | Partial<AzureStoreConfig>;

export interface LoadedStore {
  createStore: () => CacheiroStore;
  storeOptions: StoreOptions;
  storeSchema: SchemaObject;
}

function readFsOptions(): FileSystemStoreConfig {
  const env = cleanEnv(process.env, {
    CACHEIRO_CACHE_DIRECTORY: str({ default: './cache' }),
    CACHEIRO_CACHE_TTL_DAYS: num({ default: 7 }),
    CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS: num({ default: 24 }),
  });
  return {
    cacheDirectory: env.CACHEIRO_CACHE_DIRECTORY,
    ttlDays: env.CACHEIRO_CACHE_TTL_DAYS,
    sweepIntervalHours: env.CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS,
  };
}

type FieldType = 'string' | 'bool';
type FieldSpec = readonly [env: string, key: string, type: FieldType];

function readFields<T>(fields: readonly FieldSpec[]): Partial<T> {
  const spec: Record<string, ReturnType<typeof str> | ReturnType<typeof bool>> = {};
  for (const [envVar, , type] of fields)
    spec[envVar] = type === 'bool' ? bool({ default: undefined }) : str({ default: undefined });
  const env = cleanEnv(process.env, spec);

  const entries = fields.map(([envVar, key]) => [key, env[envVar]] as const);
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined)) as Partial<T>;
}

const S3_FIELDS: readonly FieldSpec[] = [
  ['S3_BUCKET', 'bucket', 'string'],
  ['S3_REGION', 'region', 'string'],
  ['S3_ENDPOINT', 'endpoint', 'string'],
  ['AWS_ACCESS_KEY_ID', 'accessKeyId', 'string'],
  ['AWS_SECRET_ACCESS_KEY', 'secretAccessKey', 'string'],
  ['AWS_PROFILE', 'ssoProfile', 'string'],
  ['S3_FORCE_PATH_STYLE', 'forcePathStyle', 'bool'],
  ['S3_PREFIX', 'prefix', 'string'],
  ['S3_ENCRYPTION_KEY', 'encryptionKey', 'string'],
  ['S3_DISABLE_CHECKSUM', 'disableChecksum', 'bool'],
  ['S3_SERVER_SIDE_ENCRYPTION', 'serverSideEncryption', 'bool'],
];

const GCS_FIELDS: readonly FieldSpec[] = [
  ['GCS_BUCKET', 'bucket', 'string'],
  ['GCS_ENDPOINT', 'endpoint', 'string'],
  ['GCS_PREFIX', 'prefix', 'string'],
  ['GCS_ENCRYPTION_KEY', 'encryptionKey', 'string'],
];

const AZURE_FIELDS: readonly FieldSpec[] = [
  ['AZURE_CONTAINER', 'container', 'string'],
  ['AZURE_ACCOUNT_NAME', 'accountName', 'string'],
  ['AZURE_STORAGE_CONNECTION_STRING', 'connectionString', 'string'],
  ['AZURE_PREFIX', 'prefix', 'string'],
  ['AZURE_ENCRYPTION_KEY', 'encryptionKey', 'string'],
  ['AZURE_ENCRYPTION_SCOPE', 'encryptionScope', 'string'],
];

export function readStoreType(): StoreType {
  const env = cleanEnv(process.env, {
    CACHEIRO_STORE_TYPE: str({ choices: STORE_TYPES }),
  });
  return env.CACHEIRO_STORE_TYPE;
}

export async function loadStore(storeType: StoreType): Promise<LoadedStore> {
  switch (storeType) {
    case 'fs': {
      const storeOptions = readFsOptions();
      const { FileSystemStore, configSchema: storeSchema } =
        await import('@renatorodrigues/cacheiro-store-fs');
      return { createStore: () => new FileSystemStore(storeOptions), storeOptions, storeSchema };
    }
    case 's3': {
      const storeOptions = readFields<S3StoreConfig>(S3_FIELDS);
      const { S3Store, configSchema: storeSchema } =
        await import('@renatorodrigues/cacheiro-store-s3');
      return {
        createStore: () => new S3Store(storeOptions as S3StoreConfig),
        storeOptions,
        storeSchema,
      };
    }
    case 'gcs': {
      const storeOptions = readFields<GcsStoreConfig>(GCS_FIELDS);
      const { GcsStore, configSchema: storeSchema } =
        await import('@renatorodrigues/cacheiro-store-gcs');
      return {
        createStore: () => new GcsStore(storeOptions as GcsStoreConfig),
        storeOptions,
        storeSchema,
      };
    }
    case 'azure': {
      const storeOptions = readFields<AzureStoreConfig>(AZURE_FIELDS);
      const { AzureStore, configSchema: storeSchema } =
        await import('@renatorodrigues/cacheiro-store-azure');
      return {
        createStore: () => new AzureStore(storeOptions as AzureStoreConfig),
        storeOptions,
        storeSchema,
      };
    }
  }
}
