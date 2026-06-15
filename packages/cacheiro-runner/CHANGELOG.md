# Changelog

## [1.0.0] - 2026-06-14

### Added

- Reference runner for `cacheiro` — loads config via the `config` npm package, validates with AJV, instantiates a store, and starts the server
- `FileSystemStore` as default backend; swap any other store package to change backend
- Two-layer config: JSON config files (`default.json`, `production.json`, `local.jsonc`) overridden by environment variables
- PM2 ecosystem config for production process management (`npm run start`)
- Dev mode with concurrent watch for runner and dependencies (`npm run dev`)
