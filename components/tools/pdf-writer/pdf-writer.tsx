"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { useDataStore } from "@/lib/data-store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

function safeFilename(value: string) {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80)
  return cleaned || "document"
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  const fixed = unit === 0 ? 0 : unit === 1 ? 1 : 2
  return `${size.toFixed(fixed)} ${units[unit]}`
}

function slugKey(input: string) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "image"
}

export function PdfWriterTool() {
  const { properties, upsertMarketingDocument } = useDataStore()

  const [title, setTitle] = useState("Customer PDF")
  const [reference, setReference] = useState("")
  const [propertyId, setPropertyId] = useState<string>("")
  const [body, setBody] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiMode, setAiMode] = useState<"strict" | "format" | "rewrite">("rewrite")
  const [images, setImages] = useState<Array<{ file: File; key: string; caption: string; previewUrl: string }>>([])
  const [autoPlaceImages, setAutoPlaceImages] = useState(true)
  const imagesRef = useRef(images)

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      // Cleanup previews on unmount
      for (const img of imagesRef.current) URL.revokeObjectURL(img.previewUrl)
    }
  }, [])

  const clearImages = () => {
    for (const img of imagesRef.current) URL.revokeObjectURL(img.previewUrl)
    setImages([])
  }

  const propertyOptions = useMemo(() => {
    return properties
      .slice()
      .sort((a, b) => (a.reference || "").localeCompare(b.reference || ""))
      .map((p) => ({
        id: p.id,
        label: `${p.reference} — ${p.address.street}`,
      }))
  }, [properties])

  const selectClassName = cn(
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  )

  const onGenerate = async () => {
    const trimmedTitle = title.trim()
    const trimmedReference = reference.trim()

    if (!trimmedTitle) return toast.error("Please enter a title.")
    if (!body.trim()) return toast.error("Please paste some text.")

    const now = new Date().toISOString()

    try {
      setIsGenerating(true)

      let pdfData = {
        title: trimmedTitle,
        reference: trimmedReference ? trimmedReference : null,
        body: body,
        createdAt: now,
        mode: aiMode as any,
        assets: null as any,
        layout: null as any,
      }

      // Strict mode: no AI call.
      // Format mode: extract a designed layout but keep body unchanged.
      // Rewrite mode: can rewrite + designed layout.
      if (aiMode !== "strict") {
        const fmtRes = await fetch("/api/ai/pdf-writer/format", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: pdfData.body,
            mode: aiMode,
            images:
              autoPlaceImages && images.length
                ? images.map((i) => ({ key: i.key.trim(), caption: i.caption.trim() || undefined, filename: i.file.name }))
                : undefined,
          }),
        })
        const fmt = (await fmtRes.json().catch(() => ({}))) as any
        if (typeof fmt?.warning === "string" && fmt.warning) toast.message(fmt.warning)
        if (fmt?.ok) {
          pdfData = {
            ...pdfData,
            title: typeof fmt.title === "string" && fmt.title.trim() ? fmt.title.trim() : pdfData.title,
            reference: typeof fmt.reference === "string" && fmt.reference.trim() ? fmt.reference.trim() : pdfData.reference,
            body: aiMode === "rewrite" && typeof fmt.body === "string" && fmt.body.trim() ? fmt.body.trim() : pdfData.body,
            layout: (aiMode === "rewrite" || aiMode === "format") && typeof fmt.layout === "object" ? fmt.layout : null,
          }
          setTitle(pdfData.title)
          setReference(pdfData.reference ?? "")
          if (aiMode === "rewrite") setBody(pdfData.body)
        }
      }

      // 1) Create a marketing document row first (so persist/update is guaranteed to work).
      const createRes = await fetch("/api/v1/marketing-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propertyId || null,
          type: "customer_pdf",
          title: pdfData.title,
          description: body.trim().slice(0, 140),
          version: 1,
          status: "draft",
          data: pdfData,
          fileUrl: null,
          generatedAt: null,
          createdAt: now,
        }),
      })

      const created = (await createRes.json().catch(() => ({}))) as any
      if (!createRes.ok) throw new Error(created?.error || "Failed to create document")
      if (!created?.id) throw new Error("Document created but missing id")

      upsertMarketingDocument(created)

      // 2) Upload images (optional) and persist their storage paths in the document data.
      if (images.length) {
        const form = new FormData()
        form.set("documentId", created.id)
        for (const img of images) form.append("files", img.file)

        const uploadRes = await fetch("/api/v1/pdf-writer/assets/upload", { method: "POST", body: form })
        const uploaded = (await uploadRes.json().catch(() => ({}))) as any
        if (!uploadRes.ok) throw new Error(uploaded?.error || "Failed to upload images")

        const createdAssets = Array.isArray(uploaded?.created) ? (uploaded.created as any[]) : []
        const assets = createdAssets.map((a, idx) => ({
          path: String(a.path),
          key: images[idx]?.key ? images[idx].key.trim() : null,
          filename: typeof a.filename === "string" ? a.filename : null,
          contentType: typeof a.contentType === "string" ? a.contentType : null,
          caption: images[idx]?.caption ? images[idx].caption.trim() : null,
        }))

        pdfData = { ...pdfData, assets }

        const patchRes = await fetch(`/api/v1/marketing-documents/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: pdfData }),
        })
        const patched = (await patchRes.json().catch(() => ({}))) as any
        if (!patchRes.ok) throw new Error(patched?.error || "Failed to save image attachments")
        upsertMarketingDocument(patched)
      }

      // 2) Generate and persist the PDF to Supabase Storage.
      const filename = `${safeFilename(pdfData.title)}_${now.slice(0, 10)}.pdf`
      const genRes = await fetch("/api/v1/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "pdf_writer",
          data: pdfData,
          options: { filename },
          persist: { kind: "marketing", id: created.id },
        }),
      })

      const gen = (await genRes.json().catch(() => ({}))) as any
      if (!genRes.ok) throw new Error(gen?.error || "Failed to generate PDF")

      if (typeof gen?.storagePath === "string") {
        upsertMarketingDocument({ ...created, fileUrl: gen.storagePath, generatedAt: now })
      }

      if (typeof gen?.signedUrl === "string" && gen.signedUrl) {
        window.open(gen.signedUrl, "_blank", "noopener,noreferrer")
      }

      toast.success("PDF generated and saved to Supabase.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pdf-title">Title</Label>
            <Input id="pdf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Customer PDF" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf-ref">Reference (optional)</Label>
            <Input id="pdf-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. PROP-XXXX" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pdf-property">Property (optional)</Label>
            <select
              id="pdf-property"
              className={selectClassName}
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            >
              <option value="">No property</option>
              {propertyOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
            <div>
              <p className="text-sm font-medium">AI formatting</p>
              <p className="text-xs text-muted-foreground">Choose how AI formats your pasted content.</p>
            </div>
            <select
              className={selectClassName}
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value as any)}
              disabled={isGenerating}
            >
              <option value="strict">Keep 100% as-is</option>
              <option value="format">Format only (no rewrite)</option>
              <option value="rewrite">Rewrite + design (best)</option>
            </select>
          </div>

        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Images (optional)</p>
            <p className="text-xs text-muted-foreground">Add photos to be embedded in the PDF (saved to Supabase).</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={isGenerating || images.length === 0}
            onClick={clearImages}
          >
            Clear images
          </Button>
        </div>

        <Input
          type="file"
          multiple
          accept="image/*"
          disabled={isGenerating}
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (!files.length) return
            setImages((prev) => [
              ...prev,
              ...files.map((file) => ({ file, key: slugKey(file.name), caption: "", previewUrl: URL.createObjectURL(file) })),
            ])
            e.currentTarget.value = ""
          }}
        />

        {images.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
              <div>
                <p className="text-sm font-medium">AI place images</p>
                <p className="text-xs text-muted-foreground">Places images into the document automatically (no manual anchors).</p>
              </div>
              <Switch checked={autoPlaceImages} onCheckedChange={setAutoPlaceImages} disabled={isGenerating || aiMode === "strict"} />
            </div>
            {images.map((img, idx) => (
              <div key={`${img.file.name}-${idx}`} className="flex items-start gap-3 rounded-md border p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt={img.caption || img.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{img.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(img.file.size)}</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>
                      <Label className="text-xs" htmlFor={`img-key-${idx}`}>
                        Key (for placement)
                      </Label>
                      <Input
                        id={`img-key-${idx}`}
                        value={img.key}
                  onChange={(e) => {
                        const v = e.target.value
                        setImages((prev) => prev.map((p, i) => (i === idx ? { ...p, key: v } : p)))
                      }}
                        placeholder="e.g. living_room"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Use <span className="font-mono">[[IMAGE:{img.key || "key"}]]</span> in the text.
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs" htmlFor={`img-caption-${idx}`}>
                        Caption (optional)
                      </Label>
                      <Input
                        id={`img-caption-${idx}`}
                        value={img.caption}
                        onChange={(e) => {
                          const v = e.target.value
                          setImages((prev) => prev.map((p, i) => (i === idx ? { ...p, caption: v } : p)))
                        }}
                        placeholder="e.g. Living room"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isGenerating}
                      onClick={() => {
                        const key = img.key?.trim() || "image"
                        const anchor = `\n[[IMAGE:${key}]]\n`
                        setBody((prev) => (prev.endsWith("\n") ? prev + anchor.trimStart() : prev + anchor))
                        toast.success("Anchor inserted into text.")
                      }}
                    >
                      Insert anchor into text
                    </Button>
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] text-muted-foreground">
                      Images without an anchor will appear under <span className="font-mono">Annexes</span>.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isGenerating}
                  onClick={() => {
                    URL.revokeObjectURL(img.previewUrl)
                    setImages((prev) => prev.filter((_, i) => i !== idx))
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No images attached.</p>
        )}
      </Card>

      <Card className="p-6 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="pdf-body">Plain text</Label>
          <span className="text-xs text-muted-foreground">{body.length.toLocaleString()} chars</span>
        </div>
        <Textarea
          id="pdf-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Paste your text here…"
          className="min-h-[320px]"
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            disabled={isGenerating || (!body.trim() && !title.trim() && !reference.trim())}
            onClick={() => {
              setBody("")
              setReference("")
              setTitle("Customer PDF")
              setPropertyId("")
              setAiMode("rewrite")
              clearImages()
            }}
          >
            Clear
          </Button>
          <Button disabled={isGenerating} onClick={onGenerate}>
            {isGenerating ? "Generating…" : "Generate PDF"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
