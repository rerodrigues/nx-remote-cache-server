import { lstatSync } from 'node:fs';
import { readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export function isExpired(filePath: string, ttlMs: number): boolean {
  if (ttlMs === 0) return false;
  const stat = lstatSync(filePath);
  if (!stat.isFile()) return false;
  return Date.now() - stat.mtimeMs > ttlMs;
}

export async function sweepShards(dir: string, ttlMs: number): Promise<void> {
  const top = await readdir(dir).catch(() => []);
  for (const a of top) {
    const aDir = join(dir, a);
    const mid = await readdir(aDir).catch(() => []);
    for (const b of mid) {
      const bDir = join(aDir, b);
      const files = await readdir(bDir).catch(() => []);
      for (const file of files) {
        const filePath = join(bDir, file);
        if (isExpired(filePath, ttlMs)) await unlink(filePath).catch(() => {});
      }
    }
  }
}
