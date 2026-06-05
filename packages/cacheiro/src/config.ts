import config from 'config';

export interface AppConfig {
  server: {
    port: number;
    host: string;
    bodyLimitMb: number;
  };
  auth: {
    token: string;
  };
  store: {
    type: string;
    filesystem: {
      dir: string;
    };
  };
}

export const cfg = config.util.toObject() as AppConfig;
