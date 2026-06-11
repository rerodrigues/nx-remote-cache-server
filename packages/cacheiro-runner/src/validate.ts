import { Ajv, type ErrorObject } from 'ajv';
import { configSchema } from '@renatorodrigues/cacheiro';

const ajv = new Ajv({ allErrors: true });
const validateCacheiro = ajv.compile(configSchema);

const formatErrors = (errors: ErrorObject[], prefix = ''): string =>
  errors
    .map((e) => {
      const extra = e.params?.additionalProperty ? `: ${e.params.additionalProperty}` : '';
      return `  ${prefix}${e.instancePath || (!prefix ? '(root)' : '')} ${e.message}${extra}`;
    })
    .join('\n');

export function validateConfig(
  cacheiroOptions: unknown,
  storeOptions: unknown,
  storeSchema: object,
): void {
  if (!validateCacheiro(cacheiroOptions)) {
    console.error(
      `Invalid configuration:\n${formatErrors(validateCacheiro.errors ?? [], 'cacheiroOptions')}`,
    );
    process.exit(1);
  }

  const validateStore = ajv.compile(storeSchema);
  if (!validateStore(storeOptions)) {
    console.error(
      `Invalid store configuration:\n${formatErrors(validateStore.errors ?? [], 'storeOptions')}`,
    );
    process.exit(1);
  }
}
