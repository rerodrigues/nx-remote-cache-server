import Fastify, { errorCodes } from 'fastify';
import type { FastifyServerOptions } from 'fastify';
import { OpenAPIBackend } from 'openapi-backend';
import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettyBytes from 'pretty-bytes';
import { createPutHandler } from './handlers/put.js';
import { createGetHandler } from './handlers/get.js';
import type { Store } from './store/index.js';
import { cfg } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV !== 'production';

const loggerOptions: FastifyServerOptions['logger'] = isDev
  ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,reqId,req,res,responseTime',
        },
      },
    }
  : true;

function loadSpec() {
  const raw = readFileSync(join(__dirname, '../swagger.json'), 'utf-8');
  return JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ''));
}

export async function createServer(store: Store) {
  await store.mount();

  const api = new OpenAPIBackend({ definition: loadSpec() });

  api.register({
    put: createPutHandler(store),
    get: createGetHandler(store),
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

  const bodyLimitMb = cfg.server.bodyLimitMb;
  const fastify = Fastify({
    logger: loggerOptions,
    bodyLimit: bodyLimitMb * 1024 * 1024,
    disableRequestLogging: true,
  });

  fastify.addHook('onClose', () => {
    store.unmount?.();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    const isPut = request.method === 'PUT';
    const rawSize =
      reply.statusCode === 200
        ? isPut
          ? request.headers['content-length']
          : reply.getHeader('content-length')
        : undefined;
    const size = rawSize ? ` (${prettyBytes(parseInt(String(rawSize), 10))})` : '';
    request.log.info(
      `${request.method} ${request.url} ${reply.statusCode} ${reply.elapsedTime.toFixed(1)}ms${size}`,
    );
    done();
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof errorCodes.FST_ERR_CTP_BODY_TOO_LARGE) {
      const contentLength = request.headers['content-length'];
      const sizePart = contentLength
        ? ` Request size: ${prettyBytes(parseInt(contentLength, 10))}.`
        : '';
      return reply
        .status(413)
        .send(
          `Request body too large. Limit: ${prettyBytes(bodyLimitMb * 1024 * 1024)}.${sizePart}`,
        );
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
