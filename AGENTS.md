# Cacheiro docs site rules for agents

This is the `site` branch of the `nx-remote-cache-server` repository: the VitePress docs site and blog. It is checked out at `docs/` of the main repo through a git worktree and deployed by `.github/workflows/docs.yml` on `main`. See `README.md` for how it works. The Cacheiro monorepo rules live in the `AGENTS.md` on `main`.

## Versioning

- Use atomic commits and [Conventional Commits](https://www.conventionalcommits.org/). Scope the message to the area (e.g. `feat(docs): ...`, `docs(blog): ...`).
- Only humans push. Commit locally and let the user push the `site` branch.

## Content

- Package pages under `packages/` include the package `README.md` verbatim from the checked-out `main` (`<!--@include: ../../packages/<pkg>/README.md-->`). Never copy README content into them. Edit the README on `main` instead.
- The hand-written pages (`index.md` and `guide/*`) repeat facts from the packages: env var names, Docker image names, auth and token behavior, the package list, and public API (methods, events, hooks, config options) together with the behavior and limitations the guide pages describe for them. When `main` changes any of these, update those pages here.
- Before concluding that a change on `main` needs no site update, grep `guide/` and `index.md` for the changed names and for the old behavior. A package page including the README does not cover the guide pages. When a change removes a limitation, also grep for wording such as "only", "no way", "unlike" and "not supported" near the feature.
- Blog posts under `blog/` are dated announcements: never update them for later changes.
- When a package is added or removed on `main`, update `.vitepress/config.mts` (sidebar), add or remove its page under `packages/`, and update `guide/architecture.md`.
- Do not hard-code versions or tags in the pages. Link to the changelog or the registry instead.
- Remove or rewrite stale content instead of leaving it in place.
- Keep package page URLs stable. Package READMEs link to them.

## Verification

- `npm run build` must pass before changes are considered complete. It fails on dead links. It needs `main` checked out around this branch (`git worktree add docs site` from a clone of `main`), otherwise the README includes cannot resolve.
