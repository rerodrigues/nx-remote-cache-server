# NX Remote Cache Server Monorepo rules for agents

## Versioning

- Use Atomic Commits for all commits to the monorepo.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages to automate versioning and changelog generation.
- Use [Lerna](https://lerna.js.org/) to manage versioning and publishing of packages in the monorepo. Lerna owns all version bumps and publish steps — do not introduce Semantic Release or any other release automation tool.
- Use [Semantic Versioning](https://semver.org/) for all packages in the monorepo.

## Commits

- Scope commit messages to the affected package(s) (e.g. `fix(cache-server): ...`).
- Never commit auto-generated files (dist, build output, lock file regeneration) alongside source changes — keep them in separate commits or exclude them.
- Breaking changes must include a `BREAKING CHANGE:` footer in the commit body.

## Packages

- Always update the README.md file in the root of the monorepo to reflect any changes to the packages or their usage.
- Each package must have its own README.md file with usage instructions, API documentation, and examples.

## Testing

- All packages must pass their test suite before changes are considered complete.
- New public APIs must include unit tests.
- All changes must be reflected in the tests to ensure coverage and prevent regressions. If no tests exist for the affected code, new tests must be added.

