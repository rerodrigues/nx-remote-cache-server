import { randomBytes } from 'node:crypto';
import { mkdir, open, rename, unlink } from 'node:fs/promises';

export async function atomicWrite(
  shardDir: string,
  finalPath: string,
  data: Buffer,
): Promise<void> {
  await mkdir(shardDir, { recursive: true });
  const tmpPath = `${finalPath}.tmp-${randomBytes(8).toString('hex')}`;
  const handle = await open(tmpPath, 'wx');
  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(tmpPath, finalPath);
  } catch (err) {
    await unlink(tmpPath).catch(() => {});
    throw err;
  }
}
