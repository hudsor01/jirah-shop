---
applyTo: "**"
---

# Instructions for Using the shadcn/studio MCP SERVER

To ensure accurate and helpful responses when interacting with the shadcn/studio MCP SERVER, it is essential to follow these guidelines. Adhering strictly to these instructions will ensure the best results.

## Instructions

**Strict Adherence Required**: Every time you interact with the shadcn/studio MCP Server, **follow all instructions precisely**.

- Follow the workflow exactly as outlined by the MCP Server step by step.
- **Avoid Shortcuts**: Never attempt to bypass steps or rush through the process. Each instruction is vital to achieving the desired outcome.

## CRITICAL RULE: NEVER DEVIATE FROM THE STEP-BY-STEP WORKFLOW

### MANDATORY BEHAVIOR FOR ALL WORKFLOWS:

- ✅ **DO**: Follow each step immediately after completing the previous one
- ✅ **DO**: Trust the workflow and proceed without hesitation
- ✅ **DO**: Follow the specific tool sequence outlined in each workflow
- ✅ **DO**: Complete the ENTIRE workflow without stopping for user confirmation
- ❌ **DON'T**: Make explanations between steps
- ❌ **DON'T**: Make additional tool calls not required by the workflow
- ❌ **DON'T**: Jump around or skip steps
- ❌ **DON'T**: Over-explain the process
- ❌ **DON'T**: Stop mid-workflow asking for user confirmation

### WORKFLOW-SPECIFIC CRITICAL RULES:

#### FOR CREATE-UI (/cui):

- **COLLECT FIRST, INSTALL LAST**: Complete ALL block collection before ANY installation
- **NO PREMATURE INSTALLATION**: Do not use installation tools until collection phase is complete
- **MANDATORY CONTENT CUSTOMIZATION**: After installation, automatically proceed to customize content

#### FOR REFINE-UI (/rui):

- Follow the refine workflow using component tools
- Update existing components according to user requirements

#### FOR INSPIRATION-UI (/iui):

- Follow the inspiration workflow for design ideas
- Use inspiration tools as outlined

#### FOR FIGMA-TO-CODE (/ftc):

- Follow the figma-to-code workflow for converting Figma designs to code
- Use figma-to-code tools as specified

### GENERAL AUTOMATION RULES:

- ✅ **DO**: Proceed automatically through all workflow steps
- ✅ **DO**: Follow the tool sequence exactly as specified
- ✅ **DO**: Complete the full workflow from start to finish
- ❌ **DON'T**: Ask "shall I proceed" or "let me know to continue"
- ❌ **DON'T**: Stop mid-workflow waiting for user input
- ❌ **DON'T**: Use tools out of sequence

### FAILURE CONSEQUENCES:

If I deviate from this workflow, I am:

1. Wasting user's time
2. Not following explicit instructions
3. Making the process inefficient
4. Potentially breaking the shadcn/studio integration
5. Creating incomplete or incorrect results

### RECOVERY PROTOCOL:

If I catch myself deviating:

1. Stop immediately
2. Identify which step I should be on according to the workflow
3. Continue from that exact step
4. Do not explain the deviation, just continue
5. Complete the full workflow as specified

### REMEMBER:

- Each workflow (/cui, /rui, /iui) has its own specific step-by-step process
- The shadcn/studio MCP Server is designed to be followed step-by-step
- Trust the process and follow it exactly without deviations
- Complete the ENTIRE workflow automatically without user confirmation requests
- No shortcuts, no skipping, no stopping mid-process

---

# Project Conventions

## Stack
- Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui
- Supabase (auth + storage + PostgreSQL), Stripe (payments)
- Package manager: bun (never npm/yarn/pnpm)

## Server Actions
- All server actions return `ActionResult<T>` from `@/lib/action-result`
- Use `ok(data)` for success, `fail("message")` for errors
- Validate all input with Zod `safeParse()` before business logic
- No thrown exceptions -- all errors are returned values
- See `docs/error-handling.md` for full pattern

## Data Access
- Query functions in `queries/` directory (not inline in actions)
- Server actions call query functions for database operations
- Server Components can call query functions directly for reads

## Supabase Client
- Use `@supabase/ssr` with `getAll`/`setAll` cookie methods only
- Never use `get`/`set`/`remove` cookie methods
- Never import from `auth-helpers-nextjs`
- Browser client: `lib/supabase/client.ts`
- Server client: `lib/supabase/server.ts`
- Env var: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not ANON_KEY)

## Caching
- `use cache` + `cacheTag()` for read-heavy queries
- `updateTag()` to invalidate (not `revalidateTag()`)
- `React.cache()` for per-request deduplication in `lib/cached-queries.ts`
- Config flag: `experimental.useCache: true` in next.config

## Testing
- Vitest for unit/integration tests
- `vi.hoisted()` mandatory for mock variables in `vi.mock()` factories
- Playwright for E2E tests in `tests/e2e/`
- Coverage minimum: 30% (statements, branches, functions, lines)
- Run: `bun test`, `bun run test:coverage`, `bun run test:e2e`

## Patterns
- Image upload: `useSupabaseUpload` hook -> `<Dropzone>` component
- Cart: `useCart()` from `providers/cart-provider`
- Checkout: `useCheckout()` shared hook
- Auth: Google OAuth via browser client (not server actions)
- Admin Supabase client: lazy singleton in `lib/supabase/admin.ts`
