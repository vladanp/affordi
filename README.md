# Affordi

Affordi answers one focused question: **How long do I need to work to afford this?** Enter a price to translate its cost into working time, days, and a secondary share of take home pay. Mark a price as paid every workday, weekly, monthly, or yearly to see what a habit or subscription costs over time. A one time price also says when you will have earned it, working from now through your schedule, such as "Earned by 9:46 AM tomorrow".

The Earnings page turns the same question around and counts what you earn as it happens. One total grows around the clock from midnight, as if a week of pay were spread over all 168 hours. A second total grows only during your work hours at your real hourly rate, and says when work starts, how much is left, or that today is a day off. A third total shows how much of this month's pay you have worked for: it moves only during work hours, counts the workdays done, and reaches the full month when the month's last workday ends. Below, a table breaks pay down per second, minute, hour, and day both ways, with the shared weekly, monthly, and yearly totals. Amounts can be hidden with one tap, and the page remembers that choice on the device.

The Fixed costs page keeps what you pay every month, such as rent, a mortgage, loans, or insurance. Each cost has a name, a monthly amount, and for loans an optional month of the last payment, after which it no longer counts. The page adds up the costs still paid this month and shows them in work time and as a share of take home pay, along with what is left each month and per workday, or the shortfall when fixed costs are more than pay. Each cost shows its own work time and share. The Earnings page then shows how much of this month's fixed costs the pay earned so far covers.

Settings describe work as a start time, an end time, and the work days of the week. Weekly hours and work days follow from them, so the calculator and the earnings page use one schedule.

Affordi has no account, backend, analytics, advertising, or tracking. Income settings and fixed costs stay in `localStorage` on the device, a reset erases both, and the installed app works offline.

## Stack

- React 19, TypeScript, and Vite
- Native CSS, split by responsibility, with `light-dark()` color tokens and container queries
- The platform system font, so no font file delays the first paint
- Lucide React for the small icon set
- `vite-plugin-pwa` with a generated Workbox service worker
- Vitest and React Testing Library
- Playwright on Chromium, Firefox, and WebKit, with axe accessibility checks
- Oxlint, Oxfmt, actionlint, React Doctor, and Fallow
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
pnpm run doctor        # React correctness, security, and architecture audit
pnpm run doctor:design # Focused React UI design audit
pnpm fallow:check      # Deterministic dead code CI gate
pnpm fallow:audit      # Structural review of changed code
pnpm lint:actions      # GitHub Actions validation
pnpm format          # Write Oxfmt formatting
pnpm format:check    # Verify formatting
pnpm typecheck       # Strict TypeScript
pnpm verify          # Main local quality gates
pnpm run ci          # All local CI gates, including browsers and Lighthouse
pnpm lighthouse      # Lighthouse assertions for perfect scores
```

With pnpm 12, bare `pnpm ci` is the package manager's frozen install alias. Use `pnpm run ci` for Affordi's quality script.

## Architecture

- Pure functions calculate hourly income, work duration, earning rates, today's progress through the workday, and localized presentation.
- One React state owner coordinates setup, the three pages, fixed costs, and the native settings dialog.
- The Cost, Earnings, and Fixed costs pages are linked by URL hash (`#cost`, `#earnings`, `#fixed-costs`), so each has its own address, title, and history entry without a router. Their tabs sit in the top bar, or in a full row under it on a phone, where the settings button shows only its icon. React `Activity` keeps a hidden page's state, such as a typed price, and stops its timers.
- Fixed costs are added and edited in a native dialog. Each one is validated at its own versioned storage boundary, and malformed or repeated entries are dropped one by one instead of losing the whole list.
- Live totals refresh ten times a second, or once a second with reduced motion or hidden amounts. They are never announced by screen readers on each change.
- Versioned settings are validated from `unknown` at the storage boundary; malformed or older data recovers safely. Saves from before work times get a Monday-first schedule from 9:00 built from their weekly hours, and new saves keep weekly hours beside the schedule so an installed version that has not updated yet still reads them.
- English, German, French, Italian, and Serbian are built in without a runtime i18n dependency.
- Light, dark, and system appearance preferences use CSS custom properties.
- Hourly pay is compared with a full working week, because a share of one hour of pay is not a useful reference.
- Screen readers hear the result once typing pauses, instead of after every keystroke.
- There is no router, state library, request library, schema library, or backend.

