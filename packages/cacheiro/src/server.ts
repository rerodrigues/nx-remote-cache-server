import Fastify from 'fastify';
import { OpenAPIBackend } from 'openapi-backend';
import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPutHandler } from './handlers/put.js';
import { createGetHandler } from './handlers/get.js';
import { createStore } from './store/index.js';
import type { Store } from './store/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadSpec() {
  const raw = readFileSync(join(__dirname, '../swagger.json'), 'utf-8');
  return JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ''));
}

export async function createServer(store?: Store) {
  const s = store ?? createStore();
  await s.init();

  const api = new OpenAPIBackend({ definition: loadSpec() });

  api.register({
    put: createPutHandler(s),
    get: createGetHandler(s),
    unauthorizedHandler: async (_c: Context, _req: FastifyRequest, reply: FastifyReply) => reply.status(401).send('Unauthorized'),
    notFound: async (_c: Context, _req: FastifyRequest, reply: FastifyReply) => reply.status(404).send(),
    validationFail: async (c: Context, _req: FastifyRequest, reply: FastifyReply) => reply.status(400).send(c.validation.errors),
  });

  api.registerSecurityHandler('bearerToken', (c) => {
    const authToken = process.env.AUTH_TOKEN;
    const auth = c.request.headers['authorization'] as string | undefined;
    if (!auth) return false;
    const token = auth.replace(/^Bearer\s+/i, '');
    return !authToken || token === authToken;
  });

  await api.init();

  const fastify = Fastify({ logger: true });

  fastify.addContentTypeParser(
    'application/octet-stream',
    { parseAs: 'buffer' },
    (_req, body, done) => done(null, body),
  );

  fastify.all('/v1/cache/*', async (request, reply) => {
    return api.handleRequest(
      {
        method: request.method,
        path: request.url,
        body: request.body,
        query: request.query as Record<string, string>,
        headers: request.headers as Record<string, string>,
      },
      request,
      reply,
    );
  });

  return fastify;
}
