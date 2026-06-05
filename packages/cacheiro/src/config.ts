import config from 'config';

export interface AppConfig {
  server: {
    port: number;
    host: string;
  };
  auth: {
    token: string;
  };
  store: {
    type: string;
    local: {
      dir: string;
    };
  };
}

export const cfg = config.util.toObject() as AppConfig;
