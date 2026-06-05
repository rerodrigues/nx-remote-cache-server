import Fastify, { errorCodes } from 'fastify';
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
import { cfg } from './config.js';

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
    unauthorizedHandler: async (_c: Context, _req: FastifyRequest, reply: FastifyReply) =>
      reply.status(401).send('Unauthorized'),
    notFound: async (_c: Context, _req: FastifyRequest, reply: FastifyReply) =>
      reply.status(404).send(),
    validationFail: async (c: Context, _req: FastifyRequest, reply: FastifyReply) =>
      reply.status(400).send(c.validation.errors),
  });

  api.registerSecurityHandler('bearerToken', (c) => {
    const authToken = cfg.auth.token;
    if (!authToken) return true;
    const auth = c.request.headers['authorization'] as string | undefined;
    if (!auth) return false;
    const token = auth.replace(/^Bearer\s+/i, '');
    return token === authToken;
  });

  await api.init();

  const bodyLimitMb = cfg.server.bodyLimitMb ?? 500;
  const fastify = Fastify({ logger: true, bodyLimit: bodyLimitMb * 1024 * 1024 });

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof errorCodes.FST_ERR_CTP_BODY_TOO_LARGE) {
      const contentLength = request.headers['content-length'];
      const sizePart = contentLength
        ? ` Request size: ${(parseInt(contentLength, 10) / 1024 / 1024).toFixed(1)} MB.`
        : '';
      return reply.status(413).send(`Request body too large. Limit: ${bodyLimitMb} MB.${sizePart}`);
    }
    reply.send(error);
  });

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
