import { readFileSync, existsSync } from 'node:fs';
import type { CacheiroConfig } from './config.js';

function readTlsFile(label: string, filePath: string): Buffer {
  if (!filePath) throw new Error(`TLS ${label} is required`);
  if (!existsSync(filePath)) throw new Error(`TLS ${label} file not found: ${filePath}`);
  const content = readFileSync(filePath);
  if (content.length === 0) throw new Error(`TLS ${label} file is empty: ${filePath}`);
  return content;
}

export function buildTlsOptions(tls: NonNullable<CacheiroConfig['server']['tls']>) {
  return {
    https: {
      cert: readTlsFile('certFile', tls.certFile),
      key: readTlsFile('keyFile', tls.keyFile),
      ca: tls.caFile ? readTlsFile('caFile', tls.caFile) : undefined,
    },
  };
}
