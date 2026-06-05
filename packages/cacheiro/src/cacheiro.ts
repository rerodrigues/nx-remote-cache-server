import { createServer } from './server.js';
import { cfg } from './config.js';

const server = await createServer();
await server.listen({ port: cfg.server.port, host: cfg.server.host });
