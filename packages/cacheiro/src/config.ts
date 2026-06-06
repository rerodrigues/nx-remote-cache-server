import config from 'config';
import type { FileSystemConfig } from '@renatorodrigues/cacheiro-store-fs';

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
    type: string;
    filesystem: FileSystemConfig;
  };
}

export const cfg = config.util.toObject() as AppConfig;
