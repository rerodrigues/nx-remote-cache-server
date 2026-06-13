# Changelog

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
