import { Ajv, type ErrorObject, type SchemaObject } from 'ajv';

const ajv = new Ajv({ allErrors: true });

function formatErrors(errors: ErrorObject[], prefix: string): string {
  return errors
    .map((e) => {
      const extra = e.params?.additionalProperty ? `: ${e.params.additionalProperty}` : '';
      return `  ${prefix}${e.instancePath || '(root)'} ${e.message}${extra}`;
    })
    .join('\n');
}

export function validateConfig(
  cacheiroOptions: unknown,
  cacheiroSchema: SchemaObject,
  storeOptions: unknown,
  storeSchema: SchemaObject,
): void {
  const validateCacheiro = ajv.compile(cacheiroSchema);
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
