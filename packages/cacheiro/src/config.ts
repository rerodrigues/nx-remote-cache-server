import configSchema from '../configSchema.json' with { type: 'json' };

export { configSchema };

export interface CacheiroConfig {
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
}
