import { Ajv, type ErrorObject } from 'ajv';
import type { FastifyInstance } from 'fastify';
import { createServer } from './server.js';
import { printBanner } from './banner.js';
import { configSchema } from './config.js';
import type { CacheiroConfig } from './config.js';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';

export type { CacheiroConfig, CacheiroStore };
export { configSchema };

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(configSchema);

export class Cacheiro {
  private readonly config: CacheiroConfig;
  private readonly store: CacheiroStore;
  private fastify?: FastifyInstance;

  constructor(store: CacheiroStore, config: CacheiroConfig) {
    if (!validate(config)) {
      const errors = (validate.errors ?? [])
        .map((e: ErrorObject) => `  ${e.instancePath || '(root)'} ${e.message}`)
        .join('\n');
      throw new Error(`Invalid configuration:\n${errors}`);
    }
    this.store = store;
    this.config = config;
  }

  async start(): Promise<FastifyInstance> {
    this.fastify = await createServer(this.store, this.config);
    return this.fastify;
  }

  async listen(): Promise<void> {
    const { port, host } = this.config.server;
    await this.fastify!.listen({ port, host });
    printBanner(this.store, this.config);
  }

  async stop(): Promise<void> {
    if (!this.fastify) return;
    this.fastify.server.closeAllConnections();
    await this.fastify.close();
  }
}
