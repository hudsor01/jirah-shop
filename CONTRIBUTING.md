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
