# Phase 9: CI/CD & Operations - Research

**Researched:** 2026-02-27
**Status:** Complete

## Current State Analysis

### Existing GitHub Actions
Two workflows exist:
- `.github/workflows/claude.yml` — Claude Code bot (issue/PR interaction)
- `.github/workflows/claude-code-review.yml` — Claude Code Review on PRs

Neither runs lint, typecheck, test, or build. No CI quality gates exist.

### Build Tooling
- **Package manager:** bun 1.3.9
- **Node.js:** v24.13.1 (local, no `.nvmrc` pinning)
- **No `.bun-version` file** exists
- **No `engines` field** in package.json
- **Scripts available:** `lint`, `build`, `test:run`, `test:coverage`, `test:e2e`
- **ESLint:** Flat config (`eslint.config.mjs`) with next/core-web-vitals + typescript
- **TypeScript:** Target ES2017, strict mode, incremental compilation
- **Vitest:** 4.0.18 with v8 coverage (30% thresholds), jsdom environment
- **Playwright:** 1.58.2 for E2E tests

### Sentry Configuration
- Three config files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- All use `process.env.NEXT_PUBLIC_SENTRY_DSN` directly (OPS-06 — no graceful handling of missing DSN)
- Client: 10% traces, 10% replay sessions, 100% replay on error
- Server/Edge: 10% traces in production
- `next.config.ts` wraps with `withSentryConfig` including source maps

### API Routes
- Only `app/api/webhooks/` exists
- No health check endpoint

### Dependencies (relevant to CI)
- No `@next/bundle-analyzer` installed
- No Dependabot config exists (`.github/dependabot.yml` missing)

## Technical Decisions

### GitHub Actions CI Pipeline (OPS-01)
- **Runner:** `ubuntu-latest`
- **Bun setup:** Use `oven-sh/setup-bun@v2` with version from `.bun-version`
- **Node setup:** Use `actions/setup-node@v4` with `node-version-file: '.nvmrc'`
- **Dependency caching:** Bun has built-in caching via `oven-sh/setup-bun` `cache: true`
- **Steps:** checkout -> setup-node -> setup-bun -> install -> lint -> typecheck -> test -> build
- **Typecheck command:** `bun run tsc --noEmit` (TypeScript strict mode, catch type errors)
- **Test command:** `bun run test:run` (vitest run, non-watch mode)
- **Build command:** `bun run build` (next build)
- **Triggers:** push to main, pull_request to main
- **Concurrency:** Cancel in-progress runs on same PR to save resources

### Health Check Endpoint (OPS-02)
- Route: `app/api/health/route.ts`
- Response: `{ status: "ok", version: process.env.VERCEL_GIT_COMMIT_SHA || "dev", timestamp: ISO string }`
- GET only, no auth, suitable for uptime monitoring

### Dependabot Configuration (OPS-03)
- `.github/dependabot.yml`
- Ecosystem: npm (works with bun's package.json/lockfile)
- Schedule: weekly
- Groups: production deps, dev deps
- Open PR limit: 5
- `bun audit` added as CI step (non-blocking, warn-only since bun audit may have limited coverage)

### Tool Version Pinning (OPS-04)
- `.nvmrc`: `22` (Node 22.x LTS — stable for Next.js 16, even though local runs 24.x)
- `.bun-version`: `1.3.9` (matches current local)
- `package.json` `engines`: `{ "node": ">=22.0.0", "bun": ">=1.3.0" }`
- Note: Node 22 is the current LTS as of 2025-2026; Node 24 is current but not LTS

### Sentry Performance & DSN Handling (OPS-05, OPS-06)
- OPS-05: Sentry already has `tracesSampleRate` configured. Performance alerting is a Sentry dashboard config, not a code change. Document recommended alert rules.
- OPS-06: Add DSN guard — only call `Sentry.init()` when DSN is present. This prevents noisy errors in local/CI environments without Sentry.

### Bundle Analysis (OPS-07)
- Install `@next/bundle-analyzer` as devDependency
- Add `ANALYZE=true` support in `next.config.ts`
- Add `analyze` script to package.json: `ANALYZE=true bun run build`
- Keep as manual-only (not in CI by default — it opens a browser)

### Branch Protection (OPS-08)
- Document recommended settings in a new `CONTRIBUTING.md` section
- Cannot auto-configure via code — requires GitHub repo admin settings
- Recommend: require CI pass, require 1 review, no force push to main

## File Impact Analysis

| File | Action | Requirement |
|------|--------|-------------|
| `.github/workflows/ci.yml` | Create | OPS-01, OPS-03 |
| `app/api/health/route.ts` | Create | OPS-02 |
| `.github/dependabot.yml` | Create | OPS-03 |
| `.nvmrc` | Create | OPS-04 |
| `.bun-version` | Create | OPS-04 |
| `package.json` | Modify (engines, analyze script) | OPS-04, OPS-07 |
| `sentry.client.config.ts` | Modify (DSN guard) | OPS-06 |
| `sentry.server.config.ts` | Modify (DSN guard) | OPS-06 |
| `sentry.edge.config.ts` | Modify (DSN guard) | OPS-06 |
| `next.config.ts` | Modify (bundle analyzer) | OPS-07 |
| `CONTRIBUTING.md` | Create or modify | OPS-08 |

## Risk Assessment

### Low Risk
- Health check endpoint (isolated, no dependencies)
- Version pinning files (additive, no code changes)
- Dependabot config (additive)
- Bundle analyzer (devDep, optional feature)

### Medium Risk
- CI pipeline: must validate that `bun run build` succeeds in CI (Sentry source map upload needs env vars or must be gracefully skipped)
- Sentry DSN guard: changing init pattern across 3 files — must not break existing monitoring

### Mitigation
- CI workflow should set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` as secrets (or skip source map upload in CI with `silent: !process.env.CI` — already set)
- The `next.config.ts` already has `silent: !process.env.CI` which suppresses Sentry errors in CI

## RESEARCH COMPLETE

---

*Phase: 09-cicd-operations*
*Research completed: 2026-02-27*
