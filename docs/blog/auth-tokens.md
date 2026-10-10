---
title: "Fine-Grained Token Control"
subtitle: "Read-Only Caching and Optional Auth in Cacheiro"
description: "How Cacheiro mitigates build cache poisoning (CVE-2025-36852) with read-only tokens and simplifies local development with optional authentication."
date: 2026-10-10
author: Renato Rodrigues
tags:
  - Security
  - Monorepo
  - Nx
  - Lerna
  - CI/CD
---

Remote caching speeds up monorepo builds, but sharing a single read/write token across all environments introduces security risks. Following build cache vulnerabilities like [CVE-2025-36852 (CREEP)](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-36852), an untrusted pull request with write access could potentially poison the cache and affect downstream builds.

To prevent cache poisoning while keeping local workflows friction-free, [Cacheiro](/), the self-hosted remote cache server for Nx and Lerna, now supports read-only tokens and optional authentication.

## 1. Read-Only Tokens for CI Pipelines

Decoupling read and write permissions ensures that pull requests can pull cached artifacts without being able to overwrite or introduce new ones. A request bearing the read-only token can `GET` artifacts, and gets a `403` on `PUT`.

### Server Configuration

Configure a write token and a read-only token on your Cacheiro instance. The read-only token requires the write token to be set and must differ from it:

```bash
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN="super-secret-write-token" \
  -e CACHEIRO_AUTH_READ_ONLY_TOKEN="public-read-only-token" \
  -v $(pwd)/cache:/cache \
  ghcr.io/rerodrigues/cacheiro-instants-fs
```

### Client Configuration

Nx and Lerna send whatever token is set in `NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN`. Give the full token to trusted pipelines (main branch, releases) and only the read-only token to untrusted ones (pull requests, forks).

In GitHub Actions, pass only the read-only token to PR workflows:

```yaml
- name: Run Nx Build & Cache
  env:
    NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN: ${{ secrets.CACHEIRO_READ_ONLY_TOKEN }}
  run: npx nx run-many --target=build
```

## 2. Optional Authentication for Local Setup

Enforcing authentication during local development can add unnecessary setup overhead. Authentication is optional: if you leave out `CACHEIRO_AUTH_TOKEN` (or the `auth` config block when using Cacheiro as a library), authentication is disabled.

```bash
# Run Cacheiro without authentication
docker run -p 3000:3000 \
  -v $(pwd)/cache:/cache \
  ghcr.io/rerodrigues/cacheiro-instants-fs
```

::: warning Security Note
Only disable authentication in trusted or local environments (e.g., localhost or isolated Docker networks).
:::

See the [Security guide](/guide/security) for the full details.
