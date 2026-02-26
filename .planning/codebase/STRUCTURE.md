# Codebase Structure

**Analysis Date:** 2025-02-26

## Directory Layout

```
/Users/richard/Developer/jirah-shop/
├── app/                       # Next.js 16 App Router
│   ├── (storefront)/          # Customer-facing routes (layout group)
│   │   ├── page.tsx           # Homepage
│   │   ├── shop/              # Product browsing
│   │   ├── product/[slug]/    # Product detail
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Payment flow
│   │   ├── login/             # Authentication
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── account/           # User account
│   │   ├── blog/              # Blog posts
│   │   ├── about/             # Static pages
│   │   ├── contact/           # Contact form
│   │   ├── layout.tsx         # Storefront layout (header + footer)
│   │   └── error.tsx          # Error boundary
│   ├── admin/                 # Admin-only routes
│   │   ├── page.tsx           # Dashboard
│   │   ├── products/          # Product management
│   │   ├── blog/              # Blog management
│   │   ├── orders/            # Order management
│   │   ├── customers/         # Customer list
│   │   ├── reviews/           # Review moderation
│   │   ├── analytics/         # Sales analytics
│   │   ├── settings/          # Shop settings
│   │   ├── coupons/           # Coupon management
│   │   ├── layout.tsx         # Admin layout with sidebar + auth check
│   │   ├── error.tsx          # Error boundary
│   │   └── loading.tsx        # Loading skeleton
│   ├── api/                   # API routes (webhooks)
│   │   └── webhooks/stripe/route.ts   # Stripe webhook handler
│   ├── auth/                  # OAuth callbacks
│   │   ├── callback/route.ts  # OAuth code exchange
│   │   └── confirm/route.ts   # Email confirmation
│   ├── dashboard/             # Internal dashboard (demo)
│   ├── layout.tsx             # Root layout (providers, fonts, metadata)
│   ├── globals.css            # Global Tailwind styles
│   ├── robots.ts              # SEO robots.txt
│   ├── sitemap.ts             # SEO sitemap
│   ├── not-found.tsx          # 404 page
│   └── global-error.tsx       # Global error fallback
├── actions/                   # Server Actions (business logic)
│   ├── products.ts            # Public product queries
│   ├── admin-products.ts      # Admin product CRUD + image/variant upload
│   ├── checkout.ts            # Checkout session creation
│   ├── orders.ts              # Order queries + status updates
│   ├── reviews.ts             # Review creation + moderation
│   ├── blog.ts                # Blog post queries
│   ├── coupons.ts             # Coupon validation + CRUD
│   ├── settings.ts            # Shop settings queries
│   ├── auth.ts                # Auth helpers (unused OAuth action, kept for reference)
│   ├── contact.ts             # Contact form submission
│   └── dev-auth.ts            # Development-only auth helpers
├── components/                # React Components
│   ├── ui/                    # Shadcn/ui primitives (50+ components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   └── ... (all shadcn components)
│   ├── admin/                 # Admin-specific components
│   │   ├── admin-sidebar.tsx  # Sidebar navigation
│   │   ├── product-form.tsx   # Create/edit product (441 lines)
│   │   ├── image-upload.tsx   # Image upload wrapper (uses useSupabaseUpload hook)
│   │   ├── variant-manager.tsx# Variant add/edit UI
│   │   ├── blog-editor.tsx    # Blog post editor
│   │   ├── coupon-form.tsx    # Coupon creation
│   │   ├── order-table.tsx    # Order list table
│   │   └── sales-chart.tsx    # Analytics chart
│   ├── storefront/            # Public storefront components
│   │   ├── header.tsx         # Navigation + search + cart trigger
│   │   ├── footer.tsx         # Footer with links + newsletter
│   │   ├── category-nav.tsx   # Category filtering
│   │   ├── product-grid.tsx   # Product grid layout
│   │   ├── product-list.tsx   # Product list layout
│   │   ├── product-card.tsx   # Individual product card
│   │   ├── search-bar.tsx     # Search UI
│   │   ├── cart-drawer.tsx    # Sidebar cart (uses useCart hook)
│   │   ├── review-form.tsx    # Submit product review
│   │   ├── review-stars.tsx   # Star rating display
│   │   ├── mobile-menu.tsx    # Mobile navigation
│   │   └── ... (other storefront features)
│   ├── auth/                  # Authentication forms
│   │   ├── google-button.tsx  # OAuth button
│   │   ├── login-form.tsx     # Email/password login
│   │   ├── signup-form.tsx    # Registration
│   │   ├── forgot-password-form.tsx  # Password reset request
│   │   └── reset-password-form.tsx   # Password reset submission
│   └── shadcn-studio/         # Block templates (not actively used)
│       ├── blocks/
│       └── logo.tsx
├── hooks/                     # Custom React Hooks
│   └── use-supabase-upload.ts # File upload hook (dropzone + Supabase Storage)
├── lib/                       # Utilities and Configuration
│   ├── supabase/              # Supabase client factories
│   │   ├── client.ts          # Browser client (createBrowserClient)
│   │   ├── server.ts          # Server client (createServerClient + cookies)
│   │   └── admin.ts           # Admin client (privileged operations)
│   ├── stripe.ts              # Stripe SDK initialization
│   ├── logger.ts              # Sentry logging wrapper
│   ├── auth.ts                # Auth helpers (sanitizeRedirect, sanitizeSearchInput)
│   ├── utils.ts               # General utilities (cn, nowISO, toNum)
│   ├── constants.ts           # App-wide constants (SITE_NAME, CATEGORIES, SHIPPING_COST, etc.)
│   ├── env.ts                 # Environment variable validation + export
│   ├── slug.ts                # URL slug generation (generateSlug)
│   ├── format.ts              # Formatting helpers (currency, dates, etc.)
│   ├── normalize.ts           # Data normalization (normalizeProduct, normalizeVariant)
│   ├── pagination.ts          # Pagination helpers
│   └── action-result.ts       # ActionResult type + ok() / fail() helpers
├── providers/                 # React Context Providers
│   ├── auth-provider.tsx      # AuthProvider (user state from Supabase)
│   └── cart-provider.tsx      # CartProvider (cart state + localStorage sync)
├── types/                     # TypeScript Type Definitions
│   └── database.ts            # Supabase schema types (Product, Order, Review, etc.)
├── tests/                     # Test Files
│   ├── storage.test.ts        # Integration tests for useSupabaseUpload hook
│   └── ... (Vitest 4.0.18)
├── supabase/                  # Supabase Project Files
│   ├── migrations/            # Database migration files
│   └── snippets/              # SQL snippets / helpers
├── public/                    # Static Assets
│   └── assets/                # Images, icons, fonts
├── next.config.ts             # Next.js Configuration (security headers, image domains)
├── tsconfig.json              # TypeScript Configuration
├── vitest.config.ts           # Vitest Configuration
├── vitest.setup.ts            # Vitest Setup
├── package.json               # Dependencies (Next.js 16, React 19, Stripe, Supabase, etc.)
├── bun.lock                   # Bun lockfile (package manager)
├── CLAUDE.md                  # Project-specific instructions
└── README.md                  # Project documentation
```

