import { createServer } from './server.js';
import { cfg } from './config.js';
import { printBanner } from './banner.js';

const server = await createServer();
const { port, host } = cfg.server;
await server.listen({ port, host });
printBanner(port);
