type AzureLikeError = {
  name?: string;
  message?: string;
  code?: string;
  statusCode?: number;
};

const AUTH_ERROR_NAMES = new Set([
  'AuthenticationError',
  'AuthenticationRequiredError',
  'AggregateAuthenticationError',
]);

function asAzureError(err: unknown): AzureLikeError | null {
  return err && typeof err === 'object' ? (err as AzureLikeError) : null;
}

export function isNotFound(err: unknown): boolean {
  const e = asAzureError(err);
  if (!e) return false;
  if (e.statusCode === 404) return e.code !== 'ContainerNotFound';
  return e.code === 'BlobNotFound';
}

export function classifyError(
  err: unknown,
  op: 'read' | 'write' | 'head',
  container: string,
): Error {
  const e = asAzureError(err);
  if (!e) return err instanceof Error ? err : new Error(String(err));

  if (e.code === 'ERR_OSSL_BAD_DECRYPT') {
    return new Error('AzureStore: failed to decrypt — encryption key may be incorrect');
  }
  if (e.statusCode === 404 && e.code === 'ContainerNotFound') {
    return new Error(`AzureStore: container "${container}" not found`);
  }
  if (
    (e.name && AUTH_ERROR_NAMES.has(e.name)) ||
    e.code === 'AuthenticationFailed' ||
    e.statusCode === 403 ||
    e.statusCode === 401
  ) {
    return new Error(`AzureStore: access denied for ${op}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}
