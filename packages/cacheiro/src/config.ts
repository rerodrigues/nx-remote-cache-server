import config from 'config';

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
    filesystem: {
      dir: string;
      ttlDays: number;
      sweepIntervalHours: number;
    };
  };
}

export const cfg = config.util.toObject() as AppConfig;
