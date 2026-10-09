import type { FastifyServerOptions } from 'fastify';
import type { CacheiroConfig } from './config.js';

export function buildLogger(
  format: CacheiroConfig['server']['logFormat'],
): FastifyServerOptions['logger'] {
  const pretty = format !== undefined ? format === 'pretty' : process.env.NODE_ENV !== 'production';

  if (!pretty) return true;

  return {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname,reqId,req,res,responseTime',
      },
    },
  };
}
