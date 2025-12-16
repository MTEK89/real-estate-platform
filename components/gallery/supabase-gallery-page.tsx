"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { UploadCloud, Trash2, Heart, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useDataStore } from "@/lib/data-store"

type PhotoRow = {
  id: string
  propertyId: string | null
  filename: string
  url: string | null
  createdAt: string
  takenAt: string | null
  tags: string[]
  note: string
  favorite: boolean
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
}

function isFileDrag(dt: DataTransfer | null | undefined) {
  if (!dt) return false
  const types = Array.from(dt.types ?? [])
  return types.includes("Files")
}

export function SupabaseGalleryPage() {
  const { properties } = useDataStore()

  const [photos, setPhotos] = useState<PhotoRow[]>([])
  const [query, setQuery] = useState("")
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [folderFilter, setFolderFilter] = useState<string>("all")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const active = useMemo(() => photos.find((p) => p.id === activeId) || null, [photos, activeId])

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/v1/gallery/photos?propertyId=${encodeURIComponent(propertyFilter)}&folder=${encodeURIComponent(folderFilter)}`,
      )
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(data?.error || "Failed to load photos")
      setPhotos(Array.isArray(data) ? data : [])
      if (!activeId && Array.isArray(data) && data.length) setActiveId(data[0].id)
    } catch (e: any) {
      toast.error(e?.message || "Failed to load photos")
    } finally {
      setIsLoading(false)
    }
  }, [propertyFilter, folderFilter, activeId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return photos
      .filter((p) => (favoritesOnly ? p.favorite : true))
      .filter((p) => {
        if (!q) return true
        const tags = (p.tags || []).join(" ").toLowerCase()
        const note = (p.note || "").toLowerCase()
        return p.filename.toLowerCase().includes(q) || tags.includes(q) || note.includes(q)
      })
  }, [photos, favoritesOnly, query])

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      setIsUploading(true)
      try {
        const form = new FormData()
        if (propertyFilter !== "all") form.set("propertyId", propertyFilter)
        // Default manual uploads to "Property" when a property is selected, otherwise "Gallery".
        if (folderFilter !== "all") form.set("tags", JSON.stringify([`folder:${folderFilter}`]))
        for (const f of files) form.append("files", f)

        const res = await fetch("/api/v1/gallery/upload", { method: "POST", body: form })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Upload failed")
        toast.success(`Uploaded ${data?.created?.length ?? ""} photo(s)`)
        await load()
      } catch (e: any) {
        toast.error(e?.message || "Upload failed")
      } finally {
        setIsUploading(false)
      }
    },
    [propertyFilter, folderFilter, load],
  )

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (!isFileDrag(e.dataTransfer)) return
      const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"))
      await uploadFiles(files)
    },
    [uploadFiles],
  )

  const toggleFavorite = useCallback(async () => {
    if (!active) return
    const res = await fetch("/api/v1/gallery/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: active.id, favorite: !active.favorite }),
    })
    if (res.ok) await load()
  }, [active, load])

  const saveMeta = useCallback(async () => {
    if (!active) return
    const res = await fetch("/api/v1/gallery/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: active.id,
        propertyId: active.propertyId ?? null,
        note: active.note,
        tags: active.tags,
        takenAt: active.takenAt ?? null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) toast.error(data?.error || "Save failed")
    else toast.success("Saved")
  }, [active])

  const deleteActive = useCallback(async () => {
    if (!active) return
    const res = await fetch(`/api/v1/gallery/photos?id=${encodeURIComponent(active.id)}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data?.error || "Delete failed")
      return
    }
    toast.success("Deleted")
    setActiveId(null)
    await load()
  }, [active, load])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Photos</CardTitle>
          <CardDescription>Browse and organize photos by folder and property.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" />
              </div>
              <Select value={folderFilter} onValueChange={setFolderFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All folders</SelectItem>
                  <SelectItem value="property">Property photos</SelectItem>
                  <SelectItem value="ai_headshots">AI headshots</SelectItem>
                  <SelectItem value="ai_photo_tools">AI photo tools</SelectItem>
                  <SelectItem value="watermark">Watermarked</SelectItem>
                  <SelectItem value="gallery">Unsorted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All properties</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.reference} — {p.address.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant={favoritesOnly ? "default" : "outline"} onClick={() => setFavoritesOnly((v) => !v)}>
                <Heart className="mr-2 h-4 w-4" />
                Favorites
              </Button>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void uploadFiles(Array.from(e.target.files || []))}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </div>

          <div
            onDragEnter={(e) => {
              e.preventDefault()
              if (!isFileDrag(e.dataTransfer)) return
              setIsDragging(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (!isFileDrag(e.dataTransfer)) return
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragging(false)
            }}
            onDrop={onDrop}
            className={[
              "rounded-md border border-dashed p-4 transition-colors",
              isDragging ? "bg-muted/30" : "bg-transparent",
            ].join(" ")}
          >
            <div className="text-sm text-muted-foreground">Drag & drop photos here (or use Upload).</div>
          </div>

          {isLoading ? (
            <div className="rounded-md border bg-muted/20 p-6 text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveId(p.id)}
                  className={[
                    "group overflow-hidden rounded-md border bg-muted/20 hover:bg-muted/30",
                    p.id === activeId ? "ring-2 ring-primary" : "",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url || "/placeholder.svg"} alt={p.filename} className="h-28 w-full object-cover sm:h-32" />
                  <div className="p-2">
                    <div className="truncate text-xs font-medium">{p.filename}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{formatDateShort(p.takenAt || p.createdAt)}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.favorite ? <Badge variant="secondary">Fav</Badge> : null}
                      {p.propertyId ? <Badge variant="secondary">Linked</Badge> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-muted/20 p-6 text-sm text-muted-foreground">No photos yet.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Edit metadata and download later (signed URLs).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!active ? (
            <div className="rounded-md border bg-muted/20 p-6 text-sm text-muted-foreground">Select a photo.</div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-md border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={active.url || "/placeholder.svg"} alt={active.filename} className="h-auto w-full object-contain" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant={active.favorite ? "default" : "outline"} size="sm" onClick={() => void toggleFavorite()}>
                  <Heart className="mr-2 h-4 w-4" />
                  {active.favorite ? "Favorited" : "Favorite"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => void deleteActive()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Assigned property</Label>
                <Select
                  value={active.propertyId || "none"}
                  onValueChange={(v) =>
                    setPhotos((prev) => prev.map((x) => (x.id === active.id ? { ...x, propertyId: v === "none" ? null : v } : x)))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.reference} — {p.address.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={(active.tags || []).join(", ")}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                    setPhotos((prev) => prev.map((x) => (x.id === active.id ? { ...x, tags } : x)))
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={active.note || ""}
                  onChange={(e) => setPhotos((prev) => prev.map((x) => (x.id === active.id ? { ...x, note: e.target.value } : x)))}
                />
              </div>

              <Button onClick={() => void saveMeta()} className="w-full">
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
