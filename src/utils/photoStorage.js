import { db } from '../db'

const PHOTO_DIR = 'completion-photos'
const MAX_IMAGE_DIMENSION = 1600
const JPEG_QUALITY = 0.82

const canUseFileStorage = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.storage?.getDirectory === 'function'

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })

const dataUrlToBlob = async (dataUrl) => {
  const res = await fetch(dataUrl)
  return await res.blob()
}

const getPhotoExtension = (type) => {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/gif') return 'gif'
  return 'jpg'
}

const getPhotoMimeType = (type) => {
  if (type === 'image/png') return 'image/png'
  if (type === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

const optimizeImageBlob = async (blob) => {
  if (
    typeof window === 'undefined' ||
    typeof createImageBitmap !== 'function' ||
    !blob?.type?.startsWith('image/') ||
    blob.type === 'image/gif' ||
    blob.type === 'image/svg+xml'
  ) {
    return blob
  }

  const bitmap = await createImageBitmap(blob)

  try {
    const { width, height } = bitmap
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height))
    const targetWidth = Math.max(1, Math.round(width * scale))
    const targetHeight = Math.max(1, Math.round(height * scale))

    if (
      scale === 1 &&
      blob.size <= 1024 * 1024 &&
      (blob.type === 'image/jpeg' || blob.type === 'image/webp')
    ) {
      return blob
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return blob

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    const outputType = getPhotoMimeType(blob.type)
    const quality = outputType === 'image/png' ? undefined : JPEG_QUALITY

    const optimizedBlob = await new Promise((resolve) => {
      canvas.toBlob((nextBlob) => resolve(nextBlob ?? blob), outputType, quality)
    })

    return optimizedBlob.size > 0 ? optimizedBlob : blob
  } finally {
    bitmap.close()
  }
}

const getPhotoRoot = async () => {
  const root = await navigator.storage.getDirectory()
  return await root.getDirectoryHandle(PHOTO_DIR, { create: true })
}

const writePhotoFile = async (photoPath, blob) => {
  const root = await getPhotoRoot()
  const fileHandle = await root.getFileHandle(photoPath, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

const readPhotoFile = async (photoPath) => {
  if (!canUseFileStorage() || !photoPath) return null

  try {
    const root = await getPhotoRoot()
    const fileHandle = await root.getFileHandle(photoPath)
    const file = await fileHandle.getFile()
    return file
  } catch {
    return null
  }
}

export const deleteStoredPhoto = async (photoPath) => {
  if (!canUseFileStorage() || !photoPath) return

  try {
    const root = await getPhotoRoot()
    await root.removeEntry(photoPath)
  } catch {
    // Missing files are safe to ignore here.
  }
}

export const clearStoredPhotos = async () => {
  if (!canUseFileStorage()) return

  try {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry(PHOTO_DIR, { recursive: true })
  } catch {
    // No stored photo directory yet.
  }
}

const storePhotoBlob = async ({ blob, routineId, date }) => {
  const optimizedBlob = await optimizeImageBlob(blob)

  if (!canUseFileStorage()) {
    return {
      photoBlob: optimizedBlob,
      photoPath: null,
    }
  }

  const extension = getPhotoExtension(optimizedBlob.type)
  const fileName = `${date}-${routineId}-${crypto.randomUUID()}.${extension}`
  await writePhotoFile(fileName, optimizedBlob)

  return {
    photoBlob: null,
    photoPath: fileName,
  }
}

export const completionHasPhoto = (completion) =>
  Boolean(completion?.photoPath || completion?.photoBlob)

export const hydrateCompletionPhoto = async (completion) => {
  if (!completion) return completion

  if (completion.photoPath) {
    const storedBlob = await readPhotoFile(completion.photoPath)
    if (storedBlob) {
      return { ...completion, photoBlob: storedBlob }
    }

    if (!completion.photoBlob && completion.id != null) {
      await db.completions.update(completion.id, { photoPath: null })
    }
  }

  if (!completion.photoBlob) {
    return {
      ...completion,
      photoBlob: null,
      photoPath: completion.photoPath ?? null,
    }
  }

  const stored = await storePhotoBlob({
    blob: completion.photoBlob,
    routineId: completion.routineId,
    date: completion.date,
  })

  if (stored.photoPath && completion.id != null) {
    await db.completions.update(completion.id, {
      photoBlob: null,
      photoPath: stored.photoPath,
    })
  }

  return {
    ...completion,
    photoBlob: stored.photoBlob ?? completion.photoBlob,
    photoPath: stored.photoPath ?? completion.photoPath ?? null,
  }
}

export const hydrateCompletionPhotos = async (completions) =>
  await Promise.all(completions.map(hydrateCompletionPhoto))

export const createPhotoCompletionUpdate = async ({
  completion,
  routineId,
  date,
  blob,
}) => {
  if (completion?.photoPath) {
    await deleteStoredPhoto(completion.photoPath)
  }

  const stored = await storePhotoBlob({ blob, routineId, date })
  return {
    completed: true,
    photoBlob: stored.photoBlob,
    photoPath: stored.photoPath,
  }
}

export const serializeCompletionPhoto = async (completion) => {
  const hydrated = await hydrateCompletionPhoto(completion)
  if (!hydrated?.photoBlob) {
    if (!hydrated?.photoPath) return hydrated
    const rest = { ...hydrated }
    delete rest.photoPath
    return rest
  }

  const rest = { ...hydrated }
  delete rest.photoBlob
  delete rest.photoPath
  const { photoBlob } = hydrated
  const photoBase64 = await blobToDataUrl(photoBlob)
  return {
    ...rest,
    photoBase64,
  }
}

export const deserializeCompletionPhoto = async (completion) => {
  if (!completion.photoBase64) {
    return {
      ...completion,
      photoBlob: completion.photoBlob ?? null,
      photoPath: completion.photoPath ?? null,
    }
  }

  const { photoBase64, ...rest } = completion
  const photoBlob = await dataUrlToBlob(photoBase64)
  const stored = await storePhotoBlob({
    blob: photoBlob,
    routineId: rest.routineId,
    date: rest.date,
  })

  return {
    ...rest,
    completed: true,
    photoBlob: stored.photoBlob,
    photoPath: stored.photoPath,
  }
}
