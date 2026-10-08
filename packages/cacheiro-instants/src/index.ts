import { Cacheiro, configSchema } from '@renatorodrigues/cacheiro';
import { readCoreConfig } from './core-config.js';
import { loadStore, readStoreType } from './store.js';
import { validateConfig } from './validate.js';

const cacheiroOptions = readCoreConfig();
const storeType = readStoreType();
const { createStore, storeOptions, storeSchema } = await loadStore(storeType);

validateConfig(cacheiroOptions, configSchema, storeOptions, storeSchema);

const cacheiro = new Cacheiro(createStore(), cacheiroOptions);
const _server = await cacheiro.start();

await cacheiro.listen();

if (cacheiroOptions.server.infobox === false) {
  const { port, host } = cacheiroOptions.server;
  const auth = cacheiroOptions.auth?.token ? 'enabled' : 'disabled';
  console.log(
    `cacheiro-instants listening on ${host}:${port} (store=${storeType}, auth=${auth})\n`,
  );
}

const shutdown = async () => {
  console.log('Shutting down...');
  await cacheiro.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
