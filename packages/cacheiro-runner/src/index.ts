import config from 'config';
import { Ajv, type ErrorObject } from 'ajv';
import { Cacheiro, configSchema, type CacheiroConfig } from '@renatorodrigues/cacheiro';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(configSchema);
const raw = config.util.toObject();

if (!validate(raw)) {
  const errors = (validate.errors ?? [])
    .map((e: ErrorObject) => `  ${e.instancePath || '(root)'} ${e.message}`)
    .join('\n');
  throw new Error(`Invalid configuration:\n${errors}`);
}

const cacheiro = new Cacheiro(raw as unknown as CacheiroConfig);
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
