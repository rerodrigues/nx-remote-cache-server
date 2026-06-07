import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Store } from '../store.js';

export function createGetHandler(store: Store) {
  return async (c: Context, _req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { hash } = c.request.params as { hash: string };

    if (!(await store.exists(hash))) {
      reply.status(404).send();
      return;
    }

    reply.header('Content-Type', 'application/octet-stream');
    await reply.send(store.read(hash));
  };
}
