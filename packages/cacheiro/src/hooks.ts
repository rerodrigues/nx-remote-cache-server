import { EventEmitter } from 'node:events';
import type { CacheiroEvents, CacheiroHooks } from '@renatorodrigues/cacheiro-types';

export class CacheiroEmitter extends EventEmitter {
  constructor() {
    super({ captureRejections: true });
  }

  [EventEmitter.captureRejectionSymbol](error: unknown, event: string | symbol): void {
    const err = error instanceof Error ? error : new Error(String(error));
    if (event === 'serverError') return;
    try {
      this.emit('serverError', { error: err });
    } catch {
      return;
    }
  }

  override on<K extends keyof CacheiroEvents>(
    event: K,
    listener: (payload: CacheiroEvents[K]) => void,
  ): this {
    return super.on(event, listener);
  }

  override off<K extends keyof CacheiroEvents>(
    event: K,
    listener: (payload: CacheiroEvents[K]) => void,
  ): this {
    return super.off(event, listener);
  }

  override emit<K extends keyof CacheiroEvents>(event: K, payload: CacheiroEvents[K]): boolean {
    return super.emit(event, payload);
  }
}

const HOOK_TO_EVENT = {
  onCacheHit: 'cacheHit',
  onCacheMiss: 'cacheMiss',
  onCacheSet: 'cacheSet',
  onServerStart: 'serverStart',
  onServerStop: 'serverStop',
  onServerError: 'serverError',
} as const satisfies Record<keyof CacheiroHooks, keyof CacheiroEvents>;

export function wireHooks(emitter: CacheiroEmitter, hooks?: CacheiroHooks): void {
  if (!hooks) return;
  for (const hookName of Object.keys(HOOK_TO_EVENT) as (keyof CacheiroHooks)[]) {
    const listener = hooks[hookName];
    if (!listener) continue;
    const eventName = HOOK_TO_EVENT[hookName];
    emitter.on(eventName, listener as (payload: CacheiroEvents[typeof eventName]) => void);
  }
}
