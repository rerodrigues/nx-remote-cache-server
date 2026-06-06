import { createServer } from './server.js';
import { createStore } from './store/index.js';
import { cfg } from './config.js';
import { printBanner } from './banner.js';

const store = createStore();
const server = await createServer(store);
const { port, host } = cfg.server;
await server.listen({ port, host });
printBanner(port, store);
