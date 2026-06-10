import config from 'config';
import { Cacheiro, type CacheiroConfig } from '@renatorodrigues/cacheiro';
import { FileSystemStore, type FileSystemConfig } from '@renatorodrigues/cacheiro-store-fs';
import { validateConfig } from './validate.js';

const rawOptions = config.util.toObject() as Record<string, unknown>;
const { storeOptions, ...cacheiroOptions } = rawOptions;

validateConfig(cacheiroOptions, storeOptions);

const store = new FileSystemStore(storeOptions as unknown as FileSystemConfig);
const cacheiro = new Cacheiro(store, cacheiroOptions as unknown as CacheiroConfig);
const _server = await cacheiro.start();

// _server is a Fastify instance — add custom routes, hooks, or plugins here before listen()
// see https://fastify.dev/docs/latest/Reference/Hooks/

await cacheiro.listen();

const shutdown = async () => {
  console.log('Shutting down...');
  await cacheiro.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
