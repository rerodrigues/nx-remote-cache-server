import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';

export function createPutHandler(store: CacheiroStore) {
  return async (c: Context, req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { hash } = c.request.params as { hash: string };

    if (!Buffer.isBuffer(req.body)) {
      reply.status(415).send({ error: 'Unsupported Media Type' });
      return;
    }

    if (await store.exists(hash)) {
      reply.status(409).send();
      return;
    }

    await store.write(hash, req.body);
    reply.status(200).send();
  };
}
