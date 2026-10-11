# Cacheiro docs site

Source of the [Cacheiro](https://github.com/rerodrigues/nx-remote-cache-server) documentation site and blog, built with [VitePress](https://vitepress.dev) and published to <https://rerodrigues.github.io/nx-remote-cache-server/>.

This is the `site` branch of the `nx-remote-cache-server` repository. It holds only the site source and shares no history with `main`, so blog changes never touch the Cacheiro code.

## How it is built and deployed

The `Docs` workflow lives on `main` (`.github/workflows/docs.yml`). It checks out `main` at the workspace root and this branch into `docs/`, so the package pages can include each package's `README.md` verbatim, then builds the site and deploys it to GitHub Pages.

It runs when:

- a package `README.md` changes on `main`
- this branch is pushed (`.github/workflows/dispatch-docs.yml` dispatches it)
- a `Release` finishes
- it is started manually

## Working locally

From a clone of `main`:

```sh
git worktree add docs site
cd docs
npm ci
npm run dev       # local server with hot reload and search
npm run build     # production build, fails on dead links
npm run preview   # serve the production build
```

`docs/` is git-ignored on `main`, so commits made inside it go to this branch. Push the `site` branch to publish.
