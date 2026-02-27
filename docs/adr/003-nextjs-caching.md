# ADR-003: Next.js 16 `use cache` Caching Strategy

## Status

Accepted

## Context

The application has read-heavy pages (product listings, blog posts, shop settings) that benefit from caching. Next.js 16 provides multiple caching mechanisms:

- **ISR with `revalidateTag()`**: Established pattern from earlier Next.js versions
- **`use cache` + `cacheTag()` + `updateTag()`**: Experimental API in Next.js 16 for granular function-level caching
- **`React.cache()`**: Per-request deduplication (not persistent caching)

## Decision

Use the experimental `use cache` directive with `cacheTag()` for persistent caching and `updateTag()` for invalidation. Use `React.cache()` for per-request deduplication in `lib/cached-queries.ts`.

Configuration required in `next.config.ts`:
```typescript
experimental: {
  useCache: true,
}
```

Cache patterns:
- `use cache` at the top of query functions for persistent caching
- `cacheTag("products")`, `cacheTag("blog")`, etc. for tag-based grouping
- `updateTag("products")` in server actions after mutations (not `revalidateTag()`)
- `React.cache()` wrapping query functions for per-request deduplication

## Consequences

**Benefits:**
- Per-function granular cache control (more precise than page-level ISR)
- Tag-based invalidation allows targeted cache busting after mutations
- `React.cache()` prevents duplicate database queries within a single request
- Co-located with query functions -- cache logic lives next to the data fetching code

**Trade-offs:**
- Experimental API -- requires `experimental.useCache: true` config flag
- Uses `updateTag()` (not the older `revalidateTag()`) -- easy to confuse
- Cutting-edge feature with limited community documentation
- Cache behavior may change in future Next.js releases
