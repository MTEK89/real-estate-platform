"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import JSZip from "jszip"
import { toast } from "sonner"
import { Download, Image as ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { WatermarkOptions, WatermarkPosition } from "@/lib/watermark"
import { applyWatermarkToImage } from "@/lib/watermark"
import { useDataStore } from "@/lib/data-store"

type SourceImage = {
  id: string
  file: File
  url: string
  dataUrl?: string // Base64 data URL as fallback
}

function safeBaseName(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 80) || "image"
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

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

async function fileToBitmap(file: File) {
  return await createImageBitmap(file)
}

export function WatermarkTool() {
  const { properties } = useDataStore()

  const [images, setImages] = useState<SourceImage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const [usage, setUsage] = useState<"marketing" | "mls">("marketing")
  const [preset, setPreset] = useState<"subtle_corner" | "visible_corner" | "diagonal_protection">("subtle_corner")

  const [options, setOptions] = useState<WatermarkOptions>(() => ({
    mode: "logo",
    position: "bottom_right",
    paddingPx: 24,
    opacity: 0.25,
    rotationDeg: 0,
    scalePct: 14,
    text: "",
    textSizePx: 44,
    textColor: "#ffffff",
    tile: false,
    tileGapPct: 22,
    maxLongEdgePx: null,
    outputFormat: "image/jpeg",
    jpegQuality: 0.9,
  }))

  const inputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(() => images.find((i) => i.id === selectedId) ?? null, [images, selectedId])

  useEffect(() => {
    return () => {
      // Cleanup URLs when component unmounts only
      for (const img of images) URL.revokeObjectURL(img.url)
      if (logoUrl) URL.revokeObjectURL(logoUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    // Generate both blob URLs and base64 data URLs for each image
    const additions: SourceImage[] = (
      await Promise.all(
        files
          .filter((f) => f.type.startsWith("image/"))
          .map(async (file) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
            try {
              console.log('Converting file to data URL:', file.name);
              const dataUrl = await fileToDataUrl(file)
              console.log('Successfully converted file to data URL:', file.name, 'length:', dataUrl.length);
              return {
                id,
                file,
                url: URL.createObjectURL(file),
                dataUrl, // Base64 required
              }
            } catch (error) {
              console.error('Failed to convert file to data URL:', file.name, error)
              // Create a minimal 1x1 transparent placeholder if conversion fails
              return {
                id,
                file,
                url: URL.createObjectURL(file),
                dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
              }
            }
          })
      )
    ).filter(Boolean)

    setImages((prev) => {
      const next = [...prev, ...additions]
      console.log('Images set:', next.map(img => ({
        name: img.file.name,
        hasDataUrl: !!img.dataUrl,
        dataUrlLength: img.dataUrl?.length || 0,
        url: img.url
      })));
      if (!selectedId && next.length) setSelectedId(next[0]!.id)
      return next
    })
    toast.success(`${additions.length} image(s) added.`)

    if (inputRef.current) inputRef.current.value = ""
  }

  const handleRemoveAll = () => {
    for (const img of images) URL.revokeObjectURL(img.url)
    setImages([])
    setSelectedId(null)
  }

  const handleRemoveSelected = () => {
    if (!selected) return
    URL.revokeObjectURL(selected.url)
    setImages((prev) => prev.filter((i) => i.id !== selected.id))
    setSelectedId((prev) => {
      if (prev !== selected.id) return prev
      const remaining = images.filter((i) => i.id !== selected.id)
      return remaining[0]?.id ?? null
    })
  }

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Logo must be an image.")
      return
    }
    if (logoUrl) URL.revokeObjectURL(logoUrl)
    setLogoFile(file)
    setLogoUrl(URL.createObjectURL(file))
    toast.success("Logo added.")
    if (logoInputRef.current) logoInputRef.current.value = ""
  }

  const handleClearLogo = () => {
    if (logoUrl) URL.revokeObjectURL(logoUrl)
    setLogoUrl(null)
    setLogoFile(null)
  }

  // Apply presets (best-practice defaults for real-estate marketing)
  useEffect(() => {
    if (usage === "mls") return
    setOptions((prev) => {
      switch (preset) {
        case "visible_corner":
          return {
            ...prev,
            tile: false,
            rotationDeg: 0,
            position: "bottom_right",
            paddingPx: 28,
            opacity: 0.32,
            scalePct: 26,
          }
        case "diagonal_protection":
          return {
            ...prev,
            tile: true,
            rotationDeg: -25,
            opacity: 0.14,
            scalePct: 14,
            tileGapPct: 22,
          }
        case "subtle_corner":
        default:
          return {
            ...prev,
            tile: false,
            rotationDeg: 0,
            position: "bottom_right",
            paddingPx: 28,
            opacity: 0.22,
            scalePct: 18,
          }
      }
    })
  }, [preset, usage])

  useEffect(() => {
    // MLS compliance varies by MLS. Many prohibit branding/watermarks on listing photos.
    // We default to disabling the watermark for MLS usage to avoid accidental violations.
    if (usage !== "mls") return
    setOptions((prev) => ({
      ...prev,
      opacity: 0.0,
      tile: false,
      rotationDeg: 0,
      position: "bottom_right",
    }))
  }, [usage])

  const outputExt = useMemo(() => {
    if (options.outputFormat === "image/png") return "png"
    if (options.outputFormat === "image/webp") return "webp"
    return "jpg"
  }, [options.outputFormat])

  const processOne = async (img: SourceImage) => {
    const baseBitmap = await fileToBitmap(img.file)
    const logoBitmap = logoFile ? await fileToBitmap(logoFile) : null
    const blob = await applyWatermarkToImage({ image: baseBitmap, logo: logoBitmap, options })
    return blob
  }

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const generatePreview = async () => {
      if (!selected) {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        return
      }

      if ((options.mode === "logo" || options.mode === "both") && !logoFile) {
        // Still show base image, but no watermark preview possible without logo.
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        return
      }

      setIsPreviewing(true)
      try {
        const baseBitmap = await fileToBitmap(selected.file)
        const logoBitmap = logoFile ? await fileToBitmap(logoFile) : null

        const previewBlob = await applyWatermarkToImage({
          image: baseBitmap,
          logo: logoBitmap,
          options: {
            ...options,
            // keep preview snappy and memory-friendly
            maxLongEdgePx: options.maxLongEdgePx ?? 1600,
            outputFormat: "image/jpeg",
            jpegQuality: 0.85,
          },
        })

        if (cancelled) return
        const nextUrl = URL.createObjectURL(previewBlob)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return nextUrl
        })
      } catch {
        if (!cancelled) {
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
        }
      } finally {
        if (!cancelled) setIsPreviewing(false)
      }
    }

    timer = setTimeout(() => {
      void generatePreview()
    }, 250)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [selected?.id, selected?.file, logoFile, options, selected])

  const handleDownloadSelected = async () => {
    if (!selected) {
      toast.error("Select an image first.")
      return
    }
    if (usage === "mls") {
      toast.error("MLS mode is enabled. Many MLS systems forbid logos/watermarks on listing photos.")
      return
    }
    if ((options.mode === "logo" || options.mode === "both") && !logoFile) {
      toast.error("Add a logo first (or switch to text-only).")
      return
    }
    setIsProcessing(true)
    try {
      const blob = await processOne(selected)
      downloadBlob(blob, `${safeBaseName(selected.file.name)}-watermarked.${outputExt}`)
      toast.success("Downloaded.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process image.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadAllZip = async () => {
    if (!images.length) {
      toast.error("Add images first.")
      return
    }
    if (usage === "mls") {
      toast.error("MLS mode is enabled. Many MLS systems forbid logos/watermarks on listing photos.")
      return
    }
    if ((options.mode === "logo" || options.mode === "both") && !logoFile) {
      toast.error("Add a logo first (or switch to text-only).")
      return
    }

    setIsProcessing(true)
    toast.info("Processing images…")

    try {
      const processedBlobs: { blob: Blob; filename: string }[] = []

      // Process all images
      for (const img of images) {
        const blob = await processOne(img)
        const filename = `${safeBaseName(img.file.name)}-watermarked.${outputExt}`
        processedBlobs.push({ blob, filename })
      }

      // Create ZIP
      const zip = new JSZip()
      for (const { blob, filename } of processedBlobs) {
        zip.file(filename, blob)
      }
      const zipBlob = await zip.generateAsync({ type: "blob" })
      downloadBlob(zipBlob, `watermarked_images_${Date.now()}.zip`)

      // Also save to gallery (in background, don't block download)
      toast.info("Saving to gallery…")
      const form = new FormData()
      for (const { blob, filename } of processedBlobs) {
        const file = new File([blob], filename, { type: options.outputFormat })
        form.append("files", file)
      }
      form.append("tags", JSON.stringify(["folder:watermark"]))
      if (selectedPropertyId) {
        form.append("propertyId", selectedPropertyId)
      }

      const res = await fetch("/api/v1/gallery/upload", { method: "POST", body: form })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.success(`ZIP downloaded. ${data?.created?.length ?? images.length} image(s) saved to gallery!`)
      } else {
        toast.warning("ZIP downloaded, but failed to save to gallery.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process images.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveToGallery = async () => {
    if (!selected) {
      toast.error("Select an image first.")
      return
    }
    if ((options.mode === "logo" || options.mode === "both") && !logoFile) {
      toast.error("Add a logo first (or switch to text-only).")
      return
    }

    setIsSaving(true)
    try {
      // 1. Process image
      const blob = await processOne(selected)

      // 2. Create File object with proper name
      const filename = `${safeBaseName(selected.file.name)}-watermarked.${outputExt}`
      const file = new File([blob], filename, { type: options.outputFormat })

      // 3. Create FormData
      const form = new FormData()
      form.append("files", file)
      form.append("tags", JSON.stringify(["folder:watermark"]))
      if (selectedPropertyId) {
        form.append("propertyId", selectedPropertyId)
      }

      // 4. Upload
      const res = await fetch("/api/v1/gallery/upload", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to save to gallery")

      toast.success("Saved to gallery!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save to gallery")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAllToGallery = async () => {
    if (!images.length) {
      toast.error("Add images first.")
      return
    }
    if ((options.mode === "logo" || options.mode === "both") && !logoFile) {
      toast.error("Add a logo first (or switch to text-only).")
      return
    }

    setIsSaving(true)
    toast.info("Processing and saving images…")

    try {
      // 1. Process all images
      const form = new FormData()
      for (const img of images) {
        const blob = await processOne(img)
        const filename = `${safeBaseName(img.file.name)}-watermarked.${outputExt}`
        const file = new File([blob], filename, { type: options.outputFormat })
        form.append("files", file)
      }

      // 2. Add metadata
      form.append("tags", JSON.stringify(["folder:watermark"]))
      if (selectedPropertyId) {
        form.append("propertyId", selectedPropertyId)
      }

      // 3. Upload
      const res = await fetch("/api/v1/gallery/upload", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to save to gallery")

      toast.success(`Saved ${data?.created?.length ?? images.length} image(s) to gallery!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save to gallery")
    } finally {
      setIsSaving(false)
    }
  }

  const positions: Array<{ id: WatermarkPosition; label: string }> = [
    { id: "top_left", label: "Top left" },
    { id: "top_right", label: "Top right" },
    { id: "middle_center", label: "Center" },
    { id: "bottom_left", label: "Bottom left" },
    { id: "bottom_right", label: "Bottom right" },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload photos</CardTitle>
            <CardDescription>Add any photos and watermark them with your logo and/or text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input ref={inputRef} type="file" accept="image/*" multiple onChange={handleAddImages} />
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Add
              </Button>
              <Button variant="outline" onClick={handleRemoveAll} disabled={!images.length}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>

            {images.length ? (
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedId(img.id)}
                      className={[
                        "overflow-hidden rounded-md border bg-muted/30",
                        img.id === selectedId ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/40",
                      ].join(" ")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.file.name}
                        className="h-20 w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error('Blob URL failed to load:', img.url, e);
                          console.log('Image has dataUrl?', !!img.dataUrl);
                          console.log('DataUrl length:', img.dataUrl?.length || 0);

                          // Try base64 fallback if available
                          if (img.dataUrl) {
                            console.log('Trying base64 fallback for:', img.file.name);
                            target.src = img.dataUrl;
                            return;
                          }

                          console.error('No base64 fallback available for:', img.file.name);
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="h-20 w-full flex items-center justify-center text-xs text-muted-foreground border rounded">Image failed</div>`;
                        }}
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', img.file.name);
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/20 p-6 text-sm text-muted-foreground">
                No photos yet. Upload one or more images to get started.
              </div>
            )}

            {selected ? (
              <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{selected.file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(selected.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleRemoveSelected}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Watermark</CardTitle>
            <CardDescription>Two common modes: subtle corner branding or a diagonal protection watermark.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wm-usage">Where will you use these images?</Label>
                <Select value={usage} onValueChange={(v) => setUsage(v as "marketing" | "mls")}>
                  <SelectTrigger id="wm-usage">
                    <SelectValue placeholder="Select usage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing (website, socials, flyers)</SelectItem>
                    <SelectItem value="mls">MLS / Listing feed</SelectItem>
                  </SelectContent>
                </Select>
                {usage === "mls" ? (
                  <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                    Many MLS systems forbid logos/watermarks on listing photos. Use clean images for MLS and keep
                    watermarking for marketing channels.
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wm-preset">Preset</Label>
                <Select
                  value={preset}
                  onValueChange={(v) => setPreset(v as "subtle_corner" | "visible_corner" | "diagonal_protection")}
                  disabled={usage === "mls"}
                >
                  <SelectTrigger id="wm-preset">
                    <SelectValue placeholder="Select a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subtle_corner">Subtle corner (recommended)</SelectItem>
                    <SelectItem value="visible_corner">Visible corner</SelectItem>
                    <SelectItem value="diagonal_protection">Diagonal protection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wm-mode">Watermark type</Label>
                <Select
                  value={options.mode}
                  onValueChange={(v) => setOptions((p) => ({ ...p, mode: v as any }))}
                  disabled={usage === "mls"}
                >
                  <SelectTrigger id="wm-mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logo">Logo (most common)</SelectItem>
                    <SelectItem value="text">Text only</SelectItem>
                    <SelectItem value="both">Logo + text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wm-position">Position</Label>
                <Select
                  value={options.position}
                  onValueChange={(v) => setOptions((p) => ({ ...p, position: v as WatermarkPosition }))}
                  disabled={options.tile || usage === "mls"}
                >
                  <SelectTrigger id="wm-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex gap-2">
                  <Input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={usage === "mls"}
                  />
                  <Button variant="outline" onClick={handleClearLogo} disabled={!logoFile}>
                    Clear
                  </Button>
                </div>
                {logoUrl ? (
                  <div className="mt-2 flex items-center gap-3 rounded-md border bg-muted/20 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-10 w-10 rounded object-contain"
                      onError={(e) => {
                        console.error('Logo failed to load:', logoUrl, e);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="h-10 w-10 flex items-center justify-center text-xs text-muted-foreground border rounded">Logo failed</div>`;
                      }}
                      onLoad={() => {
                        console.log('Logo loaded successfully:', logoUrl);
                      }}
                    />
                    <div className="text-xs text-muted-foreground">Logo will be applied on export.</div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wm-text">Text</Label>
                <Textarea
                  id="wm-text"
                  value={options.text}
                  onChange={(e) => setOptions((p) => ({ ...p, text: e.target.value }))}
                  placeholder="e.g., Your Agency Name"
                  className="min-h-[92px]"
                  disabled={usage === "mls"}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Opacity</Label>
                  <div className="text-xs text-muted-foreground">{Math.round(options.opacity * 100)}%</div>
                </div>
                <Slider
                  value={[Math.round(options.opacity * 100)]}
                  onValueChange={(v) => setOptions((p) => ({ ...p, opacity: (v[0] ?? 25) / 100 }))}
                  min={5}
                  max={90}
                  disabled={usage === "mls"}
                />
              </div>

              {options.mode === "text" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Text size</Label>
                    <div className="text-xs text-muted-foreground">{options.textSizePx}px</div>
                  </div>
                  <Slider
                    value={[options.textSizePx]}
                    onValueChange={(v) => setOptions((p) => ({ ...p, textSizePx: v[0] ?? 44 }))}
                    min={18}
                    max={180}
                    disabled={usage === "mls"}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Logo size</Label>
                    <div className="text-xs text-muted-foreground">{options.scalePct}% of photo</div>
                  </div>
                  <Slider
                    value={[options.scalePct]}
                    onValueChange={(v) => setOptions((p) => ({ ...p, scalePct: v[0] ?? 18 }))}
                    min={6}
                    max={80}
                    disabled={usage === "mls"}
                  />
                </div>
              )}
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="advanced">
                <AccordionTrigger>Advanced</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Rotation</Label>
                          <div className="text-xs text-muted-foreground">{options.rotationDeg}°</div>
                        </div>
                        <Slider
                          value={[options.rotationDeg]}
                          onValueChange={(v) => setOptions((p) => ({ ...p, rotationDeg: v[0] ?? 0 }))}
                          min={-45}
                          max={45}
                          disabled={usage === "mls"}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Padding</Label>
                          <div className="text-xs text-muted-foreground">{options.paddingPx}px</div>
                        </div>
                        <Slider
                          value={[options.paddingPx]}
                          onValueChange={(v) => setOptions((p) => ({ ...p, paddingPx: v[0] ?? 24 }))}
                          min={0}
                          max={120}
                          disabled={usage === "mls"}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Text size</Label>
                          <div className="text-xs text-muted-foreground">{options.textSizePx}px</div>
                        </div>
                        <Slider
                          value={[options.textSizePx]}
                          onValueChange={(v) => setOptions((p) => ({ ...p, textSizePx: v[0] ?? 44 }))}
                          min={16}
                          max={140}
                          disabled={usage === "mls"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="wm-text-color">Text color</Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="wm-text-color"
                            type="color"
                            value={options.textColor}
                            onChange={(e) => setOptions((p) => ({ ...p, textColor: e.target.value }))}
                            className="h-10 w-16 p-1"
                            disabled={usage === "mls"}
                          />
                          <Input
                            value={options.textColor}
                            onChange={(e) => setOptions((p) => ({ ...p, textColor: e.target.value }))}
                            className="font-mono"
                            disabled={usage === "mls"}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
                        <div>
                          <div className="text-sm font-medium">Tile watermark</div>
                          <div className="text-xs text-muted-foreground">Repeat watermark across the whole image.</div>
                        </div>
                        <Switch
                          checked={options.tile}
                          onCheckedChange={(v) => setOptions((p) => ({ ...p, tile: v }))}
                          disabled={usage === "mls"}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Tile gap</Label>
                          <div className="text-xs text-muted-foreground">{options.tileGapPct}%</div>
                        </div>
                        <Slider
                          value={[options.tileGapPct]}
                          onValueChange={(v) => setOptions((p) => ({ ...p, tileGapPct: v[0] ?? 22 }))}
                          min={8}
                          max={60}
                          disabled={!options.tile || usage === "mls"}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="wm-format">Output</Label>
                        <Select
                          value={options.outputFormat}
                          onValueChange={(v) => setOptions((p) => ({ ...p, outputFormat: v as any }))}
                        >
                          <SelectTrigger id="wm-format">
                            <SelectValue placeholder="Select output format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image/jpeg">JPG</SelectItem>
                            <SelectItem value="image/png">PNG</SelectItem>
                            <SelectItem value="image/webp">WEBP</SelectItem>
                          </SelectContent>
                        </Select>
                        {options.outputFormat === "image/jpeg" ? (
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <Label>JPG quality</Label>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(options.jpegQuality * 100)}%
                              </div>
                            </div>
                            <Slider
                              value={[Math.round(options.jpegQuality * 100)]}
                              onValueChange={(v) => setOptions((p) => ({ ...p, jpegQuality: (v[0] ?? 90) / 100 }))}
                              min={60}
                              max={100}
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="wm-max">Resize long edge (optional)</Label>
                        <Select
                          value={options.maxLongEdgePx ? String(options.maxLongEdgePx) : "none"}
                          onValueChange={(v) =>
                            setOptions((p) => ({ ...p, maxLongEdgePx: v === "none" ? null : Number(v) }))
                          }
                        >
                          <SelectTrigger id="wm-max">
                            <SelectValue placeholder="Keep original size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Keep original</SelectItem>
                            <SelectItem value="2048">2048 px</SelectItem>
                            <SelectItem value="3072">3072 px</SelectItem>
                            <SelectItem value="4096">4096 px</SelectItem>
                            <SelectItem value="6000">6000 px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-3">
              {properties.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="wm-property">Link to property (optional)</Label>
                  <Select value={selectedPropertyId || "none"} onValueChange={(v) => setSelectedPropertyId(v === "none" ? null : v)}>
                    <SelectTrigger id="wm-property">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {properties.map((p) => {
                        const addressStr = typeof p.address === 'string'
                          ? p.address
                          : `${p.address?.street || ''} ${p.address?.city || ''}`.trim()
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            {addressStr || `Property ${p.id}`}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Single image actions */}
              <div className="flex gap-2">
                <Button onClick={handleDownloadSelected} disabled={isProcessing || isSaving || !selected} className="flex-1">
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download
                </Button>
                <Button variant="outline" onClick={handleSaveToGallery} disabled={isProcessing || isSaving || !selected} className="flex-1">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                  Save to Gallery
                </Button>
              </div>

              {/* Batch actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadAllZip} disabled={isProcessing || isSaving || !images.length} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download All (.zip)
                </Button>
                <Button variant="outline" onClick={handleSaveAllToGallery} disabled={isProcessing || isSaving || !images.length} className="flex-1">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                  Save All to Gallery
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Live preview updates as you change watermark settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected ? (
            <div className="relative overflow-hidden rounded-md border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl || selected.url}
                alt="Selected"
                className="h-auto w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error('Preview image failed to load:', previewUrl || selected.url, e);
                  console.log('Selected image has dataUrl?', !!selected.dataUrl);
                  console.log('PreviewUrl exists?', !!previewUrl);

                  // Try base64 fallback if available
                  if (!previewUrl && selected.dataUrl) {
                    console.log('Trying base64 fallback for preview:', selected.file.name);
                    target.src = selected.dataUrl;
                    return;
                  }

                  console.error('No fallback available for preview:', selected.file.name);
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<div class="min-h-[420px] flex items-center justify-center text-sm text-muted-foreground">Preview image failed to load</div>`;
                }}
                onLoad={(e) => {
                  console.log('Preview image loaded successfully:', selected.file.name);
                }}
              />
              {isPreviewing ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating preview…
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
              Select an image to preview.
            </div>
          )}

          <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
            Best practice: keep it subtle (bottom-right, ~15–30% opacity) for marketing. For MLS, many systems require
            unbranded photos.
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            Runs locally in your browser (no AI / no upload).
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
