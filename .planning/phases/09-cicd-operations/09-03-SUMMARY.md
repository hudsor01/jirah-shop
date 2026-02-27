---
phase: 09-cicd-operations
plan: 03
status: complete
started: 2026-02-27
completed: 2026-02-27
---

# Plan 09-03: Sentry DSN Guards, Bundle Analysis, Branch Protection Docs

## Result
Complete -- Sentry configs guard against missing DSN, bundle analyzer available, CONTRIBUTING.md updated.

## What Was Built
- All three Sentry config files (client, server, edge) now guard `Sentry.init()` behind DSN check
- `@next/bundle-analyzer` installed and integrated into `next.config.ts`
- `analyze` script added to `package.json`
- CONTRIBUTING.md updated with CI Pipeline, Branch Protection, Bundle Analysis, Dependency Updates, and Monitoring sections

## Key Files
### Created
- None (all modifications to existing files)

### Modified
- `sentry.client.config.ts` (DSN guard)
- `sentry.server.config.ts` (DSN guard)
- `sentry.edge.config.ts` (DSN guard)
- `next.config.ts` (bundle analyzer integration)
- `package.json` (analyze script, @next/bundle-analyzer devDep)
- `CONTRIBUTING.md` (new CI/ops sections)

## Decisions Made
- DSN guard uses simple `if (dsn)` pattern -- minimal, no fallback behavior needed
- Bundle analyzer wraps base config, then Sentry wraps the result (compose order matters)
- Branch protection documented as recommended settings (requires repo admin to configure)
- Sentry performance alerting documented as dashboard config (not code change)

## Self-Check: PASSED
- [x] All Sentry configs have DSN guard
- [x] Bundle analyzer installed and integrated
- [x] Analyze script works
- [x] CONTRIBUTING.md has all required new sections
- [x] All 198 tests still pass
