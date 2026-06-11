import { resolve, sep } from 'node:path';

export function shardPath(baseDir: string, hash: string): { shardDir: string; finalPath: string } {
  if (hash.length < 4 || hash.includes('/') || hash.includes('\\') || hash.includes('..')) {
    throw new Error('Invalid hash');
  }
  const base = resolve(baseDir);
  const shardDir = resolve(base, hash.slice(0, 2), hash.slice(2, 4));
  const finalPath = resolve(shardDir, hash);
  if (!finalPath.startsWith(base + sep)) throw new Error('Invalid hash');
  return { shardDir, finalPath };
}
