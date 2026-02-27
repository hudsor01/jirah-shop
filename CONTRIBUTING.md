# Contributing to jirah-shop

This guide is for internal team members working on the jirah-shop project.

## Development Setup

See [README.md](./README.md) for prerequisites, installation, environment variables, and database setup.

## Branching Strategy

- **`main`** -- production branch, always deployable
- Feature branches: `feature/description` or `fix/description`
- Branch from `main`, merge back via PR

## Pull Request Process

1. Create a feature branch from `main`
2. Make changes, ensure tests pass (`bun run test:run`)
3. Run lint and typecheck (`bun run lint && bun run build`)
4. Open PR with a description of what changed and why
5. CI must pass (lint, typecheck, test, build)
6. Request review from a team member
7. Squash merge to `main`

## Code Style

- **TypeScript strict mode** -- no `any` types without justification
- **Server actions** return `ActionResult<T>` -- see [docs/error-handling.md](./docs/error-handling.md)
- **Zod validation** on all server action inputs before any business logic
- **Data access** via `queries/` layer -- no inline Supabase queries in server actions
- **UI components** use shadcn/ui primitives
- **Styling** with TailwindCSS v4 (no CSS modules)
- **Package manager**: bun (never npm/yarn/pnpm)

## Testing Expectations

- **New server actions**: add unit tests in `tests/unit/`
- **New features**: add integration tests in `tests/integration/` where possible
- **Critical user paths**: maintain 30% minimum coverage (statements, branches, functions, lines)
- **E2E tests**: add Playwright tests in `tests/e2e/` for user-facing flows
- **Run tests**: `bun test` (watch), `bun run test:run` (once), `bun run test:coverage` (with coverage)
- **Run E2E**: `bun run test:e2e` or `bun run test:e2e:ui` (interactive)

See [README.md](./README.md) for the full development commands table.

## Commit Messages

Use conventional commits:

- `feat:` -- new feature
- `fix:` -- bug fix
- `docs:` -- documentation changes
- `test:` -- adding or updating tests
- `refactor:` -- code change that neither fixes a bug nor adds a feature
- `chore:` -- build process, dependencies, or tooling changes

## CI Pipeline

Every push to `main` and every pull request runs the CI pipeline (`.github/workflows/ci.yml`):

1. **Lint** -- ESLint with Next.js and TypeScript rules
2. **Typecheck** -- `tsc --noEmit` with strict mode
3. **Test** -- Vitest test suite (198+ tests)
4. **Build** -- Full Next.js production build

All four checks must pass before merging.

## Branch Protection (Recommended)

Configure these settings in GitHub repo Settings > Branches > Branch protection rules for `main`:

- [x] **Require a pull request before merging**
  - Require at least 1 approval
- [x] **Require status checks to pass before merging**
  - Required checks: `ci`
- [x] **Require branches to be up to date before merging**
- [x] **Do not allow bypassing the above settings**
- [ ] Require signed commits (optional)
- [x] **Block force pushes**

## Bundle Analysis

To analyze the production bundle:

```bash
bun run analyze
```

This opens an interactive treemap visualization in your browser showing the size of each module in the production build.

## Dependency Updates

Dependabot creates weekly PRs for dependency updates:
- **Production dependencies:** Grouped minor + patch updates
- **Dev dependencies:** Grouped minor + patch updates
- **GitHub Actions:** Separate update PRs

Review and merge Dependabot PRs after CI passes.

## Monitoring

Sentry is configured for error tracking and performance monitoring. The DSN is set via `NEXT_PUBLIC_SENTRY_DSN` environment variable. When the DSN is not set (local dev, CI), Sentry initialization is skipped gracefully.

**Performance alerting** should be configured in the [Sentry dashboard](https://sentry.io):
- Alert on P95 transaction duration > 2s
- Alert on error rate > 1% of transactions
- Alert on new unhandled exceptions
