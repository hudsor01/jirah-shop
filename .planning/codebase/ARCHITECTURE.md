# Architecture

**Analysis Date:** 2025-02-26

## Pattern Overview

**Overall:** Next.js 16 full-stack application with client-server separation and clear domain boundaries.

**Key Characteristics:**
- Server Actions as primary data access pattern (all server-side logic in `actions/`)
- Context-based client state management (AuthProvider, CartProvider)
- Supabase for authentication + database + file storage
- Stripe for payments with webhook handling
- Role-based access control (admin checks via user metadata)
- Type-safe database operations with explicit type definitions

## Layers

**Presentation (Client Components):**
- Purpose: Render UI, handle user interactions, manage client state
- Location: `components/auth/`, `components/storefront/`, `components/admin/`, `components/ui/`
- Contains: React components, forms, UI primitives
- Depends on: Server actions, Context providers, Hooks
- Used by: Route pages in `app/` directory

**Server Actions Layer:**
- Purpose: Handle business logic, database operations, price validation
- Location: `actions/` (11 files: products, admin-products, checkout, orders, reviews, blog, coupons, settings, auth, contact, dev-auth)
- Contains: Async functions marked with `"use server"`, return `ActionResult<T>` discriminated unions
- Depends on: Supabase server client, Stripe SDK, utilities
- Used by: Client components via `startTransition()`, forms, event handlers

**API Routes (External Integrations):**
- Purpose: Handle webhooks and third-party callbacks
- Location: `app/api/` (Stripe webhook at `app/api/webhooks/stripe/route.ts`, OAuth callback at `app/auth/callback/route.ts`)
- Contains: Next.js route handlers, webhook signature validation, event dispatch
- Depends on: Supabase admin client, Stripe SDK, Zod validation
- Used by: External services (Stripe, Supabase)

**Database Layer:**
- Purpose: Define schema and provide type-safe access patterns
- Location: `lib/supabase/` (client.ts, server.ts, admin.ts), `types/database.ts`
- Contains: Supabase client factories, admin privileged client, TypeScript type definitions
- Depends on: `@supabase/ssr`, `@supabase/supabase-js`
- Used by: Server actions, webhooks, auth flow

**Utilities & Cross-Cutting:**
- Purpose: Shared logic, logging, validation, formatting
- Location: `lib/` (utils, logger, stripe, slug, format, normalize, constants, auth, action-result, pagination, env)
- Contains: Helper functions, configuration, logging setup
- Depends on: External libraries (Sentry, Zod, clsx)
- Used by: All layers

**Context & State Management:**
- Purpose: Client-side state synchronization and persistence
- Location: `providers/` (auth-provider.tsx, cart-provider.tsx)
- Contains: React Context, useState, useCallback, localStorage persistence
- Depends on: Supabase browser client, Sonner toasts
- Used by: All client components via useAuth() and useCart() hooks

## Data Flow

**User Authentication Flow:**
1. User initiates OAuth via `<GoogleButton>` (calls `createClient().auth.signInWithOAuth()`)
2. OAuth provider redirects to `/auth/callback?code=...`
3. `app/auth/callback/route.ts` exchanges code for session via `supabase.auth.exchangeCodeForSession(code)`
4. Session stored in cookies (via `@supabase/ssr`)
5. `AuthProvider` hooks session changes via `onAuthStateChange()` listener
6. `useAuth()` hook exposes user to components

**Product Purchase Flow:**
1. User adds item to cart via `useCart().addItem()` (client-side, localStorage)
2. User clicks checkout
3. `createCheckoutSession(items, couponCode)` server action:
   - Validates item prices against database (prevents price tampering)
   - Validates stock availability
   - Fetches shipping settings from database
   - Calculates totals with discount validation
   - Creates Stripe checkout session with metadata
   - Returns session URL
4. Browser redirects to Stripe hosted checkout
5. Stripe webhook `POST /api/webhooks/stripe` fires on completion:
   - Validates webhook signature
   - Parses metadata and line items
   - Creates Order record in database
   - Creates OrderItems records
   - Deducts inventory from product_variants
   - Transitions order status to "paid"
6. User redirected to success page with order ID

**Admin Product Management:**
1. Admin navigates to `/admin/products/new`
2. `ProductForm` component loads with `ImageUpload` + `VariantManager` sub-components
3. Form submission calls `createProduct(formData, images, variants)` server action
4. Server action:
   - Validates all inputs
   - Uploads images to Supabase Storage (bucket: product-images)
   - Creates product record in database
   - Creates product_variants records
   - Creates Stripe product and price objects
   - Returns product with IDs
5. Client receives result and redirects to admin dashboard

**State Management:**
- **Auth State:** Managed by `AuthProvider` context, synced from Supabase session
- **Cart State:** Managed by `CartProvider` context, persisted to `localStorage` with key `jirah-shop-cart`
- **Server State:** Fetched on-demand via server actions, no global store (SPA-style queries per component)
- **Form State:** Managed locally via `useState` in form components

## Key Abstractions

**ActionResult<T>:**
- Purpose: Unified return type for all server actions, enables exhaustive error handling
- Examples: `actions/products.ts`, `actions/admin-products.ts`, `actions/checkout.ts`
- Pattern: `{ success: true; data: T } | { success: false; error: string }`
- Usage: Discriminate on `success` boolean in client components

