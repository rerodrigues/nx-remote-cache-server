const VALID_HASH = /^[A-Za-z0-9_-]+$/;

export function isValidHash(hash: string): boolean {
  return VALID_HASH.test(hash);
}
