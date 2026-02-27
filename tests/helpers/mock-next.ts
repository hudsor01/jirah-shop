import { vi } from 'vitest'

/**
 * Mock factories for Next.js modules.
 *
 * Usage in individual test files:
 *   vi.mock('next/cache', () => mockNextCache())
 *   vi.mock('next/headers', () => mockNextHeaders())
 */

/**
 * Returns mocked next/cache exports.
 */
export function mockNextCache() {
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    updateTag: vi.fn(),
    unstable_cache: vi.fn((fn: Function) => fn),
  }
}

/**
 * Returns mocked next/headers exports.
 */
export function mockNextHeaders() {
  const cookieStore = {
    getAll: vi.fn(() => []),
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(() => false),
  }

  const headerMap = new Map<string, string>()

  return {
    cookies: vi.fn(() => Promise.resolve(cookieStore)),
    headers: vi.fn(
      () =>
        Promise.resolve({
          get: (key: string) => headerMap.get(key) ?? null,
          has: (key: string) => headerMap.has(key),
          entries: () => headerMap.entries(),
          forEach: (fn: (value: string, key: string) => void) =>
            headerMap.forEach(fn),
          // Utility for tests to set headers
          _set: (key: string, value: string) => headerMap.set(key, value),
        })
    ),
  }
}

/**
 * Returns mocked next/navigation exports.
 */
export function mockNextNavigation() {
  return {
    redirect: vi.fn(),
    notFound: vi.fn(),
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    })),
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(
      () => new URLSearchParams()
    ),
  }
}
