# Testing Patterns

**Analysis Date:** 2026-02-26

## Test Framework

**Runner:**
- Vitest 4.0.18
- Config: `vitest.config.ts`
- Environment: jsdom (browser simulation)
- Globals enabled: `true` (describe, it, expect available without imports)

**Assertion Library:**
- Vitest built-in assertions
- `@testing-library/react` for component testing utilities
- `@testing-library/jest-dom` for enhanced matchers (e.g., `toHaveLength`, `toContain`, `toBe`)

**Run Commands:**
```bash
bun test               # Run all tests (alias to `bun run vitest run`)
bun run vitest run    # Run tests in CI mode (no watch)
bun test:ui           # Vitest UI dashboard (vitest --ui)
```

## Test File Organization

**Location:**
- Dedicated `tests/` directory at project root
- Not co-located with source files (separate directory pattern)

**Naming:**
- Pattern: `[name].test.ts`
- Example: `storage.test.ts`

**Structure:**
```
tests/
└── storage.test.ts     # Integration tests for useSupabaseUpload hook
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock setup FIRST (hoisted above all imports)
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: (_bucket: string) => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  })),
}))

// Import after mocks
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'

// Setup global stubs
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Test suite
describe('useSupabaseUpload – storage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('description', async () => {
    // arrange
    // act
    // assert
  })
})
```

**Patterns:**
- Setup files: `vitest.setup.ts` imports `@testing-library/jest-dom` for DOM matchers
- beforeEach blocks: Clear all mocks before each test with `vi.clearAllMocks()`
- Test descriptions are specific and behavioral: "marks a file as successful when the upload returns no error"
- Arrange-Act-Assert flow followed consistently

## Mocking

**Framework:** Vitest's built-in `vi` mock system (not jest)

**Patterns:**
```typescript
// Module mocking (hoisted before imports)
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: (_bucket: string) => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  })),
}))

// Setup return values
mockUpload.mockResolvedValue({ data: { path: 'uploads/photo.png' }, error: null })

// Verify calls
expect(mockUpload).toHaveBeenCalledOnce()
expect(result.current.successes).toContain('photo.png')

// Clear between tests
beforeEach(() => {
  vi.clearAllMocks()
})

// Chain mock returns for sequential calls
mockUpload
  .mockResolvedValueOnce({ data: {}, error: null })
  .mockResolvedValueOnce({ data: null, error: { message: 'Network error' } })
```

**What to Mock:**
- External dependencies: Supabase client, API calls, storage operations
- Browser APIs: `URL.createObjectURL`, `URL.revokeObjectURL`
- Module-level instances that depend on environment (createClient)

**What NOT to Mock:**
- Internal utility functions (often imported from `@/lib/`)
- React hooks from `react` (useState, useEffect, useCallback)
- Testing library utilities (renderHook, act)
- Native data structures and operations

## Fixtures and Factories

**Test Data:**
```typescript
// Helper function to create test data with required shape
function makeFile(name: string, sizeBytes = 1024, mimeType = 'image/png') {
  const content = new Uint8Array(sizeBytes)
  const file = new File([content], name, { type: mimeType }) as File & {
    errors: { code: string; message: string }[]
    preview?: string
  }
  file.errors = []
  file.preview = 'blob:mock-url'
  return file
}

// Usage in tests
const file = makeFile('photo.png')
const oversizedFile = makeFile('huge.png', 10 * 1024)
```

**Location:**
- Defined inline in test file at module level (above test suite)
- Not extracted to separate fixtures directory (project has only 1 test file)

## Coverage

**Requirements:** No coverage enforcement detected

**View Coverage:**
```bash
# Not configured in package.json scripts
# Could add with: bun vitest run --coverage
```

## Test Types

**Unit Tests:**
- Not explicitly separated, but storage.test.ts focuses on hook behavior
- Tests isolated functions with mocked dependencies
- Example: Testing `useSupabaseUpload` hook state changes

