# NX Remote Cache Server Monorepo rules for agents

## Versioning

- Use Atomic Commits for all commits to the monorepo.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages to automate versioning and changelog generation.
- Use [Lerna](https://lerna.js.org/) to manage versioning and publishing of packages in the monorepo. Lerna owns all version bumps and publish steps — do not introduce Semantic Release or any other release automation tool.
- Use [Semantic Versioning](https://semver.org/) for all packages in the monorepo.

## Commits

### Before You Commit

1. Separate auto-generated files (dist, build output, lock file regeneration) into their own commit or exclude them.
2. Bundle README/doc updates with the related code change in the same commit. A `docs:` commit is only for standalone documentation fixes (typos, wording) with no related code change.
3. Add `BREAKING CHANGE:` footer in the commit body if applicable.
4. Scope the message to the affected package(s) (e.g. `fix(cacheiro): ...`).

## Packages

- `packages/cacheiro/swagger.json` is the verbatim Nx remote cache OpenAPI spec and must never be modified. It defines the NX-mandated contract. Extra routes must be registered directly on the Fastify instance in `server.ts`, not added to the spec. Extra routes registered in `server.ts` must still be documented in the package README and covered by unit or integration tests, even though they are absent from `swagger.json`.
- Always update the README files, including the one in the root of the monorepo to reflect any changes to the packages or their usage.
- Each package must have its own README.md file with usage instructions, API documentation, and examples.

## Testing

- All packages must pass their test suite before changes are considered complete.
- Any function, class, or type that is exported from a package's main entry point (i.e., listed in the package's `exports` or `index.ts`) must include unit tests.
- All changes must be reflected in the tests to ensure coverage and prevent regressions. If no tests exist for the affected code, new tests must be added.
