# Nebari Chat Pack Documentation

This directory contains the [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) site for the Nebari Chat Pack.

## Prerequisites

- Node.js `>= 22` (enforced by the `engines` field in `package.json`)
- npm (bundled with Node.js)

## Install

```bash
cd docs
npm install
```

## Local development

```bash
npm run dev
```

Starts the Astro dev server with hot reload on http://localhost:4321/.

## Production build

```bash
npm run build
```

Emits static files to `docs/dist/`.

## Preview the production build

```bash
npm run preview
```

Serves the contents of `docs/dist/` locally so you can verify the production output.

## Unit tests

```bash
npm test
```

Runs the Vitest suite (currently: the `remark-base-links` plugin tests).

## Type checking

```bash
npm run typecheck
```

## Link checking

```bash
bash ../scripts/check-links.sh
```

To test with the production base path: `BASE=/chat-pack/ bash ../scripts/check-links.sh`

## Content

Pages live in `src/content/docs/`. Each `.md` or `.mdx` file becomes a page. The sidebar is configured in `astro.config.mjs` under `starlight.sidebar`.

## Updating nebari design tokens

`src/styles/nebari-tokens.css` is copied from the [nebari-design](https://github.com/nebari-dev/nebari-design) repository (via the `nebari-dev/nebi-pack` reference implementation, until nebari-design publishes the file directly). To update it:

```bash
gh api "repos/nebari-dev/nebi-pack/contents/docs/src/styles/nebari-tokens.css?ref=main" \
  --jq '.content' | base64 -d > src/styles/nebari-tokens.css
```

## CI

The [`Docs` workflow](../.github/workflows/docs.yml) runs unit tests, builds the site, checks internal links, and deploys to [Cloudflare Pages](https://pages.cloudflare.com) on every push to `main` and every pull request that touches `docs/`. Pull requests get a preview URL posted as a comment; the [`Docs preview cleanup`](../.github/workflows/docs-preview-cleanup.yml) workflow removes it when the PR closes.
