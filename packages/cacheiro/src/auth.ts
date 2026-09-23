import { timingSafeEqual } from 'node:crypto';
import type { CacheiroConfig } from './config.js';

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function validateAuthConfig(config: CacheiroConfig): {
  authToken?: string;
  readOnlyToken?: string;
} {
  const authToken = config.auth?.token;
  const readOnlyToken = config.auth?.readOnlyToken;

  if (readOnlyToken === '') {
    throw new Error('auth.readOnlyToken must not be empty when set');
  }
  if (readOnlyToken !== undefined && !authToken) {
    throw new Error('auth.readOnlyToken requires auth.token to be set');
  }
  if (readOnlyToken !== undefined && readOnlyToken === authToken) {
    throw new Error('auth.readOnlyToken must differ from auth.token');
  }
  if (authToken === '') {
    console.warn(
      '[cacheiro] auth.token: "" is deprecated and will be rejected in the next major version. ' +
        'Remove the auth.token field (or the whole auth object) instead of passing an empty string to disable auth.',
    );
  }

  return { authToken, readOnlyToken };
}
