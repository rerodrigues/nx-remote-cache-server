# `@renatorodrigues/cacheiro-runner`

Reference runner for [`@renatorodrigues/cacheiro`](../cacheiro). Loads config via the [`config`](https://www.npmjs.com/package/config) npm package, validates it with AJV, instantiates a `FileSystemStore`, then starts a `Cacheiro` server.

This is a runnable application, not a library. It is not published to npm (`private: true`). Use it as-is, fork it, or write your own runner on top of `cacheiro`'s exported API.

## Requirements

- Node.js 22+

## Getting started

```sh
cp config/local.json.example config/local.json
# edit config/local.json — set auth.token and adjust storeOptions
npm run dev
```

## Configuration

Two layers: JSON config files + environment variables. Environment variables always win.

### Config files

Resolved in order — later entries override earlier ones:

| File                                       | Purpose                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `config/default.json`                      | Base defaults (port 3000, filesystem store, 100 MB body limit)                        |
| `config/production.json`                   | Production overrides — applied when `NODE_ENV=production`                             |
| `config/local.json`                        | Local overrides — highest file priority, gitignored, create from `local.json.example` |
| `config/custom-environment-variables.json` | Maps env vars to config keys — overrides all files when the env var is set            |

### Config values

See [Config values reference](#config-values-reference) below.

### Environment variables

See [Environment variables reference](#environment-variables-reference) below.

## Deployment

### Dev (hot reload)

```sh
npm run dev
```

### Node (built)

```sh
npm run build
node dist/index.js
```

### PM2

```sh
npm start
# uses ecosystem.config.cjs — runs node dist/index.js under pm2-runtime
```

### Docker

Build from the repo root (the Dockerfile needs access to the full monorepo):

```sh
docker build -f packages/cacheiro-runner/Dockerfile -t cacheiro-runner .
```

Run:

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -e NODE_ENV=production \
  -v $(pwd)/cache:/cache \
  cacheiro-runner
```

To use a cloud store (S3, GCS, Azure), use this runner as a starting point: update `src/index.ts` to import and instantiate the appropriate store package, and update the config files to match. See each store package's README for config fields and conventional env var names. `config/local.json.example` includes working `storeOptions` examples for all supported stores.

## Development

```sh
npm run dev            # watch + watch:others (full hot reload — server and dep packages)
npm run watch          # tsx watch src/index.ts — server only
npm run watch:others   # rebuilds dep packages on change (silent unless error)
npm run build          # compile TypeScript
npm run lint           # oxlint
npm run lint:fix       # oxlint --fix
npm run fmt            # oxfmt
npm run fmt:check      # oxfmt --check
```

## Config values reference

| Key                               | Default     | Description                                                                                                |
| --------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `server.port`                     | `3000`      | HTTP port to listen on                                                                                     |
| `server.host`                     | `0.0.0.0`   | Host to bind to                                                                                            |
| `server.bodyLimitMb`              | `100`       | Max request body size in MB                                                                                |
| `server.banner`                   | `true`      | Show ASCII art startup banner. When `false`, prints a compact single-line header instead.                  |
| `server.infobox`                  | `true`      | Show the info box with version, URL, and store details. When `false`, the version is shown inline instead. |
| `auth.token`                      | `""`        | Bearer token required on all requests. Auth is disabled if empty.                                          |
| `storeOptions.cacheDirectory`     | `"./cache"` | Directory where artifacts are stored.                                                                      |
| `storeOptions.ttlDays`            | `7`         | Artifact TTL in days. `0` disables expiration.                                                             |
| `storeOptions.sweepIntervalHours` | `24`        | How often to sweep for expired artifacts (hours). `0` disables the sweep.                                  |

## Environment variables reference

| Variable                              | Config key                        | Default        |
| ------------------------------------- | --------------------------------- | -------------- |
| `CACHEIRO_AUTH_TOKEN`                 | `auth.token`                      | `""` (no auth) |
| `CACHEIRO_PORT`                       | `server.port`                     | `3000`         |
| `CACHEIRO_HOST`                       | `server.host`                     | `0.0.0.0`      |
| `CACHEIRO_BODY_LIMIT_MB`              | `server.bodyLimitMb`              | `100`          |
| `CACHEIRO_BANNER`                     | `server.banner`                   | `true`         |
| `CACHEIRO_INFOBOX`                    | `server.infobox`                  | `true`         |
| `CACHEIRO_CACHE_DIRECTORY`            | `storeOptions.cacheDirectory`     | `./cache`      |
| `CACHEIRO_CACHE_TTL_DAYS`             | `storeOptions.ttlDays`            | `7`            |
| `CACHEIRO_CACHE_SWEEP_INTERVAL_HOURS` | `storeOptions.sweepIntervalHours` | `24`           |

---

<br/>
<p align="center">Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐</p>
