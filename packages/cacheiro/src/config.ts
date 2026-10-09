import configSchema from '../configSchema.json' with { type: 'json' };

export { configSchema };

export interface CacheiroConfig {
  server: {
    port: number;
    host: string;
    bodyLimitMb?: number;
    banner?: boolean;
    infobox?: boolean;
    logFormat?: 'pretty' | 'json';
    tls?: {
      certFile: string;
      keyFile: string;
      caFile?: string;
    };
  };
  auth?: {
    token?: string;
    readOnlyToken?: string;
  };
}
