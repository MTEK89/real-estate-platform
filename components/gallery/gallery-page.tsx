"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import JSZip from "jszip"
import { toast } from "sonner"
import {
  Download,
  Filter,
  Heart,
  Image as ImageIcon,
  Home,
  Plus,
  Search,
  Tag,
  Trash2,
  UploadCloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useMediaLibrary } from "@/hooks/use-media-library"
import { useDataStore } from "@/lib/data-store"
import { getFilesFromDataTransfer } from "@/lib/media/drop"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeBaseName(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 80) || "image"
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

export function GalleryPage() {
  const { properties, contacts, addContact, addProperty, updateProperty } = useDataStore()
  const { items, addFiles, addFromUrls, update, removeMany, getObjectUrl, getBlob } = useMediaLibrary()

  const [query, setQuery] = useState("")
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState("")
  const [noteDraft, setNoteDraft] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)
  const [showAttachDialog, setShowAttachDialog] = useState(false)
  const [attachMode, setAttachMode] = useState<"new" | "existing" | "none">("new")
  const [attachExistingPropertyId, setAttachExistingPropertyId] = useState<string>("")

  // Quick property create
  const [newPropertyType, setNewPropertyType] = useState<"house" | "apartment" | "office" | "retail" | "land">("apartment")
  const [newStreet, setNewStreet] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newPostal, setNewPostal] = useState("")
  const [newCountry, setNewCountry] = useState("Luxembourg")
  const [newPrice, setNewPrice] = useState("")
  const [ownerMode, setOwnerMode] = useState<"existing" | "new">("existing")
  const [existingOwnerId, setExistingOwnerId] = useState("")
  const [ownerFirst, setOwnerFirst] = useState("")
  const [ownerLast, setOwnerLast] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [ownerPhone, setOwnerPhone] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isBulk = selectedIds.length > 0

  const owners = useMemo(() => contacts.filter((c) => c.type === "seller" || c.type === "investor"), [contacts])

  const dragDepthRef = useRef(0)
  const propertyFilterRef = useRef(propertyFilter)
  const importFilesRef = useRef<(files: File[], propertyId: string | null) => Promise<void>>(async () => {})

  const [bulkAssignPropertyId, setBulkAssignPropertyId] = useState<string>("")
  const [isSyncingPropertyImages, setIsSyncingPropertyImages] = useState(false)
  const [autoSyncedPropertyIds, setAutoSyncedPropertyIds] = useState<Record<string, true>>({})

  useEffect(() => {
    propertyFilterRef.current = propertyFilter
  }, [propertyFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((i) => (propertyFilter === "all" ? true : i.propertyId === propertyFilter))
      .filter((i) => (favoritesOnly ? i.favorite : true))
      .filter((i) => {
        if (!q) return true
        const tags = i.tags.join(" ").toLowerCase()
        const note = (i.note ?? "").toLowerCase()
        return i.filename.toLowerCase().includes(q) || tags.includes(q) || note.includes(q)
      })
  }, [items, propertyFilter, favoritesOnly, query])

  const selectedProperty = useMemo(
    () => (propertyFilter === "all" ? null : properties.find((p) => p.id === propertyFilter) ?? null),
    [properties, propertyFilter],
  )

  const selectedPropertyHasImages = Boolean(selectedProperty?.images?.length)
  const selectedPropertyGalleryCount = useMemo(
    () => (propertyFilter === "all" ? 0 : items.filter((i) => i.propertyId === propertyFilter).length),
    [items, propertyFilter],
  )

  const active = useMemo(() => filtered.find((i) => i.id === activeId) ?? null, [filtered, activeId])

  useEffect(() => {
    if (!activeId && filtered.length) setActiveId(filtered[0]!.id)
    if (activeId && !filtered.some((i) => i.id === activeId)) {
      setActiveId(filtered[0]?.id ?? null)
    }
  }, [activeId, filtered])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!activeId) {
        setActiveUrl(null)
        return
      }
      const url = await getObjectUrl(activeId)
      if (!cancelled) setActiveUrl(url)
    })()
    return () => {
      cancelled = true
    }
  }, [activeId, getObjectUrl])

  useEffect(() => {
    setTagDraft(active?.tags.join(", ") ?? "")
  }, [active?.id])

  useEffect(() => {
    setNoteDraft(active?.note ?? "")
  }, [active?.id])

  const [takenDateDraft, setTakenDateDraft] = useState("")
  useEffect(() => {
    if (!active?.takenAt) {
      setTakenDateDraft("")
      return
    }
    const d = new Date(active.takenAt)
    if (Number.isNaN(d.getTime())) {
      setTakenDateDraft("")
      return
    }
    setTakenDateDraft(d.toISOString().slice(0, 10))
  }, [active?.id])

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    const fileArray = Array.from(files)
    if (propertyFilter === "all") {
      setPendingFiles(fileArray)
      setAttachMode("new")
      setShowAttachDialog(true)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    await importFiles(fileArray, propertyFilter)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const importFiles = async (files: File[], propertyId: string | null) => {
    toast.info("Importing photos…")
    setImportProgress({ done: 0, total: files.length })
    try {
      await addFiles(files, {
        propertyId,
        onProgress: (p) => setImportProgress(p),
      })
      toast.success("Photos imported.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed.")
    } finally {
      setImportProgress(null)
    }
  }

  useEffect(() => {
    importFilesRef.current = importFiles
  }, [importFiles])

  const syncSelectedPropertyImages = async () => {
    if (!selectedProperty || !selectedProperty.images?.length) return
    setIsSyncingPropertyImages(true)
    toast.info("Syncing property images…")
    try {
      setImportProgress({ done: 0, total: selectedProperty.images.length })
      await addFromUrls(selectedProperty.images, {
        propertyId: selectedProperty.id,
        onProgress: (p) => setImportProgress(p),
      })
      toast.success("Property images added to Gallery.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed.")
    } finally {
      setImportProgress(null)
      setIsSyncingPropertyImages(false)
    }
  }

  // Remember which properties we already auto-synced to avoid repeated fetches.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("re_gallery_auto_sync_v1")
      if (!raw) return
      const parsed = JSON.parse(raw) as Record<string, true>
      if (parsed && typeof parsed === "object") setAutoSyncedPropertyIds(parsed)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem("re_gallery_auto_sync_v1", JSON.stringify(autoSyncedPropertyIds))
    } catch {
      // ignore
    }
  }, [autoSyncedPropertyIds])

  // Auto-sync: if a property has images but none in Gallery, import automatically once per property.
  useEffect(() => {
    if (!selectedProperty) return
    if (!selectedProperty.images?.length) return
    if (selectedPropertyGalleryCount > 0) return
    if (isSyncingPropertyImages) return
    if (autoSyncedPropertyIds[selectedProperty.id]) return

    setAutoSyncedPropertyIds((prev) => ({ ...prev, [selectedProperty.id]: true }))
    void syncSelectedPropertyImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty?.id, selectedPropertyGalleryCount, isSyncingPropertyImages])

  const handleDataTransfer = async (dt: DataTransfer) => {
    const files = await getFilesFromDataTransfer(dt)
    if (!files.length) {
      toast.error("No files detected.")
      return
    }
    const currentFilter = propertyFilterRef.current
    if (currentFilter === "all") {
      setPendingFiles(files)
      setAttachMode("new")
      setShowAttachDialog(true)
      return
    }
    await importFilesRef.current(files, currentFilter)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    await handleDataTransfer(e.dataTransfer)
  }

  // Global drag/drop: allow dropping anywhere and prevent browser from opening the image.
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return
      dragDepthRef.current += 1
      setIsDragging(true)
    }
    const onDragOver = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return
      e.preventDefault()
      setIsDragging(true)
    }
    const onDragLeave = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
      if (dragDepthRef.current === 0 || e.relatedTarget === null) setIsDragging(false)
    }
    const onDrop = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return
      e.preventDefault()
      dragDepthRef.current = 0
      setIsDragging(false)
      if (!e.dataTransfer) return
      void handleDataTransfer(e.dataTransfer)
    }

    window.addEventListener("dragenter", onDragEnter)
    window.addEventListener("dragover", onDragOver)
    window.addEventListener("dragleave", onDragLeave)
    window.addEventListener("drop", onDrop)
    return () => {
      window.removeEventListener("dragenter", onDragEnter)
      window.removeEventListener("dragover", onDragOver)
      window.removeEventListener("dragleave", onDragLeave)
      window.removeEventListener("drop", onDrop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectAllFiltered = () => setSelectedIds(filtered.map((f) => f.id))
  const clearSelection = () => setSelectedIds([])

  const bulkAssignToProperty = () => {
    if (!selectedIds.length) return
    const pid = bulkAssignPropertyId || null
    for (const id of selectedIds) update(id, { propertyId: pid })
    toast.success(pid ? "Selected photos assigned." : "Selected photos unassigned.")
  }

  const bulkDelete = async () => {
    if (!selectedIds.length) return
    if (!confirm(`Delete ${selectedIds.length} photo(s)?`)) return
    await removeMany(selectedIds)
    clearSelection()
    toast.success("Deleted.")
  }

  const bulkDownloadZip = async () => {
    if (!selectedIds.length) return
    toast.info("Preparing ZIP…")
    try {
      const zip = new JSZip()
      for (const id of selectedIds) {
        const item = items.find((i) => i.id === id)
        if (!item) continue
        const blob = await getBlob(id)
        if (!blob) continue
        const ext = item.mime.includes("png") ? "png" : item.mime.includes("webp") ? "webp" : "jpg"
        zip.file(`${safeBaseName(item.filename)}.${ext}`, blob)
      }
      const zipBlob = await zip.generateAsync({ type: "blob" })
      downloadBlob(zipBlob, `gallery_${Date.now()}.zip`)
      toast.success("ZIP downloaded.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ZIP failed.")
    }
  }

  const setAsCover = async () => {
    if (!active) return
    if (!active.propertyId) {
      toast.error("Assign this photo to a property first.")
      return
    }
    // Use the thumbnail for now (fast + keeps property cards lightweight)
    updateProperty(active.propertyId, { images: [active.thumbnailDataUrl] })
    toast.success("Set as property cover.")
  }

  const saveTags = () => {
    if (!active) return
    const tags = tagDraft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12)
    update(active.id, { tags })
    toast.success("Tags saved.")
  }

  const saveNote = () => {
    if (!active) return
    update(active.id, { note: noteDraft.trim() || null })
    toast.success("Note saved.")
  }

  const toggleFavorite = () => {
    if (!active) return
    update(active.id, { favorite: !active.favorite })
  }

  const assignActiveToProperty = (propertyId: string | null) => {
    if (!active) return
    update(active.id, { propertyId })
    toast.success(propertyId ? "Assigned to property." : "Unassigned from property.")
  }

  const resetAttachDialog = () => {
    setPendingFiles(null)
    setShowAttachDialog(false)
    setAttachExistingPropertyId("")
    setNewPropertyType("apartment")
    setNewStreet("")
    setNewCity("")
    setNewPostal("")
    setNewCountry("Luxembourg")
    setNewPrice("")
    setOwnerMode("existing")
    setExistingOwnerId("")
    setOwnerFirst("")
    setOwnerLast("")
    setOwnerEmail("")
    setOwnerPhone("")
  }

  useEffect(() => {
    if (!showAttachDialog) return
    if (attachMode !== "new") return
    if (owners.length === 0) setOwnerMode("new")
  }, [showAttachDialog, attachMode, owners.length])

  const handleConfirmAttach = async () => {
    if (!pendingFiles?.length) return

    if (attachMode === "none") {
      await importFiles(pendingFiles, null)
      resetAttachDialog()
      return
    }

    if (attachMode === "existing") {
      if (!attachExistingPropertyId) {
        toast.error("Select a property.")
        return
      }
      await importFiles(pendingFiles, attachExistingPropertyId)
      setPropertyFilter(attachExistingPropertyId)
      resetAttachDialog()
      return
    }

    // attachMode === "new"
    if (!newStreet.trim() || !newCity.trim()) {
      toast.error("Street and city are required.")
      return
    }

    let ownerId = existingOwnerId
    if (ownerMode === "new") {
      if (!ownerFirst.trim() || !ownerLast.trim()) {
        toast.error("Owner first & last name are required.")
        return
      }
      const newOwner = addContact({
        type: "seller",
        firstName: ownerFirst.trim(),
        lastName: ownerLast.trim(),
        email: ownerEmail.trim() || null,
        phone: ownerPhone.trim() || null,
        source: "gallery",
        status: "new",
        assignedTo: null,
        tags: [],
        notes: "",
        lastContactAt: null,
      })
      ownerId = newOwner.id
    } else if (!ownerId) {
      // Create a placeholder owner to avoid blocking fast flows
      const placeholder = addContact({
        type: "seller",
        firstName: "Owner",
        lastName: "TBD",
        email: null,
        phone: null,
        source: "gallery",
        status: "new",
        assignedTo: null,
        tags: ["tbd"],
        notes: "Created automatically from Gallery upload.",
        lastContactAt: null,
      })
      ownerId = placeholder.id
    }

    const reference = `PROP-${Date.now().toString(36).toUpperCase()}`
    const created = addProperty({
      reference,
      status: "draft",
      type: newPropertyType,
      address: {
        street: newStreet.trim(),
        city: newCity.trim(),
        postalCode: newPostal.trim(),
        country: newCountry.trim() || "Luxembourg",
      },
      characteristics: {
        surface: 0,
        rooms: 0,
        bedrooms: 0,
        bathrooms: 0,
        condition: "Good",
      },
      price: Number.parseFloat(newPrice) || 0,
      ownerId,
      tags: [],
      images: [],
    })

    setPropertyFilter(created.id)
    await importFiles(pendingFiles, created.id)
    resetAttachDialog()
    toast.success(`Property ${reference} created and photos attached.`)
  }

  return (
    <div className="relative grid gap-6 lg:grid-cols-2">
      {isDragging ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onDragOver={(e) => {
            if (!isFileDrag(e.dataTransfer)) return
            e.preventDefault()
          }}
          onDrop={(e) => void handleDrop(e as any)}
        >
          <div className="mx-4 w-full max-w-lg rounded-lg border bg-card p-6 text-center shadow-lg">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="mt-3 text-base font-medium">Drop photos to import</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {propertyFilter === "all" ? "You’ll choose (or create) a property next." : "They’ll be attached to the selected property."}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
            <CardDescription>All your photos in one place—upload, tag, favorite, and attach to a property.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={[
                "relative rounded-lg border-2 border-dashed p-4 transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/10",
              ].join(" ")}
              onDragOver={(e) => {
                if (!isFileDrag(e.dataTransfer)) return
                e.preventDefault()
              }}
              onDrop={(e) => void handleDrop(e)}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <UploadCloud className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Drag & drop photos (or folders)</div>
                    <div className="text-xs text-muted-foreground">
                      Drops folders in Chrome-based browsers. If no property is selected, you'll be asked to create one.
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => void handleUpload(e.target.files)}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPendingFiles([])
                      setAttachMode("new")
                      setShowAttachDialog(true)
                    }}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    New property
                  </Button>
                </div>
              </div>

              {importProgress ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  Importing… {importProgress.done}/{importProgress.total}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="w-full space-y-2">
                <Label htmlFor="gallery-property">Property</Label>
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger id="gallery-property">
                    <SelectValue placeholder="Filter by property" />
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
              </div>

              <div className="w-full space-y-2">
                <Label htmlFor="gallery-search">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="gallery-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by filename or tag…"
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                variant={favoritesOnly ? "default" : "outline"}
                onClick={() => setFavoritesOnly((v) => !v)}
                className="shrink-0"
              >
                <Heart className="mr-2 h-4 w-4" />
                Favorites
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                {filtered.length} photo(s)
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={selectAllFiltered} disabled={!filtered.length}>
                  Select all
                </Button>
                <Button variant="outline" onClick={clearSelection} disabled={!isBulk}>
                  Clear
                </Button>
              </div>
            </div>

            {propertyFilter !== "all" && selectedPropertyHasImages && selectedPropertyGalleryCount === 0 ? (
              <div className="flex flex-col gap-2 rounded-md border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  {isSyncingPropertyImages
                    ? "Syncing property images into Gallery…"
                    : "This property has images, syncing them into Gallery…"}
                  <div className="text-xs text-muted-foreground">
                    Once synced, you can tag/favorite and download them from here.
                  </div>
                </div>
                <Button variant="outline" onClick={() => void syncSelectedPropertyImages()} disabled={isSyncingPropertyImages}>
                  {isSyncingPropertyImages ? "Syncing…" : "Sync now"}
                </Button>
              </div>
            ) : null}

            {isBulk ? (
              <div className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <span className="font-medium">{selectedIds.length}</span> selected
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Select value={bulkAssignPropertyId || "none"} onValueChange={(v) => setBulkAssignPropertyId(v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9 w-[220px]">
                        <SelectValue placeholder="Assign to property" />
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
                    <Button size="sm" variant="outline" onClick={bulkAssignToProperty}>
                      Assign
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void bulkDownloadZip()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download ZIP
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => void bulkDelete()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : null}

            {filtered.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filtered.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setActiveId(m.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setActiveId(m.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={[
                      "group relative overflow-hidden rounded-md border bg-muted/20 text-left hover:bg-muted/30",
                      m.id === activeId ? "ring-2 ring-primary" : "",
                    ].join(" ")}
                  >
                    <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.includes(m.id)}
                        onCheckedChange={() => toggleSelect(m.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {m.favorite ? (
                        <div className="rounded bg-background/80 p-1">
                          <Heart className="h-3.5 w-3.5 fill-current text-red-500" />
                        </div>
                      ) : null}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumbnailDataUrl} alt={m.filename} className="h-28 w-full object-cover sm:h-32" />
                    <div className="p-2">
                      <div className="truncate text-xs font-medium">{m.filename}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{formatDateShort(m.takenAt || m.createdAt)}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.tags.slice(0, 2).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                        {m.tags.length > 2 ? (
                          <Badge variant="secondary" className="text-[10px]">
                            +{m.tags.length - 2}
                          </Badge>
                        ) : null}
                      </div>
                      {m.note ? <div className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">{m.note}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border bg-muted/20 p-8 text-sm text-muted-foreground">
                No photos found. Upload some images to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>View details, set cover, and tag photos for fast reuse.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {active && activeUrl ? (
            <>
              <div className="relative overflow-hidden rounded-md border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeUrl} alt={active.filename} className="h-auto w-full object-contain" />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{active.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {active.width}×{active.height} • {(active.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className="text-xs text-muted-foreground">Photo date: {formatDateShort(active.takenAt || active.createdAt)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={active.favorite ? "default" : "outline"} size="sm" onClick={toggleFavorite}>
                    <Heart className="mr-2 h-4 w-4" />
                    {active.favorite ? "Favorited" : "Favorite"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void bulkDownloadZip()} disabled={!selectedIds.length}>
                    <Download className="mr-2 h-4 w-4" />
                    ZIP selected
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gallery-assign">Assigned property</Label>
                  <Select value={active.propertyId ?? "none"} onValueChange={(v) => assignActiveToProperty(v === "none" ? null : v)}>
                    <SelectTrigger id="gallery-assign">
                      <SelectValue placeholder="Assign to a property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.reference} — {p.address.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cover</Label>
                  <Button variant="outline" onClick={setAsCover} disabled={!active.propertyId}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Set as property cover
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery-date">Photo date</Label>
                <div className="flex gap-2">
                  <Input
                    id="gallery-date"
                    type="date"
                    value={takenDateDraft}
                    onChange={(e) => setTakenDateDraft(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!active) return
                      if (!takenDateDraft) {
                        toast.error("Pick a date.")
                        return
                      }
                      const iso = new Date(`${takenDateDraft}T12:00:00.000Z`).toISOString()
                      update(active.id, { takenAt: iso })
                      toast.success("Date saved.")
                    }}
                  >
                    Save
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Defaults to the file’s modified date; adjust if you need the shoot date.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery-tags">Tags</Label>
                <div className="flex gap-2">
                  <Input id="gallery-tags" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="kitchen, exterior, living-room" />
                  <Button variant="outline" onClick={saveTags}>
                    <Tag className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Comma-separated. Use tags like: exterior, living-room, kitchen, bedroom, bathroom.</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery-note">Notes (optional)</Label>
                <Textarea
                  id="gallery-note"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onBlur={() => {
                    if (!active) return
                    const normalized = noteDraft.trim() || null
                    if ((active.note ?? null) === normalized) return
                    update(active.id, { note: normalized })
                  }}
                  placeholder="e.g. main hero shot for brochure"
                  className="min-h-[90px]"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Saved per photo for internal notes (not exported).</span>
                  <Button variant="outline" size="sm" onClick={saveNote} disabled={!active}>
                    Save
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
              Select a photo to preview.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAttachDialog} onOpenChange={(open) => (open ? setShowAttachDialog(true) : resetAttachDialog())}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Attach photos to a property</DialogTitle>
            <DialogDescription>
              Create a new property in draft mode while importing photos, or attach to an existing one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attach-mode">Destination</Label>
              <Select value={attachMode} onValueChange={(v) => setAttachMode(v as "new" | "existing" | "none")}>
                <SelectTrigger id="attach-mode">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create new property (recommended)</SelectItem>
                  <SelectItem value="existing">Attach to existing property</SelectItem>
                  <SelectItem value="none">No property (import to inbox)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {attachMode === "existing" ? (
              <div className="space-y-2">
                <Label htmlFor="attach-existing">Property</Label>
                <Select value={attachExistingPropertyId} onValueChange={setAttachExistingPropertyId}>
                  <SelectTrigger id="attach-existing">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.reference} — {p.address.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {attachMode === "new" ? (
              <div className="space-y-4 rounded-md border bg-muted/10 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-type">Property type</Label>
                    <Select value={newPropertyType} onValueChange={(v) => setNewPropertyType(v as any)}>
                      <SelectTrigger id="new-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-price">Price (optional)</Label>
                    <Input id="new-price" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-street">Street *</Label>
                  <Input id="new-street" value={newStreet} onChange={(e) => setNewStreet(e.target.value)} placeholder="123 Main St" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-city">City *</Label>
                    <Input id="new-city" value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Luxembourg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-postal">Postal code</Label>
                    <Input id="new-postal" value={newPostal} onChange={(e) => setNewPostal(e.target.value)} placeholder="L-1234" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-country">Country</Label>
                    <Input id="new-country" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="Luxembourg" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="owner-mode">Owner</Label>
                    <Select value={ownerMode} onValueChange={(v) => setOwnerMode(v as "existing" | "new")}>
                      <SelectTrigger id="owner-mode">
                        <SelectValue placeholder="Select owner mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">Select existing owner</SelectItem>
                        <SelectItem value="new">Create new owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {ownerMode === "existing" ? (
                    <div className="space-y-2">
                      <Label htmlFor="owner-existing">Existing owner (optional)</Label>
                      <Select value={existingOwnerId || "none"} onValueChange={(v) => setExistingOwnerId(v === "none" ? "" : v)}>
                        <SelectTrigger id="owner-existing">
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Owner TBD</SelectItem>
                          {owners.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.firstName} {o.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                {ownerMode === "new" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="owner-first">First name *</Label>
                      <Input id="owner-first" value={ownerFirst} onChange={(e) => setOwnerFirst(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-last">Last name *</Label>
                      <Input id="owner-last" value={ownerLast} onChange={(e) => setOwnerLast(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-email">Email</Label>
                      <Input id="owner-email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-phone">Phone</Label>
                      <Input id="owner-phone" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetAttachDialog}>
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmAttach()}>
              {pendingFiles && pendingFiles.length ? `Import ${pendingFiles.length} file(s)` : "Create property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
