import config from 'config';
import type { FileSystemConfig } from '@renatorodrigues/cacheiro-store-fs';
import type { S3StoreConfig } from '@renatorodrigues/cacheiro-store-s3';
import type { GcsStoreConfig } from '@renatorodrigues/cacheiro-store-gcs';

export interface AppConfig {
  server: {
    port: number;
    host: string;
    bodyLimitMb: number;
    banner: boolean;
  };
  auth: {
    token: string;
  };
  store:
    | { type: 'filesystem'; filesystem: FileSystemConfig; s3?: S3StoreConfig; gcs?: GcsStoreConfig }
    | { type: 's3'; filesystem?: FileSystemConfig; s3: S3StoreConfig; gcs?: GcsStoreConfig }
    | { type: 'gcs'; filesystem?: FileSystemConfig; s3?: S3StoreConfig; gcs: GcsStoreConfig };
}

export const cfg = config.util.toObject() as AppConfig;
