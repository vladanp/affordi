---
name: react-doctor
description: Use when finishing a feature, fixing a bug, before committing React code, or when the user types `/doctor`, asks to scan, triage, or clean up React diagnostics. Covers lint, accessibility, bundle size, architecture, and local regression triage.
---

# React Doctor

Scans React codebases for security, performance, correctness, and architecture issues. Outputs a 0–100 health score.

## After making React code changes

Run `pnpm exec react-doctor --verbose --scope changed` and check the score did not regress. If it dropped, fix the regressions before committing.

## General cleanup or code improvement

Run `pnpm exec react-doctor --verbose --scope full`. Fix issues by severity: errors first, then warnings.

## Focused UI design audit

Run `pnpm exec react-doctor design --verbose --scope full`. This selects design-tagged UI composition, typography, interaction, accessibility, and motion rules.

## Runtime performance problems

Run `pnpm exec react-doctor scan <url> --format json` in an interactive terminal. React Doctor opens an isolated Chrome profile and records a trace while the user reproduces the slow interaction. Read the structured summary first, then inspect the local `.json.gz` trace for CPU, browser, and React component evidence.

If the user needs authenticated browser state, use `--cdp <remote-debugging-url>`. Chrome must already be running with remote debugging. Never ask for cookies or copy the user's browser profile. Treat traces as sensitive local application data and never upload them without explicit permission.

## `/doctor` full local triage

When the user requests a full React Doctor triage:

1. Run the full general and design scans with the pinned project dependency.
2. Inspect every diagnostic in source context. Classify it as a defect, justified exception, or false positive.
3. Fix high-confidence defects in scope. Do not suppress a rule or reshape sound code merely to raise the score.
4. Run targeted tests, then the changed scan. Before handoff, rerun both full scans.
5. Report remaining diagnostics and the evidence for any exception.

## Configuring or explaining rules

When the user wants to understand or configure a rule, read [references/explain.md](references/explain.md). Start with `pnpm exec react-doctor rules explain <rule>`, then apply the narrowest control via `pnpm exec react-doctor rules disable|set|category|ignore-tag …`.

## Command

```bash
pnpm exec react-doctor --verbose --scope changed
```

| Flag              | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `.`               | Scan current directory                                           |
| `--verbose`       | Show affected files and line numbers per rule                    |
| `--scope changed` | Only report issues introduced vs the base branch (default: full) |
| `--scope lines`   | Only report issues on the changed lines                          |
| `--score`         | Output only the numeric score                                    |
| `design`          | Run only the focused UI design diagnostics                       |