**Supabase Clients:**
- Purpose: Separate browser and server instances with appropriate auth contexts
- Examples: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server), `lib/supabase/admin.ts` (privileged operations)
- Pattern: Factory functions that return configured clients
- Key difference: Server client uses `getAll`/`setAll` cookie methods (never `get`/`set`/`remove`)

**ImageUpload Wrapper Component:**
- Purpose: Reusable image upload with Supabase Storage integration
- Examples: `components/admin/image-upload.tsx` (wrapper), `hooks/use-supabase-upload.ts` (hook)
- Pattern: Wrapper component around hook + Dropzone UI primitives
- Data flow: Hook handles upload logic, wrapper manages UX, form component passes onChange callback

**VariantManager:**
- Purpose: Complex variant editing (size/color options with inventory per variant)
- Examples: `components/admin/variant-manager.tsx`
- Pattern: Client-side form component with add/edit/delete UI
- Storage: Variants held in form state, persisted to DB on submit

**Review Form:**
- Purpose: User-submitted reviews with rating validation
- Examples: `components/storefront/review-form.tsx`
- Pattern: Client form calling `createReview(productId, rating, title, comment)` server action

## Entry Points

**Browser Entry (Layout Root):**
- Location: `app/layout.tsx`
- Triggers: App startup
- Responsibilities:
  - Fetch shop settings (shipping costs, thresholds)
  - Initialize AuthProvider + CartProvider
  - Set up fonts (Poppins, Playfair Display, Roboto Mono)
  - Initialize Sonner toast component
  - Set metadata for SEO

**API Route (Stripe Webhook):**
- Location: `app/api/webhooks/stripe/route.ts` (POST)
- Triggers: Stripe payment event (checkout.session.completed, charge.refunded)
- Responsibilities:
  - Validate webhook signature (prevents spoofing)
  - Switch on event type
  - Call appropriate handler (checkout completion, refund)
  - Create or update order in database

**OAuth Callback:**
- Location: `app/auth/callback/route.ts` (GET)
- Triggers: OAuth provider redirect after user authorization
- Responsibilities:
  - Extract authorization code from URL
  - Exchange code for session via Supabase
  - Redirect to app (or login with error)

**Admin Layout:**
- Location: `app/admin/layout.tsx`
- Triggers: Navigation to `/admin/**`
- Responsibilities:
  - Server-side role check (must have `app_metadata.role === "admin"`)
  - Redirect to login if not authorized
  - Render sidebar + content area

**Storefront Layout:**
- Location: `app/(storefront)/layout.tsx`
- Triggers: Public route navigation
- Responsibilities:
  - Render header with search + cart drawer
  - Render main content
  - Render footer

## Error Handling

**Strategy:** Explicit error propagation with discriminated unions + logging integration.

**Patterns:**

1. **Server Actions:** Use `ActionResult<T>` to model success/failure:
   ```typescript
   // actions/products.ts
   export async function getProducts(...): Promise<Product[]> {
     // Direct throw (caller catches and wraps in ActionResult)
     throw new Error("Not found");
     // OR return explicit fail() result
     return fail("Not found");
   }
   ```

2. **Client Components:** Discriminate on `success` boolean:
   ```typescript
   const result = await createProduct(formData);
   if (result.success) {
     // Handle data
   } else {
     toast.error(result.error);
   }
   ```

3. **Webhook Handlers:** Validate, log, and fail gracefully:
   ```typescript
   // app/api/webhooks/stripe/route.ts
   try {
     const event = stripe.webhooks.constructEvent(...);
     await handleCheckoutSessionCompleted(event.data.object);
   } catch (err) {
     logger.error('Webhook handler error', { error: String(err) });
     return NextResponse.json({ error: "..." }, { status: 500 });
   }
   ```

4. **Logging:** All errors captured to Sentry via logger:
   ```typescript
   // lib/logger.ts
   logger.error('User update failed', { userId, reason });
   // Sends to Sentry + console
   ```

## Cross-Cutting Concerns

**Logging:**
- Framework: Sentry (client + server)
- Initialization: `instrumentation.ts` loads Sentry config at runtime
- API: `lib/logger.ts` with methods `info()`, `warn()`, `error()`, `exception()`
- Usage: All server actions and API routes log significant events

**Validation:**
- Framework: Zod
- Patterns: Input validation in server actions, webhook metadata parsing
- Examples: `CheckoutMetadataSchema` in webhook handler, form input validation

**Authentication:**
- Framework: Supabase Auth with Google OAuth
- Session Storage: Cookies (managed by `@supabase/ssr`)
- Authorization: Role checks in layout middleware (`app_metadata.role === "admin"`)
- Hook: `useAuth()` for client-side user checks

**Price Security:**
- Pattern: Server-side validation in `createCheckoutSession()` (never trust client prices)
- Implementation: Look up product/variant prices from database, replace client-supplied prices
- Rationale: Prevents price tampering (client could send lower prices)

**Rate Limiting:**
- Not explicitly implemented (would need Redis layer or Supabase Edge Function)

**Data Persistence:**
- **Session:** Supabase Auth session in cookies
- **Cart:** LocalStorage with key `jirah-shop-cart`, hydrated on mount via `CartProvider`
- **Database:** All entity data (products, orders, reviews, etc.) in Supabase PostgreSQL

---

*Architecture analysis: 2025-02-26*
