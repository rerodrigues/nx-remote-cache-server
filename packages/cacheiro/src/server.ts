import Fastify, { errorCodes, LogController } from 'fastify';
import type { FastifyServerOptions } from 'fastify';
import { OpenAPIBackend } from 'openapi-backend';
import type { Context } from 'openapi-backend';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import prettyBytes from 'pretty-bytes';
import { createPutHandler } from './handlers/put.js';
import { createGetHandler } from './handlers/get.js';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';
import type { CacheiroConfig } from './config.js';
import { CacheiroEmitter } from './hooks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_BODY_LIMIT_MB = 100;

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

function readTlsFile(label: string, filePath: string): Buffer {
  if (!filePath) throw new Error(`TLS ${label} is required`);
  if (!existsSync(filePath)) throw new Error(`TLS ${label} file not found: ${filePath}`);
  const content = readFileSync(filePath);
  if (content.length === 0) throw new Error(`TLS ${label} file is empty: ${filePath}`);
  return content;
}

function buildTlsOptions(tls: NonNullable<CacheiroConfig['server']['tls']>) {
  return {
    https: {
      cert: readTlsFile('certFile', tls.certFile),
      key: readTlsFile('keyFile', tls.keyFile),
      ca: tls.caFile ? readTlsFile('caFile', tls.caFile) : undefined,
    },
  };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function validateAuthConfig(config: CacheiroConfig): {
  authToken?: string;
  readOnlyToken?: string;
} {
  const authToken = config.auth?.token;
  const readOnlyToken = config.auth?.readOnlyToken;

  if (readOnlyToken === '') {
    throw new Error('auth.readOnlyToken must not be empty when set');
  }
  if (readOnlyToken !== undefined && !authToken) {
    throw new Error('auth.readOnlyToken requires auth.token to be set');
  }
  if (readOnlyToken !== undefined && readOnlyToken === authToken) {
    throw new Error('auth.readOnlyToken must differ from auth.token');
  }
  if (authToken === '') {
    console.warn(
      '[cacheiro] auth.token: "" is deprecated and will be rejected in the next major version. ' +
        'Remove the auth.token field (or the whole auth object) instead of passing an empty string to disable auth.',
    );
  }

  return { authToken, readOnlyToken };
}

export async function createServer(
  store: CacheiroStore,
  config: CacheiroConfig,
  emitter: CacheiroEmitter = new CacheiroEmitter(),
) {
  const { authToken, readOnlyToken } = validateAuthConfig(config);

  const api = new OpenAPIBackend({ definition: loadSpec() });

  api.register({
    put: createPutHandler(store, emitter),
    get: createGetHandler(store, emitter),
    unauthorizedHandler: async (_c: Context, _req: FastifyRequest, reply: FastifyReply) =>
      reply.status(401).type('text/plain').send('Unauthorized'),
    notFound: async (_c: Context, _req: FastifyRequest, reply: FastifyReply) =>
      reply.status(404).send(),
    validationFail: async (c: Context, req: FastifyRequest, reply: FastifyReply) => {
      req.log.warn({ errors: c.validation.errors }, 'request validation failed');
      return reply.status(400).send({ error: 'Bad Request' });
    },
  });

  api.registerSecurityHandler('bearerToken', (c) => {
    if (!authToken) return true;
    const auth = c.request.headers['authorization'] as string | undefined;
    if (!auth) return false;
    const token = auth.replace(/^Bearer\s+/i, '');

    const isReadWrite = safeEqual(token, authToken);
    const isReadOnly = readOnlyToken ? safeEqual(token, readOnlyToken) : false;
    if (!isReadWrite && !isReadOnly) return false;

    return { readOnly: !isReadWrite };
  });

  await api.init();

  const bodyLimitMb = config.server.bodyLimitMb ?? DEFAULT_BODY_LIMIT_MB;
  const tlsOptions = config.server.tls ? buildTlsOptions(config.server.tls) : {};
  const fastify = Fastify({
    logger: loggerOptions,
    bodyLimit: bodyLimitMb * 1024 * 1024,
    logController: new LogController({ disableRequestLogging: true }),
    ...tlsOptions,
  });

  await store.mount();

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
    const msg = `${request.method} ${request.url} ${reply.statusCode} ${reply.elapsedTime.toFixed(1)}ms${size}`;
    if (reply.statusCode >= 500) {
      request.log.error(msg);
    } else if (reply.statusCode >= 400 && reply.statusCode !== 404) {
      request.log.warn(msg);
    } else {
      request.log.info(msg);
    }
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
    const err = error instanceof Error ? error : new Error(String(error));
    request.log.error(err.message);
    emitter.emit('serverError', { error: err });
    reply.status(500).send({ error: 'Internal Server Error' });
  });

  fastify.addContentTypeParser(
    'application/octet-stream',
    { parseAs: 'buffer' },
    (_req, body, done) => done(null, body),
  );

  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).type('text/plain').send('OK');
  });

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
