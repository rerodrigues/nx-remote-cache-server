import config from 'config';
import { Ajv, type ErrorObject } from 'ajv';
import { Cacheiro, configSchema, type CacheiroConfig } from '@renatorodrigues/cacheiro';
import {
  FileSystemStore,
  configSchema as storeSchema,
  type FileSystemConfig,
} from '@renatorodrigues/cacheiro-store-fs';

const ajv = new Ajv({ allErrors: true });
const validateCacheiro = ajv.compile(configSchema);
const validateStore = ajv.compile(storeSchema);

const rawOptions = config.util.toObject() as Record<string, unknown>;
const { storeOptions, ...cacheiroOptions } = rawOptions;

if (!validateCacheiro(cacheiroOptions)) {
  const errors = (validateCacheiro.errors ?? [])
    .map((e: ErrorObject) => `  ${e.instancePath || '(root)'} ${e.message}`)
    .join('\n');
  console.error(`Invalid configuration:\n${errors}`);
  process.exit(1);
}

if (!validateStore(storeOptions)) {
  const errors = (validateStore.errors ?? [])
    .map((e: ErrorObject) => `  storeOptions${e.instancePath || ''} ${e.message}`)
    .join('\n');
  console.error(`Invalid store configuration:\n${errors}`);
  process.exit(1);
}

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
