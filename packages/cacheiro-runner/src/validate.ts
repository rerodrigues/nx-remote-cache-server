import { Ajv, type ErrorObject } from 'ajv';
import { configSchema } from '@renatorodrigues/cacheiro';
import { configSchema as storeSchema } from '@renatorodrigues/cacheiro-store-fs';

const ajv = new Ajv({ allErrors: true });
const validateCacheiro = ajv.compile(configSchema);
const validateStore = ajv.compile(storeSchema);

const formatErrors = (errors: ErrorObject[], prefix = ''): string =>
  errors
    .map((e) => {
      const extra = e.params?.additionalProperty ? `: ${e.params.additionalProperty}` : '';
      return `  ${prefix}${e.instancePath || (!prefix ? '(root)' : '')} ${e.message}${extra}`;
    })
    .join('\n');

export function validateConfig(cacheiroOptions: unknown, storeOptions: unknown): void {
  if (!validateCacheiro(cacheiroOptions)) {
    console.error(
      `Invalid configuration:\n${formatErrors(validateCacheiro.errors ?? [], 'cacheiroOptions')}`,
    );
    process.exit(1);
  }

  if (!validateStore(storeOptions)) {
    console.error(
      `Invalid store configuration:\n${formatErrors(validateStore.errors ?? [], 'storeOptions')}`,
    );
    process.exit(1);
  }
}
