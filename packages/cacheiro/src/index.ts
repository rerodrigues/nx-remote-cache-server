import type { FastifyInstance } from 'fastify';
import { createServer } from './server.js';
import { printBanner } from './banner.js';
import { configSchema } from './config.js';
import type { CacheiroConfig } from './config.js';
import { CacheiroEmitter, wireHooks } from './hooks.js';
import type { CacheiroEvents, CacheiroHooks, CacheiroStore } from '@renatorodrigues/cacheiro-types';

export type { CacheiroConfig, CacheiroStore, CacheiroHooks, CacheiroEvents };
export { configSchema };

export class Cacheiro {
  private readonly config: CacheiroConfig;
  private readonly store: CacheiroStore;
  private readonly emitter = new CacheiroEmitter();
  private fastify?: FastifyInstance;

  constructor(store: CacheiroStore, config: CacheiroConfig, hooks?: CacheiroHooks) {
    this.store = store;
    this.config = config;
    wireHooks(this.emitter, hooks);
  }

  on<K extends keyof CacheiroEvents>(
    event: K,
    listener: (payload: CacheiroEvents[K]) => void,
  ): void {
    this.emitter.on(event, listener);
  }

  async start(): Promise<FastifyInstance> {
    this.fastify = await createServer(this.store, this.config, this.emitter);
    return this.fastify;
  }

  async listen(): Promise<void> {
    const { port, host } = this.config.server;
    await this.fastify!.listen({ port, host });
    printBanner(this.store, this.config);
    this.emitter.emit('serverStart', undefined);
  }

  async stop(): Promise<void> {
    if (!this.fastify) return;
    this.fastify.server.closeAllConnections();
    await this.fastify.close();
    this.emitter.emit('serverStop', undefined);
  }
}
