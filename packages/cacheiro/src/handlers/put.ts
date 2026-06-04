import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Store } from '../store/index.js';

export function createPutHandler(store: Store) {
  return async (c: Context, req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { hash } = c.request.params as { hash: string };

    if (await store.exists(hash)) {
      reply.status(409).send();
      return;
    }

    await store.write(hash, req.body as Buffer);
    reply.status(200).send();
  };
}
