import config from 'config';
import { Ajv, type ErrorObject } from 'ajv';
import { startServer, configSchema, type CacheiroConfig } from '@renatorodrigues/cacheiro';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(configSchema);
const raw = config.util.toObject();

if (!validate(raw)) {
  const errors = (validate.errors ?? [])
    .map((e: ErrorObject) => `  ${e.instancePath || '(root)'} ${e.message}`)
    .join('\n');
  throw new Error(`Invalid configuration:\n${errors}`);
}

const { server, close } = await startServer(raw as unknown as CacheiroConfig);

const shutdown = async () => {
  console.log('Shutting down...');
  server.closeAllConnections();
  await close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
