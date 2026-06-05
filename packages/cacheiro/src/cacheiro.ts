import { createServer } from './server.js';
import { cfg } from './config.js';

const server = await createServer();
const { port, host } = cfg.server;
await server.listen({ port, host });
