import { Ajv, type ErrorObject } from 'ajv';
import type { FastifyInstance } from 'fastify';
import { createServer } from './server.js';
import { createStore } from './store.js';
import { printBanner } from './banner.js';
import { configSchema } from './config.js';
import type { CacheiroConfig } from './config.js';

export type { CacheiroConfig };
export { configSchema };

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(configSchema);

export async function startServer(config: CacheiroConfig): Promise<FastifyInstance> {
  if (!validate(config)) {
    const errors = (validate.errors ?? [])
      .map((e: ErrorObject) => `  ${e.instancePath || '(root)'} ${e.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${errors}`);
  }
  const store = createStore(config.store);
  const server = await createServer(store, config);
  await server.listen({ port: config.server.port, host: config.server.host });
  printBanner(store, config);
  return server;
}
