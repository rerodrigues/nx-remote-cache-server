import type { CacheiroConfig } from '@renatorodrigues/cacheiro';
import { bool, cleanEnv, num, str } from 'envalid';

export function readCoreConfig(): CacheiroConfig {
  const env = cleanEnv(process.env, {
    CACHEIRO_PORT: num(),
    CACHEIRO_HOST: str(),
    CACHEIRO_BODY_LIMIT_MB: num({ default: 100 }),
    CACHEIRO_BANNER: bool({ default: true }),
    CACHEIRO_INFOBOX: bool({ default: true }),
    CACHEIRO_LOG_FORMAT: str({ choices: ['pretty', 'json'], default: undefined }),
    CACHEIRO_TLS_CERT_FILE: str({ default: undefined }),
    CACHEIRO_TLS_KEY_FILE: str({ default: undefined }),
    CACHEIRO_TLS_CA_FILE: str({ default: undefined }),
    CACHEIRO_AUTH_TOKEN: str({ default: undefined }),
    CACHEIRO_AUTH_READ_ONLY_TOKEN: str({ default: undefined }),
  });

  const server: CacheiroConfig['server'] = {
    port: env.CACHEIRO_PORT,
    host: env.CACHEIRO_HOST,
    bodyLimitMb: env.CACHEIRO_BODY_LIMIT_MB,
    banner: env.CACHEIRO_BANNER,
    infobox: env.CACHEIRO_INFOBOX,
  };

  if (env.CACHEIRO_LOG_FORMAT !== undefined) {
    server.logFormat = env.CACHEIRO_LOG_FORMAT;
  }

  if (env.CACHEIRO_TLS_CERT_FILE !== undefined && env.CACHEIRO_TLS_KEY_FILE !== undefined) {
    server.tls = {
      certFile: env.CACHEIRO_TLS_CERT_FILE,
      keyFile: env.CACHEIRO_TLS_KEY_FILE,
      ...(env.CACHEIRO_TLS_CA_FILE !== undefined ? { caFile: env.CACHEIRO_TLS_CA_FILE } : {}),
    };
  }

  const config: CacheiroConfig = { server };

  if (env.CACHEIRO_AUTH_TOKEN !== undefined || env.CACHEIRO_AUTH_READ_ONLY_TOKEN !== undefined) {
    config.auth = {
      ...(env.CACHEIRO_AUTH_TOKEN !== undefined ? { token: env.CACHEIRO_AUTH_TOKEN } : {}),
      ...(env.CACHEIRO_AUTH_READ_ONLY_TOKEN !== undefined
        ? { readOnlyToken: env.CACHEIRO_AUTH_READ_ONLY_TOKEN }
        : {}),
    };
  }

  return config;
}
