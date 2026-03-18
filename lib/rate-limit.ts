import { headers } from "next/headers";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // timestamp in ms when the window resets
}

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number; // sliding window duration in milliseconds
}

// In-memory store: Map<identifier, timestamp[]>
const stores = new Map<string, Map<string, number[]>>();

function getStore(name: string): Map<string, number[]> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

export function createRateLimiter(name: string, options: RateLimiterOptions) {
  const store = getStore(name);

  return {
    async check(identifier?: string): Promise<RateLimitResult> {
      const key = identifier ?? (await getClientIp());
      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Get existing timestamps, filter to current window
      const timestamps = (store.get(key) ?? []).filter(t => t > windowStart);

      if (timestamps.length >= options.maxRequests) {
        // Rate limited
        const oldestInWindow = timestamps[0]!;
        return {
          success: false,
          remaining: 0,
          reset: oldestInWindow + options.windowMs,
        };
      }

      // Allow request, record timestamp
      timestamps.push(now);
      store.set(key, timestamps);

      return {
        success: true,
        remaining: options.maxRequests - timestamps.length,
        reset: now + options.windowMs,
      };
    },
  };
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

// Pre-configured rate limiters
export const authLimiter = createRateLimiter("auth", {
  maxRequests: 5,
  windowMs: 60_000, // 5 per minute
});

export const webhookLimiter = createRateLimiter("webhook", {
  maxRequests: 100,
  windowMs: 60_000, // 100 per minute
});

export const contactLimiter = createRateLimiter("contact", {
  maxRequests: 3,
  windowMs: 60_000, // 3 per minute
});

export const reviewLimiter = createRateLimiter("review", {
  maxRequests: 5,
  windowMs: 60_000, // 5 per minute
});

export const newsletterLimiter = createRateLimiter("newsletter", {
  maxRequests: 3,
  windowMs: 60_000, // 3 per minute
});

// Periodic cleanup of stale entries (runs every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, timestamps] of store) {
        const fresh = timestamps.filter(t => t > now - 300_000); // 5 min max window
        if (fresh.length === 0) {
          store.delete(key);
        } else {
          store.set(key, fresh);
        }
      }
    }
  }, 300_000); // Every 5 minutes
}
