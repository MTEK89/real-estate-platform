export type MediaItem = {
  id: string
  filename: string
  mime: string
  size: number
  width: number
  height: number
  takenAt: string // from file lastModified by default
  createdAt: string
  propertyId: string | null
  tags: string[]
  favorite: boolean
  thumbnailDataUrl: string // small JPEG for fast grids
  sourceUrl?: string | null // when imported from existing URLs (e.g., property.images)
  note?: string | null
}

export type MediaItemUpdate = Partial<
  Pick<MediaItem, "propertyId" | "tags" | "favorite" | "filename" | "thumbnailDataUrl" | "takenAt" | "note">
>

const META_KEY = "re_media_library_meta_v1"
const DB_NAME = "re_media_library_db_v1"
const STORE = "blobs"

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function loadMeta(): MediaItem[] {
  const parsed = safeJsonParse<MediaItem[]>(window.localStorage.getItem(META_KEY))
  return Array.isArray(parsed) ? parsed : []
}

function saveMeta(items: MediaItem[]) {
  window.localStorage.setItem(META_KEY, JSON.stringify(items))
}

function generateId(prefix: string) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function openDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error("Failed to open IndexedDB"))
  })
}

async function putBlob(id: string, blob: Blob) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error("Failed to write blob"))
    }
  })
}

async function getBlob(id: string): Promise<Blob | null> {
  const db = await openDb()
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => {
      db.close()
      resolve((req.result as Blob) || null)
    }
    req.onerror = () => {
      db.close()
      reject(req.error || new Error("Failed to read blob"))
    }
  })
}

async function deleteBlob(id: string) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error("Failed to delete blob"))
    }
  })
}

export async function createThumbnailDataUrl(file: File, maxLongEdgePx: number): Promise<{ dataUrl: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const srcW = bitmap.width
  const srcH = bitmap.height
  const longEdge = Math.max(srcW, srcH)
  const scale = longEdge > maxLongEdgePx ? maxLongEdgePx / longEdge : 1
  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not available")
  ctx.drawImage(bitmap, 0, 0, w, h)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82)
  return { dataUrl, width: srcW, height: srcH }
}

function fallbackThumbnailDataUrl() {
  const canvas = document.createElement("canvas")
  canvas.width = 240
  canvas.height = 180
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  ctx.fillStyle = "#e5e7eb"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#6b7280"
  ctx.font = "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial"
  ctx.fillText("IMAGE", 78, 100)
  return canvas.toDataURL("image/jpeg", 0.8)
}

async function createThumbnailFromBlob(blob: Blob, maxLongEdgePx: number): Promise<{ dataUrl: string; width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(blob)
    const srcW = bitmap.width
    const srcH = bitmap.height
    const longEdge = Math.max(srcW, srcH)
    const scale = longEdge > maxLongEdgePx ? maxLongEdgePx / longEdge : 1
    const w = Math.max(1, Math.round(srcW * scale))
    const h = Math.max(1, Math.round(srcH * scale))

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not available")
    ctx.drawImage(bitmap, 0, 0, w, h)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82)
    return { dataUrl, width: srcW, height: srcH }
  } catch {
    return { dataUrl: fallbackThumbnailDataUrl(), width: 0, height: 0 }
  }
}

export type MediaLibrary = {
  list: () => MediaItem[]
  addFiles: (
    files: File[],
    opts?: { propertyId?: string | null; defaultTags?: string[]; onProgress?: (p: { done: number; total: number }) => void },
  ) => Promise<MediaItem[]>
  addFromUrls: (
    urls: string[],
    opts?: { propertyId?: string | null; onProgress?: (p: { done: number; total: number }) => void },
  ) => Promise<MediaItem[]>
  update: (id: string, update: MediaItemUpdate) => void
  removeMany: (ids: string[]) => Promise<void>
  getBlob: (id: string) => Promise<Blob | null>
}

export function createMediaLibrary(): MediaLibrary {
  return {
    list: () => loadMeta(),
    addFiles: async (files, opts) => {
      const meta = loadMeta()
      const created: MediaItem[] = []
      const candidates = files.filter((f) => f.type.startsWith("image/"))
      const total = candidates.length
      let done = 0

      for (const file of candidates) {
        const id = generateId("m")
        await putBlob(id, file)

        const thumb = await createThumbnailDataUrl(file, 480)
        const item: MediaItem = {
          id,
          filename: file.name,
          mime: file.type || "image/jpeg",
          size: file.size,
          width: thumb.width,
          height: thumb.height,
          takenAt: new Date(file.lastModified || Date.now()).toISOString(),
          createdAt: new Date().toISOString(),
          propertyId: opts?.propertyId ?? null,
          tags: opts?.defaultTags ?? [],
          favorite: false,
          thumbnailDataUrl: thumb.dataUrl,
          note: null,
        }
        created.push(item)
        done += 1
        opts?.onProgress?.({ done, total })
        // yield to keep UI responsive on big batches
        await new Promise((r) => setTimeout(r, 0))
      }

      const next = [...created, ...meta].slice(0, 500)
      saveMeta(next)
      return created
    },
    addFromUrls: async (urls, opts) => {
      const meta = loadMeta()
      const existing = new Set(meta.map((m) => m.sourceUrl).filter(Boolean) as string[])
      const candidates = urls
        .filter(Boolean)
        .filter((u) => !existing.has(u))
        .filter((u) => !u.includes("/placeholder.svg"))
      const total = candidates.length
      let done = 0
      const created: MediaItem[] = []

      for (const url of candidates) {
        const id = generateId("m")
        const res = await fetch(url).catch(() => null)
        const blob = res ? await res.blob().catch(() => null) : null
        if (!blob) continue

        await putBlob(id, blob)

        const thumb = await createThumbnailFromBlob(blob, 480)
        const filenameGuess = url.split("/").pop()?.split("?")[0] || `image_${id}.jpg`
        const item: MediaItem = {
          id,
          filename: filenameGuess,
          mime: blob.type || "image/jpeg",
          size: blob.size,
          width: thumb.width,
          height: thumb.height,
          takenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          propertyId: opts?.propertyId ?? null,
          tags: [],
          favorite: false,
          thumbnailDataUrl: thumb.dataUrl,
          sourceUrl: url,
          note: null,
        }
        created.push(item)
        done += 1
        opts?.onProgress?.({ done, total })
        await new Promise((r) => setTimeout(r, 0))
      }

      const next = [...created, ...meta].slice(0, 500)
      saveMeta(next)
      return created
    },
    update: (id, update) => {
      const meta = loadMeta()
      const next = meta.map((m) => (m.id === id ? { ...m, ...update } : m))
      saveMeta(next)
    },
    removeMany: async (ids) => {
      const meta = loadMeta()
      saveMeta(meta.filter((m) => !ids.includes(m.id)))
      for (const id of ids) {
        await deleteBlob(id)
      }
    },
    getBlob: async (id) => await getBlob(id),
  }
}