## Quality and automation

The precommit hook runs formatting, source and workflow linting, TypeScript, and unit tests. The prepush hook runs the main verification suite. `pnpm run ci` adds dependency audit, all three browser engines, accessibility, PWA flows, screenshot comparisons, and Lighthouse when a change that affects releases needs the complete local pipeline.

Pull requests and pushes to `main` run the same gates in GitHub Actions. A pull request title check lints the title as the squash commit title it becomes, with its `(#N)` suffix, and runs again whenever the title is edited. Required checks protect `main`, actions are pinned to immutable commits, actionlint validates workflow syntax, Fallow gates dead code and audits risk in changed code, and CodeQL scans the repository. Every browser run compares phone screenshots to reviewed baselines and uploads the Playwright report as audit evidence. Renovate proposes weekly dependency and action updates without automatic merging.

Advisories are published at any time, so the gates are split to keep them from failing unrelated work. Every run audits production dependencies, and a change to `package.json`, `pnpm-lock.yaml`, or `pnpm-workspace.yaml` must pass a full audit of all dependencies. A daily dependency audit workflow runs the full audit on `main` and fails when a new advisory appears, and weekly Renovate lockfile maintenance pulls in patched transitive versions once they pass the seven day release age. Packages that pin a vulnerable version exactly are raised with a scoped override in `pnpm-workspace.yaml`.

Lighthouse must score 100 for performance, accessibility, best practices, SEO, and agentic browsing across three runs. The built app also validates its `llms.txt` agent summary before deployment.

After all `main` checks pass, semantic-release creates the appropriate tag and GitHub Release from Conventional Commits. The final job downloads the exact artifact produced by validation, deploys it to the protected Cloudflare Pages environment, and verifies every published file plus critical security headers. A daily production smoke workflow detects later drift or availability failures.

## PWA

The generated Workbox service worker precaches the complete application shell and registers once the page has loaded. Settings and calculations remain available offline. While the app is open and online it checks for a new version every hour, and updates are installed through an in app prompt so an active calculation is never reloaded unexpectedly.

For a local installation check:

```sh
pnpm build
pnpm preview --host 0.0.0.0
```

The iOS home screen icon is bundled with a content hash. iOS keeps an icon by its URL, so a new hash makes the next installation fetch the new artwork instead of reusing a cached one. An icon that is already on the home screen does not change; remove it and add Affordi again to see new artwork.

Every form field uses text of at least 16px, because iOS zooms into a focused field with smaller text. A browser test keeps this true.

Automated checks validate the manifest, icons, service worker, cache rules, offline reload, bundle budgets, and critical accessibility flows. Meaningful PWA changes should also be checked on a current iPhone or iPad because browser automation cannot fully reproduce the installed iOS lifecycle.

## Cloudflare Pages

Production: [affordi.pages.dev](https://affordi.pages.dev)

Affordi is a static application hosted on the Cloudflare Pages free plan. GitHub Actions owns deployment through the Direct Upload project named `affordi`, which prevents a hosting build from bypassing CI.

The deployment requires:

- Repository variable `CLOUDFLARE_PROJECT_NAME=affordi`
- Repository secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`
- A Cloudflare token limited to Pages Read and Edit for the selected account

Cloudflare provides HTTPS and Brotli compression. Hashed assets and the hashed Workbox runtime are cached for one year, while HTML, the manifest, and the service worker revalidate safely. A custom domain can be attached without adding a server.
