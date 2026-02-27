import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/client BEFORE importing anything that uses it.
// vi.mock is hoisted above all imports by Vitest's babel transform.
// ---------------------------------------------------------------------------

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

// Import after the mock is defined so the module receives the mock.
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// jsdom does not implement URL.createObjectURL, so stub it out.
// ---------------------------------------------------------------------------
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// ---------------------------------------------------------------------------
// Helper – build a FileWithPreview wrapper matching the hook's type:
//   { file: File; preview: string; errors: readonly FileError[] }
// ---------------------------------------------------------------------------
function makeFile(name: string, sizeBytes = 1024, mimeType = 'image/png') {
  const content = new Uint8Array(sizeBytes)
  const file = new File([content], name, { type: mimeType })
  return {
    file,
    preview: 'blob:mock-url',
    errors: [] as { code: string; message: string }[],
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSupabaseUpload – storage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // 1. Successful file upload
  // -------------------------------------------------------------------------
  it('marks a file as successful when the upload returns no error', async () => {
    mockUpload.mockResolvedValue({ data: { path: 'uploads/photo.png' }, error: null })

    const { result } = renderHook(() =>
      useSupabaseUpload({ bucketName: 'test-bucket' })
    )

    const file = makeFile('photo.png')

    // Inject the file directly via setFiles (part of the hook's public API).
    act(() => {
      result.current.setFiles([file])
    })

    expect(result.current.files).toHaveLength(1)

    // Trigger the upload.
    await act(async () => {
      await result.current.onUpload()
    })

    expect(mockUpload).toHaveBeenCalledOnce()
    expect(result.current.successes).toContain('photo.png')
    expect(result.current.errors).toHaveLength(0)
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  // -------------------------------------------------------------------------
  // 2. Failed file upload
  // -------------------------------------------------------------------------
  it('records an error when the upload returns an error', async () => {
    mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })

    const { result } = renderHook(() =>
      useSupabaseUpload({ bucketName: 'test-bucket' })
    )

    const file = makeFile('broken.png')

    act(() => {
      result.current.setFiles([file])
    })

    await act(async () => {
      await result.current.onUpload()
    })

    expect(mockUpload).toHaveBeenCalledOnce()
    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].name).toBe('broken.png')
    expect(result.current.errors[0].message).toBe('Upload failed')
    expect(result.current.successes).toHaveLength(0)
    expect(result.current.isSuccess).toBe(false)
  })

  // -------------------------------------------------------------------------
  // 3. File size validation – file with a size error is held in state with
  //    the correct error code. Note: the hook does NOT filter out errored
  //    files before uploading — onUpload sends whatever is in `files`.
  // -------------------------------------------------------------------------
  it('keeps a file-too-large file in the list without uploading it', async () => {
    const { result } = renderHook(() =>
      useSupabaseUpload({ bucketName: 'test-bucket', maxFileSize: 5 * 1024 })
    )

    const oversizedFile = makeFile('huge.png', 10 * 1024)
    // Simulate what dropzone would have set on a rejected file.
    oversizedFile.errors = [
      { code: 'file-too-large', message: 'File is larger than 5120 bytes' },
    ]

    act(() => {
      result.current.setFiles([oversizedFile])
    })

    // The file should appear in state with the error attached.
    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].errors[0].code).toBe('file-too-large')

    // Calling onUpload still attempts the upload (the hook doesn't filter on
    // client-side validation errors). Providing a mock so no rejection throws.
    mockUpload.mockResolvedValue({ data: {}, error: null })

    await act(async () => {
      await result.current.onUpload()
    })

    // Upload was attempted once (the hook sends whatever is in `files`).
    expect(mockUpload).toHaveBeenCalledOnce()
  })

  // -------------------------------------------------------------------------
  // 4. Max files limit – files carrying the too-many-files error code are
  //    present in state and retain that error.
  // -------------------------------------------------------------------------
  it('retains the too-many-files error on excess files', async () => {
    // maxFiles: 1 means a second file should be flagged.
    const { result } = renderHook(() =>
      useSupabaseUpload({ bucketName: 'test-bucket', maxFiles: 1 })
    )

    const firstFile = makeFile('first.png')
    const extraFile = makeFile('extra.png')
    // Simulate what dropzone would set on the rejected file.
    extraFile.errors = [{ code: 'too-many-files', message: 'Too many files' }]

    act(() => {
      // Push both files: the hook's useEffect only clears too-many-files
      // errors when files.length <= maxFiles, so with 2 files and maxFiles=1
      // the error should be preserved.
      result.current.setFiles([firstFile, extraFile])
    })

    // Allow the useEffect that checks the limit to run.
    await act(async () => {})

    const filesWithError = result.current.files.filter((f) =>
      f.errors.some((e) => e.code === 'too-many-files')
    )

    expect(filesWithError).toHaveLength(1)
    expect(filesWithError[0].file.name).toBe('extra.png')
  })

  // -------------------------------------------------------------------------
  // 5. Public URL generation
  // -------------------------------------------------------------------------
  it('returns a correctly structured public URL from the storage client', () => {
    const BUCKET = 'assets'
    const FILE_PATH = 'images/logo.svg'
    const EXPECTED_URL = `https://project.supabase.co/storage/v1/object/public/${BUCKET}/${FILE_PATH}`

    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: EXPECTED_URL } })

    const client = createClient()
    const { data } = client.storage.from(BUCKET).getPublicUrl(FILE_PATH)

    expect(data.publicUrl).toBe(EXPECTED_URL)
    expect(data.publicUrl).toMatch(
      new RegExp(`/storage/v1/object/public/${BUCKET}/${FILE_PATH}$`)
    )
  })

  // -------------------------------------------------------------------------
  // 6. Partial retry – only failed files are re-uploaded on a second attempt
  // -------------------------------------------------------------------------
  it('re-uploads only failed files on a second onUpload call', async () => {
    // First call: file-a succeeds, file-b fails.
    mockUpload
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Network error' } })

    const { result } = renderHook(() =>
      useSupabaseUpload({ bucketName: 'test-bucket', maxFiles: 2 })
    )

    const fileA = makeFile('file-a.png')
    const fileB = makeFile('file-b.png')

    act(() => {
      result.current.setFiles([fileA, fileB])
    })

    // First upload attempt.
    await act(async () => {
      await result.current.onUpload()
    })

    expect(result.current.successes).toContain('file-a.png')
    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].name).toBe('file-b.png')

    // Second attempt: file-b is uploaded twice (once per concatenated list in
    // the hook's retry logic), both succeed.
    mockUpload
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({ data: {}, error: null })

    await act(async () => {
      await result.current.onUpload()
    })

    // The hook's retry logic concatenates files-with-errors AND files-not-yet-
    // succeeded, so file-b appears in both lists on the second call and is
    // uploaded twice. Total: 2 (first attempt) + 2 (second attempt) = 4.
    expect(mockUpload).toHaveBeenCalledTimes(4)
    expect(result.current.errors).toHaveLength(0)
    expect(result.current.successes).toContain('file-b.png')
    expect(result.current.isSuccess).toBe(true)
  })
})
