"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MediaItem, MediaItemUpdate } from "@/lib/media/library"
import { createMediaLibrary } from "@/lib/media/library"

const lib = createMediaLibrary()

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([])
  const urlCacheRef = useRef(new Map<string, string>())

  const refresh = useCallback(() => {
    setItems(lib.list())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addFiles = useCallback(async (
    files: File[],
    opts?: { propertyId?: string | null; defaultTags?: string[]; onProgress?: (p: { done: number; total: number }) => void },
  ) => {
    const created = await lib.addFiles(files, opts)
    refresh()
    return created
  }, [refresh])

  const addFromUrls = useCallback(async (
    urls: string[],
    opts?: { propertyId?: string | null; onProgress?: (p: { done: number; total: number }) => void },
  ) => {
    const created = await lib.addFromUrls(urls, opts)
    refresh()
    return created
  }, [refresh])

  const update = useCallback((id: string, update: MediaItemUpdate) => {
    lib.update(id, update)
    refresh()
  }, [refresh])

  const removeMany = useCallback(async (ids: string[]) => {
    // clear cached URLs
    for (const id of ids) {
      const url = urlCacheRef.current.get(id)
      if (url) {
        URL.revokeObjectURL(url)
        urlCacheRef.current.delete(id)
      }
    }
    await lib.removeMany(ids)
    refresh()
  }, [refresh])

  const getObjectUrl = useCallback(async (id: string) => {
    const cached = urlCacheRef.current.get(id)
    if (cached) return cached
    const blob = await lib.getBlob(id)
    if (!blob) return null
    const url = URL.createObjectURL(blob)
    urlCacheRef.current.set(id, url)
    return url
  }, [])

  const getBlob = useCallback(async (id: string) => {
    return await lib.getBlob(id)
  }, [])

  useEffect(() => {
    return () => {
      for (const url of urlCacheRef.current.values()) URL.revokeObjectURL(url)
      urlCacheRef.current.clear()
    }
  }, [])

  const byId = useMemo(() => {
    const map = new Map<string, MediaItem>()
    for (const item of items) map.set(item.id, item)
    return map
  }, [items])

  return { items, byId, refresh, addFiles, addFromUrls, update, removeMany, getObjectUrl, getBlob }
}
