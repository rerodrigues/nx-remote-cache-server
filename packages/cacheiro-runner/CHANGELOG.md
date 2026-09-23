# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.4.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.3.1...@renatorodrigues/cacheiro-runner@1.4.0) (2026-09-23)

### Features

- **cacheiro:** make auth config optional ([af818e1](https://github.com/rerodrigues/nx-remote-cache-server/commit/af818e14f86bcfa881eb51823b04441fcdf98294))

## [1.3.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.3.0...@renatorodrigues/cacheiro-runner@1.3.1) (2026-09-23)

**Note:** Version bump only for package @renatorodrigues/cacheiro-runner

## [1.3.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.2.4...@renatorodrigues/cacheiro-runner@1.3.0) (2026-09-17)

### Features

- **cacheiro-runner:** wire auth.readOnlyToken config ([d7f3dd3](https://github.com/rerodrigues/nx-remote-cache-server/commit/d7f3dd385c1763cf5d1916d084e2a13f27d5b163))

## [1.2.4](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.2.3...@renatorodrigues/cacheiro-runner@1.2.4) (2026-09-14)

**Note:** Version bump only for package @renatorodrigues/cacheiro-runner

## [1.2.3](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.2.2...@renatorodrigues/cacheiro-runner@1.2.3) (2026-09-09)

**Note:** Version bump only for package @renatorodrigues/cacheiro-runner

## [1.2.2](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.2.1...@renatorodrigues/cacheiro-runner@1.2.2) (2026-09-03)

**Note:** Version bump only for package @renatorodrigues/cacheiro-runner

## [1.2.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.2.0...@renatorodrigues/cacheiro-runner@1.2.1) (2026-09-03)

**Note:** Version bump only for package @renatorodrigues/cacheiro-runner

## [1.2.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.1.2...@renatorodrigues/cacheiro-runner@1.2.0) (2026-06-22)

### Features

- **cacheiro:** add TLS support

## [1.1.2](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.1.1...@renatorodrigues/cacheiro-runner@1.1.2) (2026-06-19)

**Note:** Version bump only for package @renatorodrigues/cacheiro-runner

## [1.1.1](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.1.0...@renatorodrigues/cacheiro-runner@1.1.1) (2026-06-18)

**Note:** Version bump only for package @renatorodrigues/cacheiro-runner

# [1.1.0](https://github.com/rerodrigues/nx-remote-cache-server/compare/@renatorodrigues/cacheiro-runner@1.0.0...@renatorodrigues/cacheiro-runner@1.1.0) (2026-06-16)

### Bug Fixes

- **cacheiro-runner:** rename config example to .jsonc, update refs ([e9a1be4](https://github.com/rerodrigues/nx-remote-cache-server/commit/e9a1be40cd1e53a38f369cf29575501373abb76e))

### Features

- **cacheiro-store-azure:** implement Azure Blob Storage store ([b24d213](https://github.com/rerodrigues/nx-remote-cache-server/commit/b24d213eab810a026bb06dca67b1294be387c79a))

## [1.0.0] - 2026-06-14

### Added

- Reference runner for `cacheiro` — loads config via the `config` npm package, validates with AJV, instantiates a store, and starts the server
- `FileSystemStore` as default backend; swap any other store package to change backend
- Two-layer config: JSON config files (`default.json`, `production.json`, `local.jsonc`) overridden by environment variables
- PM2 ecosystem config for production process management (`npm run start`)
- Dev mode with concurrent watch for runner and dependencies (`npm run dev`)
