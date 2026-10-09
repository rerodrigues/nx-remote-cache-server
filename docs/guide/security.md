# Security

## Why it matters

In May 2026, Nx deprecated its official self-hosted cache packages because of [CVE-2025-36852](https://www.cve.org/CVERecord?id=CVE-2025-36852), a cache poisoning vulnerability (also known as CREEP). If anyone who can run a build can also write to the shared cache, a malicious build can plant artifacts that other developers and CI jobs will later trust.

## Bearer token

Set `auth.token` (or `CACHEIRO_AUTH_TOKEN` in the runner and Docker images) and every `/v1/cache/*` request needs an `Authorization: Bearer <token>` header. Nx sends it for you when `NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN` is set. `/health` needs no auth.

If `auth` is omitted entirely, authentication is disabled. Only do that on a trusted network.

## Read-only token

Set `auth.readOnlyToken` (`CACHEIRO_AUTH_READ_ONLY_TOKEN`) as well, and requests bearing that token can `GET` artifacts but get a `403` on `PUT`. It requires `auth.token` to be set and must differ from it.

Hand the read-only token to untrusted CI, such as pull request builds from forks, so they benefit from the cache without being able to poison it. Keep the full token for trusted builds, such as your main branch.

```sh
# trusted pipeline (main branch): can read and write
export NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN="$CACHEIRO_AUTH_TOKEN"

# untrusted pipeline (pull requests): read only
export NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN="$CACHEIRO_AUTH_READ_ONLY_TOKEN"
```

## No overwrites

Cache keys are content-addressed, so an existing hash is never legitimately overwritten. A repeat `PUT` for the same hash gets a `409`.

## HTTPS

Set `server.tls.certFile` and `server.tls.keyFile` (`CACHEIRO_TLS_CERT_FILE` and `CACHEIRO_TLS_KEY_FILE`) to serve HTTPS natively. `server.tls.caFile` is optional.

## Reference

- [Core: `CacheiroConfig`](/packages/core#cacheiroconfig) and [HTTP API](/packages/core#http-api)
- [Instants: environment variables](/packages/instants#configuration)
- [Runner: config values](/packages/runner#config-values-reference)
