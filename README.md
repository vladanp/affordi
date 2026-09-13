# Affordi

Affordi answers one focused question: **How long do I need to work to afford this?** Enter a price to translate its cost into working time, workdays, and a secondary share of take home pay.

Affordi has no account, backend, analytics, advertising, or tracking. Income settings stay in `localStorage` on the device and the installed app works offline.

## Stack

- React 19, TypeScript, and Vite
- Native CSS, split by responsibility
- Lucide React for the small icon set
- `vite-plugin-pwa` with a generated Workbox service worker
- Vitest and React Testing Library
- Playwright on Chromium, Firefox, and WebKit, with axe accessibility checks
- Oxlint and Oxfmt
- Lighthouse CI and semantic-release

Exact Node and pnpm versions are declared in `mise.toml`. Application dependencies are pinned exactly.

## Development

Install [mise](https://mise.jdx.dev/), then:

```sh
mise install
pnpm install --frozen-lockfile
pnpm dev
```

The install configures the committed Git hooks through `core.hooksPath` when the checkout contains `.git`.

### Commands

```sh
pnpm dev             # Development server
pnpm build           # Type check and production build
pnpm preview         # Preview the production build
pnpm test            # Unit and component tests
pnpm test:coverage   # Tests with coverage
pnpm test:e2e        # Chromium, Firefox, and WebKit
pnpm test:a11y       # Browser accessibility flows
pnpm test:pwa        # Chromium offline and service worker flow
pnpm lint            # Oxlint with type aware React checks
pnpm lint:fix        # Apply safe lint fixes
pnpm format          # Write Oxfmt formatting
pnpm format:check    # Verify formatting
pnpm typecheck       # Strict TypeScript
pnpm verify          # Main local quality gates
pnpm run ci          # All local CI gates, including browsers and Lighthouse
pnpm lighthouse      # Production Lighthouse assertions
```

With pnpm 12, bare `pnpm ci` is the package manager's frozen install alias. Use `pnpm run ci` for Affordi's quality script.

## Architecture

- Pure functions calculate hourly income, work duration, and localized presentation.
- One React state owner coordinates setup, calculator, and the native settings dialog.
- Versioned settings are validated from `unknown` at the storage boundary; malformed or older data recovers safely.
- English, German, French, Italian, and Serbian are built in without a runtime i18n dependency.
- Light, dark, and system appearance preferences use CSS custom properties.
- There is no router, state library, request library, schema library, or backend.

## Quality and automation

The precommit hook runs formatting, lint, TypeScript, and unit tests. The prepush hook runs the complete local CI command, including dependency audit, production checks, Playwright, accessibility, and Lighthouse.

Pull requests and pushes to `main` run the same gates in GitHub Actions. Required checks protect `main`, actions are pinned to immutable commits, and CodeQL scans the repository. Renovate proposes weekly dependency and action updates without automatic merging.

After all `main` checks pass, semantic-release creates the appropriate tag and GitHub Release from Conventional Commits. The final job then deploys the same commit to Cloudflare Pages.

## PWA

The generated Workbox service worker precaches the complete application shell. Settings and calculations remain available offline. Updates are installed through an in app prompt so an active calculation is never reloaded unexpectedly.

For a local installation check:

```sh
pnpm build
pnpm preview --host 0.0.0.0
```

Automated checks validate the manifest, icons, service worker, cache rules, offline reload, bundle budgets, and critical accessibility flows. Meaningful PWA changes should also be checked on a current iPhone or iPad because browser automation cannot fully reproduce the installed iOS lifecycle.

## Cloudflare Pages

Production: [affordi.pages.dev](https://affordi.pages.dev)

Affordi is a static application hosted on the Cloudflare Pages free plan. GitHub Actions owns deployment through the Direct Upload project named `affordi`, which prevents a hosting build from bypassing CI.

The deployment requires:

- Repository variable `CLOUDFLARE_PROJECT_NAME=affordi`
- Repository secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`
- A Cloudflare token limited to Pages Read and Edit for the selected account

Cloudflare provides HTTPS and Brotli compression. Hashed assets and the hashed Workbox runtime are cached for one year, while HTML, the manifest, and the service worker revalidate safely. A custom domain can be attached without adding a server.
