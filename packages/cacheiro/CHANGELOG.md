# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.4.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.3.1...@renatorodrigues/cacheiro@1.4.0) (2026-09-23)

### Features

- **cacheiro:** make auth config optional ([af818e1](https://github.com/rerodrigues/nx-remote-cache-server/commit/af818e14f86bcfa881eb51823b04441fcdf98294))

## [1.3.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.3.0...@renatorodrigues/cacheiro@1.3.1) (2026-09-23)

### Bug Fixes

- **cacheiro,cacheiro-store-\*:** build workspace deps in prepublishOnly ([3be97eb](https://github.com/rerodrigues/nx-remote-cache-server/commit/3be97ebe4ac73ac2199ad4c39b22beb81b124393))

## [1.3.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.2.0...@renatorodrigues/cacheiro@1.3.0) (2026-09-17)

### Features

- **cacheiro:** add read-only auth token ([5454561](https://github.com/rerodrigues/nx-remote-cache-server/commit/5454561dfb6a576022a13f8252b2d685f78a9457))
- **cacheiro:** surface readOnlyToken in startup banner ([fb058f5](https://github.com/rerodrigues/nx-remote-cache-server/commit/fb058f5f0d2c2607db9bd3df5f1eed94b7701ba6))

### Bug Fixes

- **cacheiro:** reject empty readOnlyToken in schema too ([87afdef](https://github.com/rerodrigues/nx-remote-cache-server/commit/87afdef55ebba8eca43f296f6bb96dae1b27b4f7))

## [1.2.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.1.3...@renatorodrigues/cacheiro@1.2.0) (2026-09-14)

### Features

- **cacheiro:** add lifecycle hooks ([bf0969e](https://github.com/rerodrigues/nx-remote-cache-server/commit/bf0969e0ed323a6ee435cee611f5605defe94ada))

## [1.1.3](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.1.2...@renatorodrigues/cacheiro@1.1.3) (2026-09-09)

### Bug Fixes

- run build before publish via prepublishOnly hook ([c90c32e](https://github.com/rerodrigues/nx-remote-cache-server/commit/c90c32ed09244b77faa6e2420bc355f99acd2f23))

## [1.1.2](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.1.1...@renatorodrigues/cacheiro@1.1.2) (2026-09-03)

### Bug Fixes

- **cacheiro:** use LogController for request logging ([ad82359](https://github.com/rerodrigues/nx-remote-cache-server/commit/ad823590ab7473a3f2d0088abe7c5553908afdd9))

## [1.1.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.1.0...@renatorodrigues/cacheiro@1.1.1) (2026-09-03)

**Note:** Version bump only for package @renatorodrigues/cacheiro

## [1.1.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.0.2...@renatorodrigues/cacheiro@1.1.0) (2026-06-22)

### Features

- **cacheiro:** add GET /health endpoint
- **cacheiro:** add TLS support

## [1.0.2](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.0.1...@renatorodrigues/cacheiro@1.0.2) (2026-06-19)

**Note:** Version bump only for package @renatorodrigues/cacheiro

## [1.0.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro@1.0.0...@renatorodrigues/cacheiro@1.0.1) (2026-06-16)

### Bug Fixes

- **cacheiro:** ensure error is Error type before logging ([094b01f](https://github.com/rerodrigues/nx-remote-cache-server/commit/094b01fbbd7df1dd3b81b25b5b01522f731ee49f))

## [1.0.0] - 2026-06-14

### Added

- `Cacheiro` class — core NX remote cache server implementing the [NX 20.8+ custom remote cache](https://nx.dev/recipes/running-tasks/self-hosted-caching) specification
- `cacheiro.start()` — builds and returns the Fastify instance before binding, allowing custom routes and hooks
- `cacheiro.listen()` — binds to configured host/port and prints startup banner
- `cacheiro.stop()` — graceful shutdown with connection draining
- `configSchema` — JSON Schema for config validation at runtime
- OpenAPI/Swagger spec bundled as `swagger.json`
- Bearer token authentication
- Request body size limit (configurable)
