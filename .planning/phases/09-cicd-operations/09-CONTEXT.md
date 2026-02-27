# Phase 9: CI/CD & Operations - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated quality gates prevent broken code from merging. GitHub Actions CI pipeline, health check endpoint, Dependabot, tool version pinning, branch protection rules. This does NOT add monitoring dashboards or complex alerting beyond what Sentry already provides.

</domain>

<decisions>
## Implementation Decisions

### GitHub Actions CI Pipeline
- Single workflow file: `.github/workflows/ci.yml`
- Triggers: push to main, pull requests to main
- Steps in order: checkout → setup bun → install deps → lint → typecheck → test → build
- Use `oven-sh/setup-bun` action for bun
- Run `bun audit` as a separate step (can warn, not fail)
- Cache bun dependencies with `actions/cache`
- Node.js version from `.nvmrc`

### Health Check Endpoint
- `/api/health` route returning `{ status: "ok", version: process.env.VERCEL_GIT_COMMIT_SHA || "dev", timestamp: new Date().toISOString() }`
- Simple GET endpoint, no auth required
- Useful for uptime monitoring and deployment verification

### Dependabot
- `.github/dependabot.yml` for weekly npm dependency updates
- Separate groups: production deps, dev deps
- Target branch: main
- Limit to 5 open PRs at a time

### Tool Version Pinning
- `.nvmrc` with Node.js version (22.x to match Next.js 16 requirements)
- `engines` field in `package.json` for node and bun versions
- `.bun-version` file if bun supports it

### Branch Protection & Monitoring
- Document recommended branch protection rules in CONTRIBUTING.md (require CI pass, require review)
- Sentry is already configured -- no additional alerting setup needed
- Bundle analysis: add `@next/bundle-analyzer` as dev dep, add `ANALYZE=true bun run build` script

### Claude's Discretion
- Exact GitHub Actions versions for steps
- Whether to add a separate security audit workflow or include in main CI
- Dependabot update schedule (weekly is default)
- Whether bundle analysis runs in CI or is manual-only

</decisions>

<specifics>
## Specific Ideas

- No CI pipeline exists currently (only AI code review GH actions)
- Package manager is bun, not npm -- CI must use bun
- Tests exist now (198 tests from Phase 7) and should run in CI
- Sentry is already configured for client, server, and edge -- just needs performance alerting config

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 09-cicd-operations*
*Context gathered: 2026-02-26*
