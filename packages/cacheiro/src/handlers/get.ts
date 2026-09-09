import { once } from 'node:events';
import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';
import type { CacheiroEmitter } from '../hooks.js';

export function createGetHandler(store: CacheiroStore, emitter: CacheiroEmitter) {
  return async (c: Context, req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { hash } = c.request.params as { hash: string };

    if (!(await store.exists(hash))) {
      emitter.emit('cacheMiss', { hash });
      reply.status(404).send();
      return;
    }

    const stream = store.read(hash);
    try {
      await once(stream, 'readable');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        req.log.warn({ err, hash }, 'cache read failed');
      }
      reply.status(404).send();
      return;
    }

    emitter.emit('cacheHit', { hash, expired: stream.expired ?? false });
    reply.header('Content-Type', 'application/octet-stream');
    await reply.send(stream);
  };
}
