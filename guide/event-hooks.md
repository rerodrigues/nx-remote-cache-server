---
description: "Event hooks in Cacheiro: observe cache hits, misses, writes, server lifecycle and errors, plus the filesystem store's expiry and sweep events."
---

# Event hooks

Cacheiro emits events at key points of a request and of the server lifecycle. Use them for metrics, logging, alerting, or any custom side effect, without touching the server logic.

There are two independent event sources:

| Source | Events | Subscribe on |
| --- | --- | --- |
| [`Cacheiro`](/packages/core#hooks) | `cacheHit`, `cacheMiss`, `cacheSet`, `serverStart`, `serverStop`, `serverError` | the `Cacheiro` instance |
| [`FileSystemStore`](/packages/store-fs#events) | `expired`, `swept` | the store instance |

Hooks need code, so they are available when you embed [Core](/packages/core) or fork the [Runner](/packages/runner). The prebuilt [Instants](/packages/instants) Docker images do not expose them.

## Registering listeners

There are two equivalent ways to subscribe to `Cacheiro` events. Both feed the same event bus, so you can mix them.

### The `hooks` object

Pass an object as the third constructor argument. Each key is a hook name prefixed with `on`, and each hook takes at most one function.

```ts
import { Cacheiro } from '@renatorodrigues/cacheiro';

const cacheiro = new Cacheiro(store, config, {
  onCacheHit: ({ hash, expired }) => log.info('hit', { hash, expired }),
  onCacheMiss: ({ hash }) => log.info('miss', { hash }),
  onCacheSet: ({ hash }) => log.info('set', { hash }),
});
```

### `.on()`

Call `cacheiro.on()` with the event name (the hook name without the `on` prefix, in camelCase). It can be called any number of times per event, before or after `start()`.

```ts
cacheiro.on('cacheHit', ({ hash }) => metrics.increment('cache.hit'));
cacheiro.on('cacheHit', ({ hash, expired }) => {
  if (expired) metrics.increment('cache.hit_expired');
});
```

### `.off()`

Call `cacheiro.off()` with the event name and the same function reference you registered. This also removes a function passed in the `hooks` object, as long as you keep a reference to it. Removing a listener that was never added does nothing.

```ts
const onHit = ({ hash }) => metrics.increment('cache.hit');
cacheiro.on('cacheHit', onHit);
cacheiro.off('cacheHit', onHit);

const onCacheMiss = ({ hash }) => log.info('miss', { hash });
const withHooks = new Cacheiro(store, config, { onCacheMiss });
withHooks.off('cacheMiss', onCacheMiss);
```

## Cacheiro events

### `cacheHit`

Payload: `{ hash: string; expired: boolean }`

A `GET` found the artifact and is about to stream it to the client. `expired` is `true` when the artifact was past its TTL. The filesystem store serves expired artifacts one last time and then deletes them, so the client does not have to rebuild a task only to upload an identical file. See [TTL behavior](/packages/store-fs#ttl-behavior).

The event fires when the artifact is ready to stream, not when the transfer finishes. A client that disconnects halfway still counts as a hit.

### `cacheMiss`

Payload: `{ hash: string }`

A `GET` found no artifact for the hash, or the artifact could not be read, for example because it was just swept. The client got a `404`.

### `cacheSet`

Payload: `{ hash: string }`

A `PUT` stored a new artifact and the client is about to get a `200`. It does not fire for rejected uploads: a repeat `PUT` for an existing hash gets a `409`, a read-only token gets a `403`, and a body of the wrong type gets a `415`. There is no update event because a hash is never legitimately overwritten, see [No overwrites](/guide/security#no-overwrites).

### `serverStart`

No payload.

Fires after `cacheiro.listen()` has bound the port and printed the startup banner.

### `serverStop`

No payload.

Fires after `cacheiro.stop()` has closed the server.

### `serverError`

Payload: `{ error: Error }`

A request handler threw an uncaught error, and the client got a `500`. An async listener that rejects is reported here too. Oversized bodies are not reported here, because they are answered with a `413` instead.

## Filesystem store events

`FileSystemStore` is an `EventEmitter`. Its events are separate from the `Cacheiro` bus, so subscribe on the store, not on `cacheiro`. Like `Cacheiro`, the store supports both `on()` and `off()`.

### `expired`

Payload: `{ hash: string }`

A read found an artifact past its TTL. The artifact is served one last time and then deleted. For the request that triggers it, `expired` fires first, followed by `cacheHit` with `expired: true`.

### `swept`

Payload: `{ count: number }`

A sweep pass finished and `count` files were removed. It fires after every scheduled pass, and also after a manual `store.sweepNow()`. A sweep that finds nothing still fires, with `count: 0`. Sweeps only run when both `ttlDays` and `sweepIntervalHours` are above `0`.

```ts
store.on('expired', ({ hash }) => log.debug('evicted', { hash }));
store.on('swept', ({ count }) => metrics.gauge('cache.swept', count));
```

## Rules for listeners

- **Keep them fast.** Listeners run inside the request, so a slow one blocks the event loop. Hand data off to a queue or a metrics client instead of doing network calls inline.
- **A throw breaks the request.** An exception in a `cacheHit`, `cacheMiss`, or `cacheSet` listener gives the client a `500` and fires `serverError`. For `cacheSet` the artifact is already stored. Wrap risky code in `try`/`catch`.
- **Async listeners are not awaited.** A rejection is reported through `serverError` and does not crash the process. Errors thrown or rejected inside a `serverError` listener are swallowed, so handle them there.

## Examples

### Hit ratio metrics

Count hits and misses to compute a ratio, and track how many artifacts are stored. Expired hits are counted separately so they do not inflate the ratio of fresh content.

```ts
cacheiro.on('cacheHit', ({ expired }) => {
  metrics.increment(expired ? 'cache.hit.expired' : 'cache.hit');
});
cacheiro.on('cacheMiss', () => metrics.increment('cache.miss'));
cacheiro.on('cacheSet', () => metrics.increment('cache.set'));
```

### Alerting on errors

Forward server errors to an alerting service. The listener is async and not awaited, so it handles its own failures.

```ts
const notifyError = ({ error }: { error: Error }) => {
  alerts
    .notify('cacheiro 500', { message: error.message, stack: error.stack })
    .catch((err) => log.warn('alert delivery failed', err));
};

const cacheiro = new Cacheiro(store, config, { onServerError: notifyError });
```

### Filesystem store housekeeping

Watch how much the TTL sweep removes, and log lazily evicted artifacts.

```ts
import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';

const store = new FileSystemStore({
  cacheDirectory: './cache',
  ttlDays: 7,
  sweepIntervalHours: 24,
});

store.on('expired', ({ hash }) => log.debug('evicted on read', { hash }));
store.on('swept', ({ count }) => {
  metrics.gauge('cache.swept', count);
  if (count > 0) log.info('sweep removed expired artifacts', { count });
});
```

### Putting it together in a runner

The [Runner](/packages/runner) is the natural place to add hooks, because it is the code that constructs `Cacheiro`. This sketch registers events on both sources, then starts the server.

```ts
import { Cacheiro } from '@renatorodrigues/cacheiro';
import { FileSystemStore } from '@renatorodrigues/cacheiro-store-fs';

const store = new FileSystemStore({
  cacheDirectory: './cache',
  ttlDays: 7,
  sweepIntervalHours: 24,
});

const cacheiro = new Cacheiro(
  store,
  {
    server: { port: 3000, host: '0.0.0.0' },
    auth: { token: process.env.CACHEIRO_AUTH_TOKEN },
  },
  {
    onCacheHit: ({ expired }) => metrics.increment(expired ? 'cache.hit.expired' : 'cache.hit'),
    onCacheMiss: () => metrics.increment('cache.miss'),
    onCacheSet: () => metrics.increment('cache.set'),
    onServerError: ({ error }) => log.error('server error', error),
  },
);

store.on('swept', ({ count }) => metrics.gauge('cache.swept', count));

await cacheiro.start();
await cacheiro.listen();
```

## Types

`CacheiroHooks` and `CacheiroEvents` are exported from `@renatorodrigues/cacheiro`, so listeners are fully typed. The payload interfaces live in [`@renatorodrigues/cacheiro-types`](/packages/types).

```ts
import type { CacheiroEvents, CacheiroHooks } from '@renatorodrigues/cacheiro';

const hooks: CacheiroHooks = {
  onCacheHit: ({ hash, expired }) => {},
};

const onMiss = (payload: CacheiroEvents['cacheMiss']) => {};
```
