# `@renatorodrigues/cacheiro`

Self-hosted [NX remote cache](https://nx.dev/recipes/running-tasks/self-hosted-caching) server. Implements the NX 20.8+ custom remote cache specification.

## Requirements

- Node.js 22+

## Usage

### Install dependencies

```sh
npm install
```

### Build

```sh
npm run build
```

### Start (production)

```sh
npm run build
npm start
```

The server runs under PM2 in runtime mode (foreground, no daemon).

### Start (Docker)

```sh
# from repo root
docker build -f packages/cacheiro/Dockerfile -t cacheiro .
docker run -p 3000:3000 -v ./cache:/cache cacheiro
```

The cache directory is mounted at `/cache` inside the container. All config values can be passed as environment variables:

```sh
docker run -p 3000:3000 -v ./cache:/cache \
  -e AUTH_TOKEN=secret \
  -e CACHE_TTL_DAYS=30 \
  cacheiro
```

### Start (development)

```sh
npm run dev
```

Uses `tsx watch` for instant hot reload — no build step required.

## Configuration

Configuration is file-based using the [`config`](https://www.npmjs.com/package/config) package. Files live in the `config/` directory and are merged by environment.

| File                     | Purpose                                         | Committed       |
| ------------------------ | ----------------------------------------------- | --------------- |
| `config/default.json`    | Base defaults for all environments              | Yes             |
| `config/local.json`      | Local dev overrides                             | No (gitignored) |
| `config/test.json`       | Test overrides (loaded automatically by vitest) | Yes             |
| `config/production.json` | Production overrides                            | Yes             |

Copy `config/local.json.example` to `config/local.json` to configure your local setup:

```sh
cp config/local.json.example config/local.json
```

### Config values

| Key                                   | Default        | Description                                                                                         |
| ------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `server.port`                         | `3000`         | HTTP port to listen on                                                                              |
| `server.host`                         | `0.0.0.0`      | Host to bind to                                                                                     |
| `server.bodyLimitMb`                  | `500`          | Max request body size in MB                                                                         |
| `server.banner`                       | `true`         | Show ASCII art startup banner. When `false`, prints a compact single-line header instead.           |
| `auth.token`                          | `""`           | Bearer token required on all requests. Auth is disabled if empty.                                   |
| `store.type`                          | `"filesystem"` | Storage backend. See [Stores](#stores) below.                                                       |
| `store.filesystem.dir`                | `"./cache"`    | _(filesystem store only)_ Directory where artifacts are stored.                                     |
| `store.filesystem.ttlDays`            | `7`            | _(filesystem store only)_ Artifact TTL in days. `0` disables expiration.                            |
| `store.filesystem.sweepIntervalHours` | `24`           | _(filesystem store only)_ How often to sweep for expired artifacts (hours). `0` disables the sweep. |

### Environment variable overrides

All config values can still be overridden via environment variables (useful in CI/Docker):

| Variable                     | Config key                            |
| ---------------------------- | ------------------------------------- |
| `PORT`                       | `server.port`                         |
| `HOST`                       | `server.host`                         |
| `BODY_LIMIT_MB`              | `server.bodyLimitMb`                  |
| `BANNER`                     | `server.banner`                       |
| `AUTH_TOKEN`                 | `auth.token`                          |
| `CACHE_STORE`                | `store.type`                          |
| `CACHE_DIR`                  | `store.filesystem.dir`                |
| `CACHE_TTL_DAYS`             | `store.filesystem.ttlDays`            |
| `CACHE_SWEEP_INTERVAL_HOURS` | `store.filesystem.sweepIntervalHours` |

## API

Defined by [`swagger.json`](./swagger.json) (OpenAPI 3.0).

| Method | Path              | Description              |
| ------ | ----------------- | ------------------------ |
| `PUT`  | `/v1/cache/:hash` | Upload a task artifact   |
| `GET`  | `/v1/cache/:hash` | Download a task artifact |

All endpoints require an `Authorization: Bearer <token>` header when `auth.token` is set.

## Stores

The storage backend is selected via `store.type`.

### `filesystem` (default)

Stores artifacts on the local filesystem under `store.filesystem.dir`.

### Adding a new store

Implement the `Store` interface from `src/store/index.ts`, export a config interface, and add a `case` to `createStore()`.

## Development

```sh
npm run build        # compile TypeScript
npm run dev          # dev server with hot reload (tsx watch)
npm start            # production server via PM2
npm run start:node   # production server via node (no PM2)
npm test             # run tests
npm run test:watch   # watch mode
npm run lint         # oxlint
npm run fmt          # oxfmt
```
