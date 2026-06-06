import config from 'config';
import type { FileSystemConfig } from '@renatorodrigues/cacheiro-store-fs';
import type { S3StoreConfig } from '@renatorodrigues/cacheiro-store-s3';

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
  store: {
    type: 'filesystem' | 's3';
    filesystem?: FileSystemConfig;
    s3?: S3StoreConfig;
  };
}

export const cfg = config.util.toObject() as AppConfig;
