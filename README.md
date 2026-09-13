# Affordi

Affordi answers one focused question: **How long do I need to work to afford this?** Enter a price and it translates the amount into working time, workdays, and a secondary share of take-home pay.

Affordi has no account, backend, analytics, advertising, or tracking. Income settings stay in `localStorage` on the device and the installed app works offline.

## Technology

- React 19, TypeScript, and Vite
- Native CSS, split by responsibility
- `vite-plugin-pwa` with a generated Workbox service worker
- Vitest and React Testing Library
- Playwright on Chromium, Firefox, and WebKit, with axe accessibility checks
- Oxlint and Oxfmt
- Lighthouse CI and semantic-release

Exact Node and pnpm versions are declared in `mise.toml` and dependencies are exact-pinned.

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
pnpm build           # Type-check and production build
pnpm preview         # Preview the production build
pnpm test            # Unit and component tests
pnpm test:coverage   # Tests with coverage
pnpm test:e2e        # Chromium, Firefox, and WebKit
pnpm test:a11y       # Browser accessibility flows
pnpm test:pwa        # Chromium offline/service-worker flow
pnpm lint            # Oxlint with type-aware React checks
pnpm lint:fix        # Apply safe lint fixes
pnpm format          # Write Oxfmt formatting
pnpm format:check    # Verify formatting
pnpm typecheck       # Strict TypeScript
pnpm verify          # Main local quality gates
pnpm run ci          # Alias for the main local quality gates
pnpm lighthouse      # Production Lighthouse assertions
```

With pnpm 12, bare `pnpm ci` is the package manager's frozen-install alias. Use `pnpm run ci` for Affordi's quality script.

The pre-commit hook runs the fast formatting, lint, type, and unit gates. Pre-push adds the production checks and all Playwright projects. GitHub Actions remains authoritative.

## Product architecture

- Pure functions calculate hourly income, work duration, and localized presentation.
- One React state owner coordinates setup, calculator, and the native settings dialog.
- Versioned settings are validated from `unknown` at the storage boundary; malformed or older data recovers safely.
- English, German, French, Italian, and Serbian are built in without a runtime i18n dependency.
- Light, dark, and system appearance preferences use CSS custom properties.
- There is no router, state library, request library, schema library, or backend.

## PWA testing

Run a production server before manual installation checks:

```sh
pnpm build
pnpm preview --host 0.0.0.0
```

Automated checks validate the manifest, icons, service worker, offline reload, bundle budgets, and key accessibility flows. Before a release, also verify Add to Home Screen on current iPhone/iPad Safari, standalone safe areas and keyboard behavior, Android/desktop installation, persistence after relaunch, offline calculation, and the update prompt.

## CI and releases

Pull requests and pushes to `main` run frozen installation, formatting, lint, strict types, coverage, production build, bundle/PWA validation, dependency audit, all three Playwright engines, axe, and Lighthouse. Actions are pinned to immutable commits and Dependabot proposes dependency and action updates without auto-merging.

After all gates pass on `main`, semantic-release analyzes Conventional Commits and creates a semantic tag plus GitHub Release notes. The project is private in the npm sense and is never published to npm.

## Cloudflare Pages

Production: [affordi.pages.dev](https://affordi.pages.dev)

Affordi is a static app and fits Cloudflare Pages' free plan. Production deploys run from the final GitHub Actions job, after every quality gate passes. This also lets the build use the exact Node and pnpm versions in `mise.toml`; Cloudflare's native Pages build image does not read mise configuration.

After the finished repository is pushed to GitHub:

1. Create a Direct Upload Pages project named `affordi` with production branch `main`: `npx --yes wrangler@4.131.1 pages project create affordi --production-branch main --force`. Current Wrangler releases otherwise delegate new Pages projects to Workers; `--force` is only needed when creating the project.
2. Add the repository variable `CLOUDFLARE_PROJECT_NAME=affordi`.
3. Add `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN` repository secret. The token only needs permission to edit Pages deployments for the selected account.

The deploy job is safely skipped until the project variable exists and invokes an exact Wrangler version without adding the deployment CLI to the application. `public/_headers` supplies security and service-worker cache headers. Pages provides HTTPS and a `pages.dev` URL; a custom domain can be attached later without adding a server.

No GitHub repository or Cloudflare Pages project is created by local setup. Remote creation and deployment happen only after local quality gates pass, and must remain on free plans.
