type GcsLikeError = {
  code?: number | string;
  message?: string;
};

function asGcsError(err: unknown): GcsLikeError | null {
  return err && typeof err === 'object' ? (err as GcsLikeError) : null;
}

function unwrapJsonMessage(message: string): string | null {
  try {
    const parsed = JSON.parse(message) as { error?: { message?: string } };
    if (parsed && parsed.error && typeof parsed.error.message === 'string') {
      return parsed.error.message;
    }
  } catch {
    // not JSON — return null
  }
  return null;
}

export function isNotFound(err: unknown): boolean {
  const e = asGcsError(err);
  return e?.code === 404;
}

export function classifyError(err: unknown, op: 'read' | 'write' | 'head', bucket: string): Error {
  const e = asGcsError(err);
  if (!e) return err instanceof Error ? err : new Error(String(err));

  if (e.code === 'ERR_OSSL_BAD_DECRYPT') {
    return new Error('GcsStore: failed to decrypt — encryption key may be incorrect');
  }
  if (e.code === 404) {
    if (op === 'write') return new Error(`GcsStore: bucket "${bucket}" not found`);
    return new Error(`GcsStore: object not found`);
  }
  if (e.code === 403 || e.code === 401) {
    return new Error(`GcsStore: access denied for ${op}`);
  }
  if (typeof e.message === 'string') {
    if (e.message.toLowerCase().includes('credentials')) {
      return new Error(`GcsStore: access denied for ${op}`);
    }
    const unwrapped = unwrapJsonMessage(e.message);
    if (unwrapped) return new Error(`GcsStore: ${unwrapped}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}
