import { createServer } from './server.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

const server = await createServer();
await server.listen({ port: PORT, host: HOST });
