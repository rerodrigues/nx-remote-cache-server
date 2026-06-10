export function isNotFound(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e.name === 'NotFound' || e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404;
}

export function classifyError(err: unknown, op: 'read' | 'write' | 'head', bucket: string): Error {
  if (!err || typeof err !== 'object') {
    return err instanceof Error ? err : new Error(String(err));
  }
  const e = err as {
    name?: string;
    message?: string;
    code?: string;
    $metadata?: { httpStatusCode?: number };
  };

  if (e.code === 'ERR_OSSL_BAD_DECRYPT') {
    return new Error('S3Store: failed to decrypt — encryption key may be incorrect');
  }
  if (e.name === 'NoSuchBucket') {
    return new Error(`S3Store: bucket "${bucket}" not found`);
  }
  if (
    e.name === 'ExpiredToken' ||
    (typeof e.message === 'string' && e.message.includes('The provided token has expired'))
  ) {
    return new Error(`S3Store: credentials expired for ${op}`);
  }
  if (e.name === 'CredentialsProviderError') {
    return new Error(`S3Store: missing or invalid credentials for ${op}`);
  }
  const status = e.$metadata?.httpStatusCode;
  if (status === 403 || status === 401) {
    return new Error(`S3Store: access denied for ${op}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}
