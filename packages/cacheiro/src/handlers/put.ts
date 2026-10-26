import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';
import type { CacheiroEmitter } from '../hooks.js';
import { reportStoreError, type HandlerOptions } from './store-error.js';

export function createPutHandler(
  store: CacheiroStore,
  emitter: CacheiroEmitter,
  options: HandlerOptions = {},
) {
  return async (c: Context, req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { hash } = c.request.params as { hash: string };

    if (c.security.bearerToken?.readOnly) {
      reply.status(403).type('text/plain').send('Forbidden');
      return;
    }

    if (!Buffer.isBuffer(req.body)) {
      reply.status(415).send({ error: 'Unsupported Media Type' });
      return;
    }

    try {
      if (await store.exists(hash)) {
        reply.status(409).send();
        return;
      }
      await store.write(hash, req.body);
    } catch (err) {
      if (!options.failOpen) throw err;
      // Nx retries a 5xx PUT and then fails the build, but skips the upload on a 403.
      reportStoreError(err, req, emitter);
      reply.status(403).type('text/plain').send('Forbidden');
      return;
    }

    emitter.emit('cacheSet', { hash });
    reply.status(200).send();
  };
}
