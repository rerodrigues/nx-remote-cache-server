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

The server listens on `0.0.0.0:3000` by default.

## Configuration

All configuration is via environment variables.

| Variable     | Default   | Description                                                       |
| ------------ | --------- | ----------------------------------------------------------------- |
| `PORT`       | `3000`    | HTTP port to listen on                                            |
| `HOST`       | `0.0.0.0` | Host to bind to                                                   |
| `AUTH_TOKEN` | —         | Bearer token required on all requests. Auth is disabled if unset. |
| `CACHE_STORE`| `local`   | Storage backend. See [Stores](#stores) below.                     |
| `CACHE_DIR`  | `./cache` | *(local store only)* Directory where artifacts are stored.        |

## API

Defined by [`swagger.json`](./swagger.json) (OpenAPI 3.0).

| Method | Path                | Description              |
| ------ | ------------------- | ------------------------ |
| `PUT`  | `/v1/cache/:hash`   | Upload a task artifact   |
| `GET`  | `/v1/cache/:hash`   | Download a task artifact |

All endpoints require a `Authorization: Bearer <token>` header when `AUTH_TOKEN` is set.

## Stores

The storage backend is selected via the `CACHE_STORE` environment variable.

### `local` (default)

Stores artifacts on the local filesystem under `CACHE_DIR`.

```sh
CACHE_STORE=local CACHE_DIR=/var/cache/nx npm start
```

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
