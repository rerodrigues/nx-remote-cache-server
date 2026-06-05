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

### Start

```sh
npm start
```

The server listens on `localhost:3000` by default.

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

| Key               | Default     | Description                                                       |
| ----------------- | ----------- | ----------------------------------------------------------------- |
| `server.port`     | `3000`      | HTTP port to listen on                                            |
| `server.host`     | `0.0.0.0`   | Host to bind to                                                   |
| `auth.token`      | `""`        | Bearer token required on all requests. Auth is disabled if empty. |
| `store.type`      | `"local"`   | Storage backend. See [Stores](#stores) below.                     |
| `store.local.dir` | `"./cache"` | _(local store only)_ Directory where artifacts are stored.        |

### Environment variable overrides

All config values can still be overridden via environment variables (useful in CI/Docker):

| Variable      | Config key        |
| ------------- | ----------------- |
| `PORT`        | `server.port`     |
| `HOST`        | `server.host`     |
| `AUTH_TOKEN`  | `auth.token`      |
| `CACHE_STORE` | `store.type`      |
| `CACHE_DIR`   | `store.local.dir` |

## API

Defined by [`swagger.json`](./swagger.json) (OpenAPI 3.0).

| Method | Path              | Description              |
| ------ | ----------------- | ------------------------ |
| `PUT`  | `/v1/cache/:hash` | Upload a task artifact   |
| `GET`  | `/v1/cache/:hash` | Download a task artifact |

All endpoints require an `Authorization: Bearer <token>` header when `auth.token` is set.

## Stores

The storage backend is selected via `store.type`.

### `local` (default)

Stores artifacts on the local filesystem under `store.local.dir`.

### Adding a new store

Implement the `Store` interface from `src/store/index.ts` and add a `case` to `createStore()`.

## Development

```sh
npm run build        # compile TypeScript
npm test             # run tests
npm run test:watch   # watch mode
npm run lint         # oxlint
npm run fmt          # oxfmt
```
