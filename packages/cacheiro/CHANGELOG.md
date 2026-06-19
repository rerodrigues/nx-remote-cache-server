# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
