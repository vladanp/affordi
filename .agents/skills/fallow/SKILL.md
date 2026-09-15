---
name: fallow
description: Use the repository's pinned Fallow CLI to audit changed TypeScript, JavaScript, and CSS; trace suspected dead code; or review structural risk before commits and pull requests.
license: MIT
---

# Fallow

Use the version pinned in `devDependencies`; never substitute `npx ...@latest`.

## Workflow

- Before a commit or pull request, run `pnpm fallow:audit`. Treat duplication, complexity, and styling output as review evidence, not an instruction to refactor sound code.
- Run `pnpm fallow:check` to reproduce the CI dead-code gate.
- Before deleting a reported export or file, trace it with `pnpm exec fallow dead-code --trace <file>:<export>`. Trace dependencies with `--trace-dependency <name>`.
- For machine-readable analysis, add `--format json --quiet`; preserve exit status and keep stderr separate.
- Before an automated fix, run `pnpm exec fallow fix --dry-run --format json --quiet`, inspect the exact changes, then use `fix --yes` only when they are in scope.

Do not enable telemetry, paid runtime coverage, remote config inheritance, an MCP server, or persistent hooks on the user's behalf. Never run `fallow watch`. Do not optimize for Fallow's broad health score when the reported structure is intentional and verified.
