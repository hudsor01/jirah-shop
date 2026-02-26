# Technology Stack

**Analysis Date:** 2026-02-26

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase, React components, server actions, and API routes
- JSX/TSX - React component syntax throughout

**Secondary:**
- CSS - Tailwind CSS v4.2.0 with PostCSS
- SQL - Database schema and migrations in `/supabase/migrations/`

## Runtime

**Environment:**
- Node.js 24.13.1 (no .nvmrc pinned, determined by user environment)
- Next.js 16.1.6 - React framework with App Router

**Package Manager:**
- Bun 1.3.9
- Lockfile: `bun.lock` (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with server components/actions
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering

**Styling:**
- Tailwind CSS 4.2.0 - Utility-first CSS via PostCSS
- @tailwindcss/postcss 4.2.0 - PostCSS plugin
- class-variance-authority 0.7.1 - Component variant system
- tailwind-merge 3.5.0 - Tailwind class merging utility
- next-themes 0.4.6 - Theme provider for light/dark modes

**UI Components:**
- shadcn/ui - Component library (via `shadcn` CLI 3.8.5)
- radix-ui 1.4.3 - Headless UI primitives (dialog, dropdown, etc.)
- lucide-react 0.575.0 - Icon library
- @tabler/icons-react 3.37.1 - Additional icon set

**Forms & Validation:**
- react-hook-form 7.71.2 - Form state and submission
- @hookform/resolvers 5.2.2 - Validation resolvers for hook-form
- zod 4.3.6 - TypeScript-first schema validation

**Data & Tables:**
- @tanstack/react-table 8.21.3 - Headless table component library
- recharts 3.7.0 - Chart/visualization library

**Drag & Drop:**
- @dnd-kit/core 6.3.1 - Drag-and-drop primitives
- @dnd-kit/sortable 10.0.0 - Sortable extension
- @dnd-kit/modifiers 9.0.0 - Drag modifiers
- @dnd-kit/utilities 3.2.2 - Helper utilities

**Notifications & Modals:**
- sonner 2.0.7 - Toast notification library
- vaul 1.1.2 - Drawer/modal component (used via shadcn/ui)
- cmdk 1.1.1 - Command palette component

**File Upload:**
- react-dropzone 15.0.0 - File dropzone UI primitives

## Key Dependencies

**Critical:**
- @supabase/ssr 0.8.0 - Supabase Auth with SSR/cookie handling (client and server components)
- @supabase/supabase-js 2.97.0 - Supabase JavaScript client SDK
- stripe 20.3.1 - Stripe server-side SDK for webhook processing
- @stripe/stripe-js 8.8.0 - Stripe client-side library for payments
- @sentry/nextjs 10.39.0 - Error tracking and monitoring integration

**Infrastructure:**
- next 16.1.6 - Server/client framework
- react-dropzone 15.0.0 - File upload handler
- eslint 9.0.0 - Code linting (dev)
- typescript 5.9.3 - Type checking (dev)

## Configuration

**Environment:**
- `.env.local` required at runtime (contains secrets - never committed)
- Environment variables validated at module load in `lib/env.ts`:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase public key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (server-only)
  - `STRIPE_SECRET_KEY` - Stripe secret key (server-only)
  - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature secret
  - `NEXT_PUBLIC_SITE_URL` - Application URL for redirects
  - `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN (optional)
  - `SENTRY_ORG` - Sentry organization (CI/deployment)
  - `SENTRY_PROJECT` - Sentry project (CI/deployment)

**Build:**
- `next.config.ts` - Next.js configuration with:
  - Standalone output mode
  - Image optimization (AVIF, WebP formats)
  - Remote image patterns for Supabase, Unsplash, shadcn-studio
  - Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - Sentry integration via `withSentryConfig` wrapper
- `tsconfig.json` - TypeScript config with path alias `@/*`
- `postcss.config.mjs` - PostCSS config for Tailwind v4
- `vitest.config.ts` - Test runner config
- `tailwindcss` v4 in postcss config (PostCSS plugin)

## Testing

**Test Framework:**
- Vitest 4.0.18 - Test runner (dev)
- @vitest/ui 4.0.18 - UI for test results (dev)
- @testing-library/react 16.3.2 - React component testing (dev)
- @testing-library/jest-dom 6.9.1 - DOM matchers (dev)
- @testing-library/user-event 14.6.1 - User interaction simulation (dev)
- jsdom 28.1.0 - DOM simulation environment (dev)

**Run Commands:**
```bash
bun test          # Run all tests
bun test --ui     # Open Vitest UI
bun run vitest run # Explicit run
```

## Platform Requirements

**Development:**
- Node.js 24+ (Bun 1.3.9 compatible)
- TypeScript 5.9.3+
- Next.js 16.1.6

**Production:**
- Node.js 24+ runtime
- Environment variables for all services (Supabase, Stripe, Sentry)
- Deployment target: Vercel (configured via `next.config.ts` Sentry integration)
- Standalone mode enabled for containerization

---

*Stack analysis: 2026-02-26*
