---
title: "Cacheiro Runner"
subtitle: "A Ready-to-Use Nx Self-Hosted Remote Cache Server"
description: "The Cacheiro Runner is a runnable reference app for self-hosted Nx and Lerna remote caching: layered config, validation, TLS, PM2, Docker, health checks and graceful shutdown out of the box."
date: 2026-10-29
author: Renato Rodrigues
tags:
  - Monorepo
  - Nx
  - Lerna
  - Docker
  - Self-Hosting
---

Running your own remote cache should not mean writing a server. The [Cacheiro Runner](/packages/runner) is a ready-to-use reference implementation of [Cacheiro](/), the self-hosted remote cache server for Nx and Lerna. [Clone the repository](https://github.com/rerodrigues/nx-remote-cache-server) and you have a working remote cache on your own infrastructure.

It is a runnable application rather than a library, and it is not published to npm. Use it as-is, or fork it and make it yours.

It ships wired to the filesystem store, the simplest way to try Cacheiro. It also doubles as a reference for the other backends: the same wiring works for S3, GCS and Azure, as [section&nbsp;4](#_4-start-here-then-make-it-yours) shows.

## 1. Configure It, Don't Code It

Sensible defaults get you running right away. Tweak what you need in a small config file, and override any value with an environment variable when you deploy. The config is checked before the server starts, so a mistake is reported immediately.

With Node.js 22 or newer, getting started takes a handful of commands, with hot reload while you tinker:

```bash
git clone https://github.com/rerodrigues/nx-remote-cache-server.git
cd nx-remote-cache-server
npm install
cd packages/cacheiro-runner
cp config/local.jsonc.example config/local.jsonc
npm run dev
```

Every option is listed in the [config values](/packages/runner#config-values-reference) and [environment variables](/packages/runner#environment-variables-reference) tables.

## 2. Deploy It the Way You Already Do

One app, three ways to run it:

- **Node:** build once and run the compiled output with `node dist/index.js`.
- **PM2:** `npm start` runs it under `pm2-runtime`, with process supervision and restarts.
- **Docker:** build the image yourself and configure it entirely with environment variables.

The runner image is not published, so build it from the repository root first:

```bash
docker build -f packages/cacheiro-runner/Dockerfile -t cacheiro-runner .
```

Then run it:

```bash
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN="super-secret-write-token" \
  -e NODE_ENV=production \
  -v $(pwd)/cache:/cache \
  cacheiro-runner
```

The image already listens on all interfaces, so the published port is reachable without extra configuration.

## 3. Production Details Included

The things you would otherwise add after the first incident are already there.

**Authentication.** Set one token for full access, and optionally a second one for [read-only access](/blog/auth-tokens) so untrusted pull request pipelines can read the cache without being able to write to it.

**Health checks.** The Docker image ships with a built-in health check, so your orchestrator knows when the server is up.

**Logging.** Human-friendly output during development and structured JSON in production by default, switchable with a single setting.

**Cache hygiene.** With the bundled filesystem store, artifacts expire after seven days by default and a sweep removes the expired ones every 24 hours. Both values are configurable, and either can be disabled.

**Clean shutdown.** The runner handles `SIGINT` and `SIGTERM` by stopping the server before exiting, which plays well with container orchestrators.

**HTTPS.** Mount a certificate and key, point the TLS variables at them, and the runner serves HTTPS directly. No reverse proxy is required.

```bash
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN="super-secret-write-token" \
  -e CACHEIRO_TLS_CERT_FILE=/certs/cert.pem \
  -e CACHEIRO_TLS_KEY_FILE=/certs/key.pem \
  -e NODE_ENV=production \
  -v $(pwd)/cache:/cache \
  -v $(pwd)/certs:/certs:ro \
  cacheiro-runner
```

## 4. Start Here, Then Make It Yours

The runner ships with the filesystem store, but it is a starting point rather than a ceiling. Want [S3](/packages/store-s3), [GCS](/packages/store-gcs) or [Azure](/packages/store-azure) instead? Swap the store in the entry point, adjust the config to match, and update the Dockerfile, which is wired for the filesystem store only.

The entry point is deliberately small and easy to read, and the server instance is available before it starts listening, so custom routes, hooks and plugins have an obvious home. The package also comes with tests, linting and formatting scripts, so a fork starts from a healthy baseline.

Want a prebuilt image instead of building your own? [Cacheiro Instants](/packages/instants) publishes ready-to-run images for the filesystem, S3, GCS and Azure stores.

Once your server is up, the [getting started guide](/guide/getting-started#_2-point-nx-or-lerna-at-it) shows how to point Nx or Lerna at it.
