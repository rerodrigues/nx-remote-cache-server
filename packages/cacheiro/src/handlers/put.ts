import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';
import type { CacheiroEmitter } from '../hooks.js';
import { isValidHash } from '../hash.js';

export function createPutHandler(store: CacheiroStore, emitter: CacheiroEmitter) {
  return async (c: Context, req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { hash } = c.request.params as { hash: string };

    if (c.security.bearerToken?.readOnly) {
      reply.status(403).type('text/plain').send('Forbidden');
      return;
    }

    if (!isValidHash(hash)) {
      reply.status(400).send({ error: 'Bad Request' });
      return;
    }

    if (!Buffer.isBuffer(req.body)) {
      reply.status(415).send({ error: 'Unsupported Media Type' });
      return;
    }

    if (await store.exists(hash)) {
      reply.status(409).send();
      return;
    }

    await store.write(hash, req.body);
    emitter.emit('cacheSet', { hash });
    reply.status(200).send();
  };
}
