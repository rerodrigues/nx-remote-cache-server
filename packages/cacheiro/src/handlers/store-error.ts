import type { FastifyRequest } from 'fastify';
import type { CacheiroEmitter } from '../hooks.js';

export interface HandlerOptions {
  failOpen?: boolean;
}

export function reportStoreError(
  err: unknown,
  req: FastifyRequest,
  emitter: CacheiroEmitter,
): void {
  const error = err instanceof Error ? err : new Error(String(err));
  req.log.error(error.message);
  emitter.emit('serverError', { error });
}
