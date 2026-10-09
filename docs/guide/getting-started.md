# Getting started

Pick how you want to run Cacheiro, then point Nx or Lerna at it.

## 1. Run the server

### Docker (recommended)

Each store flavor has its own image on GHCR: `cacheiro-instants-fs`, `-s3`, `-gcs`, and `-azure`.

```sh
docker run -p 3000:3000 \
  -e CACHEIRO_AUTH_TOKEN=my-secret-token \
  -v $(pwd)/cache:/cache \
  ghcr.io/rerodrigues/cacheiro-instants-fs
```

Check that it is up:

```sh
curl -i http://localhost:3000/health
```

`/health` needs no auth and returns `200 OK`.

For S3, GCS, and Azure examples, TLS, and the full list of environment variables, see [Instants](/packages/instants). Cloud store options are documented on each store page: [S3](/packages/store-s3), [GCS](/packages/store-gcs), [Azure](/packages/store-azure).

### From source

Clone the repository and start the reference runner with hot reload:

```sh
npm install
cd packages/cacheiro-runner
cp config/local.jsonc.example config/local.jsonc
npm run dev
```

See [Runner](/packages/runner) for configuration files, environment variables, PM2, and Docker builds.

### As a library

Import the core package and wire in your own store, config loader, and hooks. See [Core](/packages/core).

## 2. Point Nx or Lerna at it

Set two environment variables where your tasks run (your machine, CI, or both):

```sh
export NX_SELF_HOSTED_REMOTE_CACHE_SERVER="https://mycache.server"
export NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN="your-secure-token-here"  # optional

lerna run build
# or
nx run-many -t build
```

The access token is only needed when the server has `auth.token` set. Use a [read-only token](/guide/security) for untrusted CI such as pull request builds.

## Next steps

- [Architecture](/guide/architecture): how the packages fit together.
- [Security](/guide/security): tokens, read-only access, and HTTPS.
- [Packages](/packages/core): reference documentation for every package.
