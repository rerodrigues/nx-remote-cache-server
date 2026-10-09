---
layout: home

hero:
  name: Cacheiro
  text: Your own Nx and Lerna remote cache
  tagline: Self-hosted, open source, no strings attached.
  image:
    light: /logo-light.svg
    dark: /logo-dark.svg
    alt: Cacheiro top hat logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Packages
      link: /packages/core
    - theme: alt
      text: GitHub
      link: https://github.com/rerodrigues/nx-remote-cache-server

features:
  - title: Drop-in for Nx and Lerna
    details: Implements the Nx remote cache OpenAPI spec. Point Nx or Lerna at it with two environment variables.
  - title: Ready-to-use Docker images
    details: Cacheiro Instants ship one image per store flavor on GHCR. Configure with environment variables and run.
  - title: Pluggable stores
    details: Filesystem, S3 (and S3-compatible), Google Cloud Storage, and Azure Blob Storage. Bring your own store if you need another.
  - title: Secure by default
    details: Bearer-token auth, native HTTPS, and an optional read-only token for untrusted CI. Built after CVE-2025-36852.
  - title: A toolkit, not a framework
    details: Use the core library on its own. Wire in your own store, config loader, hooks, or Fastify routes.
  - title: No vendor lock-in
    details: MIT licensed, self-hosted, and no proprietary cloud behind it.
---

## Run it in one command

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -v $(pwd)/cache:/cache \
  ghcr.io/rerodrigues/cacheiro-instants-fs
```

Then point Nx or Lerna at it:

```sh
export NX_SELF_HOSTED_REMOTE_CACHE_SERVER="http://localhost:3000"
export NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN="my-secret-token"

nx run-many -t build
# or
lerna run build
```

Images exist for `fs`, `s3`, `gcs`, and `azure`. See [Getting started](/guide/getting-started) for the next steps.

## Why Cacheiro exists

In May 2026, Nx deprecated all their official self-hosted cache packages due to [CVE-2025-36852](https://www.cve.org/CVERecord?id=CVE-2025-36852), a critical cache poisoning vulnerability. Their official recommendation was to migrate to Nx Cloud (paid) or build your own cache server from scratch.

So Cacheiro was built, and made open source for everyone in the same boat. Lerna uses Nx under the hood for task orchestration, so if you are on Lerna you benefit from remote caching automatically.

Read the full story in the [announcement article on dev.to](https://dev.to/rerodrigues/creating-your-own-remote-cache-server-for-nx-and-lerna-with-cacheiro-2dcg).
