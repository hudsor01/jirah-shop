import { vi } from 'vitest'

/**
 * Creates a chainable Supabase query builder mock.
 *
 * Usage in tests:
 *   const { client, queryBuilder } = createMockSupabaseClient()
 *   vi.mock('@/lib/supabase/server', () => ({
 *     createClient: vi.fn(() => Promise.resolve(client)),
 *   }))
 *
 *   // Configure per-test responses:
 *   queryBuilder.mockResult({ data: [product], error: null })
 */

type QueryResult = { data: unknown; error: unknown; count?: number }

function createChainableQueryBuilder() {
  let _result: QueryResult = { data: null, error: null }

  const builder: Record<string, ReturnType<typeof vi.fn>> & {
    mockResult: (result: QueryResult) => void
    _getResult: () => QueryResult
  } = {
    mockResult(result: QueryResult) {
      _result = result
    },
    _getResult() {
      return _result
    },
  } as any

  // Chain methods that return `this`
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'in', 'is', 'like', 'ilike', 'or', 'and',
    'contains', 'containedBy', 'overlaps',
    'range', 'limit', 'offset',
    'order', 'filter', 'match', 'not',
    'textSearch',
  ]

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnThis()
  }

  // Terminal methods that resolve to data
  const terminalMethods = ['single', 'maybeSingle', 'csv', 'then']
  for (const method of terminalMethods) {
    if (method === 'then') {
      // Make the builder thenable — await resolves to _result
      builder.then = vi.fn((resolve) => resolve(_result))
    } else {
      builder[method] = vi.fn(() => Promise.resolve(_result))
    }
  }

  return builder
}

export function createMockSupabaseClient() {
  const queryBuilder = createChainableQueryBuilder()

  // Make .from() return the query builder
  const from = vi.fn(() => queryBuilder)

  // Auth mock
  const auth = {
    getUser: vi.fn(() =>
      Promise.resolve({ data: { user: null }, error: null })
    ),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  }

  // RPC mock
  const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }))

  // Storage mock
  const storageBucket = {
    upload: vi.fn(() => Promise.resolve({ data: { path: '' }, error: null })),
    getPublicUrl: vi.fn(() => ({
      data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test/path' },
    })),
    remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
    list: vi.fn(() => Promise.resolve({ data: [], error: null })),
  }

  const storage = {
    from: vi.fn(() => storageBucket),
  }

  const client = { from, auth, rpc, storage }

  return { client, queryBuilder, auth, rpc, storage: storageBucket }
}

/**
 * Creates a mock admin Supabase client (for webhook/admin use cases
 * that use createAdminClient instead of createClient).
 */
export function createMockAdminClient() {
  return createMockSupabaseClient()
}

/**
 * Helper to configure a mock auth user on a Supabase client.
 */
export function mockAuthUser(
  auth: ReturnType<typeof createMockSupabaseClient>['auth'],
  user: { id: string; email: string; app_metadata?: Record<string, unknown> } | null,
  error: { message: string } | null = null
) {
  auth.getUser.mockResolvedValue({
    data: { user },
    error,
  })
}