**Integration Tests:**
- Labeled in test file: "useSupabaseUpload – storage integration"
- Tests hook integration with mocked Supabase client
- Verifies upload flow: file validation → upload → response handling → state updates

**E2E Tests:**
- Not implemented
- No Cypress, Playwright, or similar setup detected

## Common Patterns

**Async Testing:**
```typescript
// Using act() for state updates in hooks
await act(async () => {
  await result.current.onUpload()
})

// Verifying loading state
expect(result.current.loading).toBe(false)
```

**Error Testing:**
```typescript
it('records an error when the upload returns an error', async () => {
  mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })

  const { result } = renderHook(() =>
    useSupabaseUpload({ bucketName: 'test-bucket' })
  )

  // ... trigger action ...

  expect(result.current.errors).toHaveLength(1)
  expect(result.current.errors[0].name).toBe('broken.png')
  expect(result.current.errors[0].message).toBe('Upload failed')
})
```

**Hook Testing:**
```typescript
const { result } = renderHook(() =>
  useSupabaseUpload({ bucketName: 'test-bucket' })
)

// Access hook return values
expect(result.current.files).toHaveLength(1)

// Update hook state
act(() => {
  result.current.setFiles([file])
})
```

**Partial Success/Retry Pattern:**
```typescript
// Test files that succeed on first attempt, fail on second, then succeed on retry
mockUpload
  .mockResolvedValueOnce({ data: {}, error: null })        // file-a succeeds
  .mockResolvedValueOnce({ data: null, error: {...} })    // file-b fails
  .mockResolvedValueOnce({ data: {}, error: null })        // file-b retry succeeds (x2)
  .mockResolvedValueOnce({ data: {}, error: null })

// Verify final state
expect(result.current.successes).toContain('file-a.png')
expect(result.current.successes).toContain('file-b.png')
expect(result.current.errors).toHaveLength(0)
```

## Test Suite Details

**File:** `tests/storage.test.ts` (253 lines)

**Tests (6 total, all passing):**

1. **Successful file upload** (line 61-87)
   - Verifies successful upload with mocked Supabase
   - Sets file → calls onUpload → checks successes array, isSuccess flag

2. **Failed file upload** (line 92-115)
   - Mocks upload error return
   - Verifies error recorded in errors array with correct name and message

3. **File size validation** (line 122-151)
   - Tests files with `file-too-large` error code
   - Verifies file retained in state with error attached
   - Notes: hook doesn't filter on client-side errors before uploading

4. **Max files limit** (line 157-184)
   - Tests `too-many-files` error code
   - Verifies error preserved on excess files
   - Checks that error clears when files.length <= maxFiles

5. **Public URL generation** (line 189-203)
   - Tests getPublicUrl method
   - Verifies correctly structured Supabase CDN URL format
   - Pattern: `https://project.supabase.co/storage/v1/object/public/{bucket}/{path}`

6. **Partial retry** (line 208-251)
   - Tests re-upload of only failed files on second attempt
   - First call: file-a succeeds, file-b fails
   - Second call: file-b retried (appears in concatenated list twice)
   - Verifies total call count and final success state

## Setup Files

**`vitest.config.ts`:**
- Environment: jsdom
- Globals: true
- Setup file: `./vitest.setup.ts`
- Path alias: `@/` → project root

**`vitest.setup.ts`:**
- Imports `@testing-library/jest-dom`
- Provides enhanced DOM matchers to all tests

## Testing Dependencies Installed

- `vitest: 4.0.18` — test runner
- `@vitest/ui: 4.0.18` — UI dashboard
- `jsdom: 28.1.0` — DOM environment
- `@testing-library/react: 16.3.2` — component testing utils
- `@testing-library/jest-dom: 6.9.1` — DOM matchers
- `@testing-library/user-event: 14.6.1` — user interaction simulation
- `@vitejs/plugin-react: 5.1.4` — React support for Vitest

---

*Testing analysis: 2026-02-26*
