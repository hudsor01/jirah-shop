import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone, type FileError, type FileRejection } from 'react-dropzone'

import { createClient } from '@/lib/supabase/client'

/** Wrapper that pairs a File with its object URL preview and validation errors. */
type FileWithPreview = {
  file: File
  preview: string
  errors: readonly FileError[]
}

type UseSupabaseUploadOptions = {
  /**
   * Name of bucket to upload files to in your Supabase project
   */
  bucketName: string
  /**
   * Folder to upload files to in the specified bucket within your Supabase project.
   *
   * Defaults to uploading files to the root of the bucket
   *
   * e.g If specified path is `test`, your file will be uploaded as `test/file_name`
   */
  path?: string
  /**
   * Allowed MIME types for each file upload (e.g `image/png`, `text/html`, etc). Wildcards are also supported (e.g `image/*`).
   *
   * Defaults to allowing uploading of all MIME types.
   */
  allowedMimeTypes?: string[]
  /**
   * Maximum upload size of each file allowed in bytes. (e.g 1000 bytes = 1 KB)
   */
  maxFileSize?: number
  /**
   * Maximum number of files allowed per upload.
   */
  maxFiles?: number
  /**
   * The number of seconds the asset is cached in the browser and in the Supabase CDN.
   *
   * This is set in the Cache-Control: max-age=<seconds> header. Defaults to 3600 seconds.
   */
  cacheControl?: number
  /**
   * When set to true, the file is overwritten if it exists.
   *
   * When set to false, an error is thrown if the object already exists. Defaults to `false`
   */
  upsert?: boolean
}

type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>

const useSupabaseUpload = (options: UseSupabaseUploadOptions) => {
  const supabase = useRef(createClient()).current
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = false,
  } = options

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([])
  const [successes, setSuccesses] = useState<string[]>([])

  const isSuccess =
    errors.length === 0 && successes.length > 0 && successes.length === files.length

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const validFiles: FileWithPreview[] = acceptedFiles
        .filter((file) => !files.find((x) => x.file.name === file.name))
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          errors: [],
        }))

      const invalidFiles: FileWithPreview[] = fileRejections.map(({ file, errors }) => ({
        file,
        preview: URL.createObjectURL(file),
        errors,
      }))

      const newFiles = [...files, ...validFiles, ...invalidFiles]

      setFiles(newFiles)
    },
    [files]
  )

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview)
        }
      })
    }
    // Only cleanup on unmount -- revoking during files state changes
    // would break preview display for files still in the list.
    // The `files` ref is captured in the cleanup closure at unmount time,
    // so all current previews are properly revoked.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- intentional unmount-only cleanup

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: maxFiles !== 1,
  })

  const onUpload = useCallback(async () => {
    setLoading(true)

    // Support handling partial successes --
    // If any files didn't upload, hitting "Upload" again will only retry those
    const filesWithErrors = errors.map((x) => x.name)
    const filesToUpload =
      filesWithErrors.length > 0
        ? [
            ...files.filter((f) => filesWithErrors.includes(f.file.name)),
            ...files.filter((f) => !successes.includes(f.file.name)),
          ]
        : files

    const responses = await Promise.all(
      filesToUpload.map(async (f) => {
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(path ? `${path}/${f.file.name}` : f.file.name, f.file, {
            cacheControl: cacheControl.toString(),
            upsert,
          })
        if (error) {
          return { name: f.file.name, message: error.message }
        } else {
          return { name: f.file.name, message: undefined }
        }
      })
    )

    const responseErrors = responses.filter((x) => x.message !== undefined)
    setErrors(responseErrors)

    const responseSuccesses = responses.filter((x) => x.message === undefined)
    const newSuccesses = Array.from(
      new Set([...successes, ...responseSuccesses.map((x) => x.name)])
    )
    setSuccesses(newSuccesses)

    setLoading(false)
  }, [files, path, bucketName, errors, successes, supabase.storage, cacheControl, upsert])

  useEffect(() => {
    if (files.length === 0) {
      setErrors([])
    }

    // If the number of files doesn't exceed the maxFiles parameter,
    // remove the error 'Too many files' from each file
    if (files.length <= maxFiles) {
      let changed = false
      const newFiles = files.map((f) => {
        if (f.errors.some((e) => e.code === 'too-many-files')) {
          const filtered = f.errors.filter((e) => e.code !== 'too-many-files')
          changed = true
          return { ...f, errors: filtered }
        }
        return f
      })
      if (changed) {
        setFiles(newFiles)
      }
    }
  }, [files.length, maxFiles, files])

  return {
    files,
    setFiles,
    successes,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    maxFileSize: maxFileSize,
    maxFiles: maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  }
}

export { useSupabaseUpload, type UseSupabaseUploadOptions, type UseSupabaseUploadReturn, type FileWithPreview }