## Directory Purposes

**app/** - Next.js App Router with file-based routing
- **(storefront)/** - Customer-facing pages (uses layout group for shared header/footer)
- **admin/** - Protected admin pages (server-side role check in layout)
- **api/** - Route handlers for webhooks
- **auth/** - OAuth callback routes
- **globals.css** - Tailwind configuration applied site-wide
- **layout.tsx** - Root layout with AuthProvider, CartProvider, fonts, metadata

**actions/** - "use server" functions (business logic, data access)
- Each file exports multiple functions
- All return `Promise<ActionResult<T>>` or throw
- Called from client components via `startTransition()`

**components/** - React components organized by domain
- **ui/** - Shadcn/ui button, input, dialog, card, table, sidebar, etc.
- **admin/** - Product/order/blog management components
- **storefront/** - Product listing, cart, checkout, search UI
- **auth/** - Login/signup/password reset forms

**lib/** - Shared utilities, no UI
- **supabase/** - Client factories (browser, server, admin)
- All other files are stateless utility functions

**providers/** - React Context setup (state management)
- AuthProvider - user auth state from Supabase
- CartProvider - cart state persisted to localStorage

**types/** - TypeScript type definitions
- **database.ts** - Supabase schema types (Product, Order, OrderItem, Review, etc.)

**tests/** - Test files using Vitest
- Co-located with source where possible
- Integration tests for critical hooks (useSupabaseUpload)

## Key File Locations

**Entry Points:**
- `app/layout.tsx` - Root layout (initializes providers, fetches settings)
- `app/(storefront)/page.tsx` - Homepage
- `app/admin/layout.tsx` - Admin dashboard entry (checks role)
- `app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- `app/auth/callback/route.ts` - OAuth callback

**Configuration:**
- `lib/constants.ts` - App-wide constants (SITE_NAME, CATEGORIES, SHIPPING_COST, FREE_SHIPPING_THRESHOLD, CURRENCY)
- `lib/env.ts` - Environment variable validation
- `next.config.ts` - Image domains, security headers, CSP
- `tsconfig.json` - Path aliases (`@/*` → project root)

**Core Logic:**
- `actions/products.ts` - getProducts (filters, search, sorting, pagination)
- `actions/admin-products.ts` - createProduct, updateProduct, deleteProduct
- `actions/checkout.ts` - createCheckoutSession (price validation, inventory check, Stripe session)
- `actions/orders.ts` - getOrders, getOrder, updateOrderStatus
- `app/api/webhooks/stripe/route.ts` - Payment processing, order creation

**Authentication & Authorization:**
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/supabase/server.ts` - Server Supabase client
- `lib/supabase/admin.ts` - Admin Supabase client (privileged operations)
- `providers/auth-provider.tsx` - useAuth() hook
- `app/admin/layout.tsx` - Role-based access control

**Testing:**
- `vitest.config.ts` - Vitest configuration
- `tests/storage.test.ts` - useSupabaseUpload integration tests

## Naming Conventions

**Files:**
- Client components (React): `kebab-case.tsx` (e.g., `product-card.tsx`, `cart-drawer.tsx`)
- Server actions: `kebab-case.ts` with `"use server"` directive (e.g., `admin-products.ts`)
- API routes: `route.ts` (e.g., `app/api/webhooks/stripe/route.ts`)
- Pages: `page.tsx` (e.g., `app/(storefront)/shop/page.tsx`)
- Layouts: `layout.tsx` (e.g., `app/admin/layout.tsx`)

**Directories:**
- Feature domains: singular lowercase (e.g., `admin/`, `storefront/`, `auth/`)
- Layout groups: parentheses (e.g., `(storefront)/`, indicates shared layout)
- Dynamic routes: brackets (e.g., `[slug]/`, `[id]/`)

**Exports:**
- Named exports for reusable functions
- Default export only for page.tsx / layout.tsx components
- Component naming: PascalCase (e.g., `ProductForm`, `CartDrawer`, `GoogleButton`)
- Hook naming: camelCase starting with `use` (e.g., `useCart`, `useAuth`, `useSupabaseUpload`)

**Types:**
- Supabase schema types: PascalCase (e.g., `Product`, `Order`, `OrderItem`, `ProductReview`)
- Discriminated unions: `| { success: true; data: T } | { success: false; error: string }`
- Enums: SCREAMING_SNAKE_CASE for constants (e.g., `SITE_NAME`, `CURRENCY`)

## Where to Add New Code

**New Feature (e.g., Wishlist):**
1. Define types in `types/database.ts` (e.g., `Wishlist`, `WishlistItem`)
2. Create server actions in `actions/wishlist.ts` (e.g., `addToWishlist`, `removeFromWishlist`, `getWishlist`)
3. Create context provider in `providers/wishlist-provider.tsx` (if client-side state needed)
4. Create UI components in `components/storefront/wishlist-*.tsx` (e.g., `wishlist-button.tsx`, `wishlist-drawer.tsx`)
5. Add routes in `app/(storefront)/wishlist/` (page.tsx, etc.)
6. Add admin page in `app/admin/wishlist/` (if management needed)

**New Admin Feature (e.g., Email Campaigns):**
1. Define types in `types/database.ts`
2. Create server actions in `actions/campaigns.ts`
3. Create admin form component in `components/admin/campaign-form.tsx`
4. Create admin page in `app/admin/campaigns/page.tsx`
5. Add API route if needed in `app/api/webhooks/` (for email service callbacks)

**New Component Library Addition:**
- Add to `components/ui/` with shadcn/ui conventions
- Export from component file (no barrel index)
- Use Tailwind CVA for variants if needed

**New Utility Function:**
- If domain-specific: add to relevant file in `lib/` (e.g., `lib/format.ts` for formatting)
- If cross-cutting: create new file in `lib/` following naming pattern
- Export both named functions and types

**New Server Action:**
- Create file in `actions/` matching the feature name (e.g., `actions/reviews.ts`)
- Mark all exported functions with `"use server"` at the top
- Return `ActionResult<T>` discriminated union
- Use `logger` for errors
- Include JSDoc comments for parameters

**New Hook:**
- Create file in `hooks/` with `use-` prefix (e.g., `hooks/use-wishlist.ts`)
- Use TypeScript for prop types
- Include JSDoc comments
- Keep logic focused and reusable

## Special Directories

**supabase/**
- Purpose: Supabase project configuration and migrations
- Generated: migrations/ (by Supabase CLI)
- Committed: Yes (migrations should be tracked)
- Migration files: Run with `supabase migration up` or `supabase push`

**public/assets/**
- Purpose: Static images, icons, fonts
- Generated: No (manually added)
- Committed: Yes
- Note: Images referenced in components via relative path `/assets/...`

**.next/**
- Purpose: Next.js build output and dev cache
- Generated: Yes (by Next.js build/dev)
- Committed: No (.gitignore)

**node_modules/**
- Purpose: Installed dependencies
- Generated: Yes (by package manager)
- Committed: No (.gitignore)

**tests/**
- Purpose: Test files (unit, integration, E2E)
- Organized by: Feature domain (e.g., `tests/storage.test.ts` for useSupabaseUpload)
- Run: `bun test` or `bun run vitest`

**supabase/migrations/**
- Purpose: Database schema changes
- Format: Numbered SQL files (e.g., `20250101120000_create_products.sql`)
- Execution: Applied in order by Supabase CLI
- Committed: Yes (reproducible schema)

---

*Structure analysis: 2025-02-26*
