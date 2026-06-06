import { Ajv, type ErrorObject } from 'ajv';
import config from 'config';
import schema from '../config/configSchema.json' with { type: 'json' };
import type { FileSystemConfig } from '@renatorodrigues/cacheiro-store-fs';
import type { S3StoreConfig } from '@renatorodrigues/cacheiro-store-s3';
import type { GcsStoreConfig } from '@renatorodrigues/cacheiro-store-gcs';
import type { AzureStoreConfig } from '@renatorodrigues/cacheiro-store-azure';

export interface AppConfig {
  server: {
    port: number;
    host: string;
    bodyLimitMb: number;
    banner: boolean;
    infobox: boolean;
  };
  auth: {
    token: string;
  };
  store:
    | {
        type: 'filesystem';
        filesystem: FileSystemConfig;
        s3?: S3StoreConfig;
        gcs?: GcsStoreConfig;
        azure?: AzureStoreConfig;
      }
    | {
        type: 's3';
        filesystem?: FileSystemConfig;
        s3: S3StoreConfig;
        gcs?: GcsStoreConfig;
        azure?: AzureStoreConfig;
      }
    | {
        type: 'gcs';
        filesystem?: FileSystemConfig;
        s3?: S3StoreConfig;
        gcs: GcsStoreConfig;
        azure?: AzureStoreConfig;
      }
    | {
        type: 'azure';
        filesystem?: FileSystemConfig;
        s3?: S3StoreConfig;
        gcs?: GcsStoreConfig;
        azure: AzureStoreConfig;
      };
}

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
const raw = config.util.toObject();

if (!validate(raw)) {
  const errors = (validate.errors ?? [])
    .map((e: ErrorObject) => `  ${e.instancePath || '(root)'} ${e.message}`)
    .join('\n');
  throw new Error(`Invalid configuration:\n${errors}`);
}

export const cfg = raw as AppConfig;
