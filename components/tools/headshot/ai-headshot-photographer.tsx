"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Loader2, Sparkles, UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ImageResult } from "@/components/prompt-master/image-result"
import {
  HEADSHOT_OUTFITS,
  HEADSHOT_STYLES,
  renderHeadshotPrompt,
  type HeadshotMode,
  type HeadshotOutfitPresetId,
  type HeadshotStyleId,
} from "@/lib/headshot/headshot-prompts"

type FalImage = { url: string; width?: number; height?: number; content_type?: string; file_name?: string }

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

function HeadshotStyleCards({
  selected,
  onSelect,
}: {
  selected: HeadshotStyleId
  onSelect: (id: HeadshotStyleId) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {HEADSHOT_STYLES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={[
            "rounded-lg border bg-card p-4 text-left transition-colors",
            selected === s.id ? "ring-2 ring-primary" : "hover:bg-muted/30",
          ].join(" ")}
        >
          <div className="text-sm font-semibold">{s.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>
        </button>
      ))}
    </div>
  )
}

function ThumbGrid({
  label,
  images,
  onAddFiles,
  onRemove,
  multiple,
}: {
  label: string
  images: string[]
  onAddFiles: (files: File[]) => Promise<void> | void
  onRemove: (index: number) => void
  multiple?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple={Boolean(multiple)}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) void onAddFiles(files)
            if (inputRef.current) inputRef.current.value = ""
          }}
        />
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Add
        </Button>
      </div>

      {images.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, idx) => (
            <div key={`${idx}`} className="relative overflow-hidden rounded-md border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Reference ${idx + 1}`} className="h-20 w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute right-1 top-1 rounded bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted/20"
          >
            +
          </button>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
          Optional. If you don’t need it, skip it.
        </div>
      )}
    </div>
  )
}

export function AiHeadshotPhotographer() {
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  const [poseRef, setPoseRef] = useState<string | null>(null)
  const [outfitRefs, setOutfitRefs] = useState<string[]>([])

  const [styleId, setStyleId] = useState<HeadshotStyleId>("studio_grey")
  const [outfitPreset, setOutfitPreset] = useState<HeadshotOutfitPresetId>("agent_suit")
  const [customOutfit, setCustomOutfit] = useState("")

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mode, setMode] = useState<HeadshotMode>("full_headshot")

  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [generatedImages, setGeneratedImages] = useState<FalImage[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [numVariants, setNumVariants] = useState<1 | 2 | 3 | 4>(1)

  const [falRequestId, setFalRequestId] = useState<string | null>(null)
  const [falRequestModel, setFalRequestModel] = useState<string | null>(null)
  const generationTokenRef = useRef(0)

  // Prefer Seedream v4.5 for headshots when available.
  const [falModel, setFalModel] = useState<string>("fal-ai/bytedance/seedream/v4.5/edit")
  const [falSupportedModels, setFalSupportedModels] = useState<string[]>([
    "fal-ai/bytedance/seedream/v4.5/edit",
    "fal-ai/nano-banana-pro/edit",
    "fal-ai/gemini-25-flash-image/edit",
  ])

  const canGenerate = Boolean(selfieDataUrl) && !isGenerating

  const selectedGeneratedUrl = generatedImages[selectedImageIndex]?.url || null
  const canClothesOnly = Boolean(selectedGeneratedUrl) && !isGenerating

  const effectivePrompt = useMemo(() => {
    return renderHeadshotPrompt({
      mode,
      useCase: "photorealistic",
      styleId,
      outfitPreset,
      customOutfit,
      includePoseReference: Boolean(poseRef),
      includeOutfitReferences: outfitRefs.length > 0,
    })
  }, [mode, styleId, outfitPreset, customOutfit, poseRef, outfitRefs.length])

  useEffect(() => {
    setGeneratedPrompt(effectivePrompt)
  }, [effectivePrompt])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/v1/setup/status")
        const json = await res.json().catch(() => ({}))
        if (!res.ok) return
        if (cancelled) return

        const supported = Array.isArray(json?.fal?.supportedModels) ? (json.fal.supportedModels as unknown[]) : []
        const supportedStrings = supported.filter((m): m is string => typeof m === "string" && m.trim().length > 0)
        if (supportedStrings.length) setFalSupportedModels(supportedStrings)

        const seedream = "fal-ai/bytedance/seedream/v4.5/edit"
        const defaultModel =
          typeof json?.fal?.model === "string" && json.fal.model.trim().length > 0 ? (json.fal.model as string).trim() : null

        if (supportedStrings.includes(seedream)) setFalModel(seedream)
        else if (defaultModel && supportedStrings.includes(defaultModel)) setFalModel(defaultModel)
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const resetAll = () => {
    setSelfieDataUrl(null)
    setPoseRef(null)
    setOutfitRefs([])
    setStyleId("studio_grey")
    setOutfitPreset("agent_suit")
    setCustomOutfit("")
    setShowAdvanced(false)
    setMode("full_headshot")
    setGeneratedPrompt("")
    setGeneratedImages([])
    setSelectedImageIndex(0)
    setIsGenerating(false)
    setFalRequestId(null)
    setFalRequestModel(null)
    generationTokenRef.current += 1
    if (selfieInputRef.current) selfieInputRef.current.value = ""
  }

  const handleSelfieUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }
    const url = await readFileAsDataUrl(file)
    setSelfieDataUrl(url)
    setGeneratedImages([])
    setSelectedImageIndex(0)
    toast.success("Selfie uploaded.")
  }

  const handleGenerate = async (opts?: { modeOverride?: HeadshotMode; baseImageOverride?: string }) => {
    const base = opts?.baseImageOverride || selfieDataUrl
    if (!base) {
      toast.error("Upload a selfie first.")
      return
    }

    const nextMode = opts?.modeOverride || "full_headshot"
    const prompt = renderHeadshotPrompt({
      mode: nextMode,
      useCase: "photorealistic",
      styleId,
      outfitPreset,
      customOutfit,
      includePoseReference: Boolean(poseRef) && nextMode === "full_headshot",
      includeOutfitReferences: outfitRefs.length > 0 && nextMode === "full_headshot",
    })

    const imageUrls: string[] = [base]
    if (nextMode === "full_headshot") {
      if (poseRef) imageUrls.push(poseRef)
      if (outfitRefs.length) imageUrls.push(...outfitRefs)
    }

    setMode(nextMode)
    setGeneratedPrompt(prompt)
    setGeneratedImages([])
    setSelectedImageIndex(0)
    setIsGenerating(true)

    const token = ++generationTokenRef.current
    toast.info(nextMode === "clothes_only" ? "Updating outfit…" : "Generating headshot…")

    try {
      const res = await fetch("/api/fal/nano-banana/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: falModel,
          prompt,
          image_urls: imageUrls,
          num_images: numVariants,
          output_format: "png",
          sync_mode: false,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to submit generation.")
      if (token !== generationTokenRef.current) return
      setFalRequestId(data.requestId || null)
      setFalRequestModel(typeof data.model === "string" && data.model.trim() ? data.model.trim() : falModel)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.")
      setIsGenerating(false)
      setFalRequestId(null)
      setFalRequestModel(null)
    }
  }

  useEffect(() => {
    if (!falRequestId) return
    if (!falRequestModel) return
    const token = generationTokenRef.current

    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/fal/nano-banana/edit?requestId=${encodeURIComponent(falRequestId)}&model=${encodeURIComponent(falRequestModel)}`,
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Failed to poll status.")
        if (cancelled || token !== generationTokenRef.current) return

        if (data.status === "COMPLETED") {
          const imgs = (data.images || []) as FalImage[]
          setGeneratedImages(imgs)
          setSelectedImageIndex(0)
          setIsGenerating(false)
          setFalRequestId(null)
          setFalRequestModel(null)
          toast.success("Done.")
          return
        }
        if (data.status === "FAILED" || data.status === "CANCELLED") {
          setIsGenerating(false)
          setFalRequestId(null)
          setFalRequestModel(null)
          toast.error("Generation failed.")
          return
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Polling failed.")
        setIsGenerating(false)
        setFalRequestId(null)
        setFalRequestModel(null)
        return
      }

      setTimeout(poll, 1200)
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [falRequestId, falRequestModel])

  const uploadPoseRef = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }
    const url = await readFileAsDataUrl(file)
    setPoseRef(url)
    toast.success("Pose reference added.")
  }

  const uploadOutfitRefs = async (files: File[]) => {
    const limited = files.slice(0, 4)
    const next: string[] = []
    for (const f of limited) {
      if (f.size > 5 * 1024 * 1024) continue
      // eslint-disable-next-line no-await-in-loop
      next.push(await readFileAsDataUrl(f))
    }
    if (!next.length) {
      toast.error("No valid outfit images.")
      return
    }
    setOutfitRefs((prev) => [...prev, ...next].slice(0, 6))
    toast.success("Outfit reference(s) added.")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI Headshot Photographer</CardTitle>
          <CardDescription>
            Generate a clean, professional headshot and optionally swap outfits—powered by fal.ai (Seedream v4.5 supported).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="headshot-model">Model</Label>
            <Select value={falModel} onValueChange={setFalModel}>
              <SelectTrigger id="headshot-model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {falSupportedModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Uses the selected model for generation. In-flight requests keep their original model.
            </p>
          </div>

          <div className="space-y-2">
            <Label>1) Upload selfie</Label>
            {!selfieDataUrl ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Drop or upload one clear face photo. Best results: good light, simple background.
                </div>
                <Input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => void handleSelfieUpload(e)}
                  id="headshot-selfie"
                />
                <Button variant="outline" onClick={() => selfieInputRef.current?.click()}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload selfie
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-md border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieDataUrl} alt="Selfie" className="h-auto w-full object-contain" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      setSelfieDataUrl(null)
                      setGeneratedImages([])
                      setSelectedImageIndex(0)
                      if (selfieInputRef.current) selfieInputRef.current.value = ""
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => selfieInputRef.current?.click()}>
                    Change photo
                  </Button>
                  <Button variant="outline" onClick={resetAll}>
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>2) Choose style</Label>
            <HeadshotStyleCards selected={styleId} onSelect={setStyleId} />
          </div>

          <div className="space-y-2">
            <Label>3) Outfit</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Select value={outfitPreset} onValueChange={(v) => setOutfitPreset(v as HeadshotOutfitPresetId)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outfit" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEADSHOT_OUTFITS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  {HEADSHOT_OUTFITS.find((o) => o.id === outfitPreset)?.description}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Custom outfit (optional)</Label>
                <Input
                  value={customOutfit}
                  onChange={(e) => setCustomOutfit(e.target.value)}
                  placeholder="e.g. beige blazer + white shirt"
                  disabled={outfitPreset !== "custom"}
                />
                <div className="text-xs text-muted-foreground">Use custom only if you choose the Custom preset.</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full justify-center text-muted-foreground hover:text-foreground"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  More options
                </>
              )}
            </Button>

            {showAdvanced ? (
              <div className="space-y-4 rounded-md border bg-muted/10 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Variants</Label>
                    <Select value={String(numVariants)} onValueChange={(v) => setNumVariants(Number(v) as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="1" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Advanced options</Label>
                    <div className="text-xs text-muted-foreground">
                      Add optional references and generate multiple variants.
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ThumbGrid
                    label="Pose / style reference (optional)"
                    images={poseRef ? [poseRef] : []}
                    multiple={false}
                    onAddFiles={async (files) => {
                      await uploadPoseRef(files)
                    }}
                    onRemove={(_idx) => setPoseRef(null)}
                  />

                  <ThumbGrid
                    label="Outfit reference images (optional)"
                    images={outfitRefs}
                    multiple
                    onAddFiles={uploadOutfitRefs}
                    onRemove={(idx) => setOutfitRefs((prev) => prev.filter((_, i) => i !== idx))}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={() => void handleGenerate({ modeOverride: "full_headshot" })} disabled={!canGenerate}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isGenerating ? "Generating…" : "Generate headshot"}
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                void handleGenerate({
                  modeOverride: "clothes_only",
                  baseImageOverride: selectedGeneratedUrl || undefined,
                })
              }
              disabled={!canClothesOnly}
              title={!selectedGeneratedUrl ? "Generate a headshot first" : undefined}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              New clothes only
            </Button>
          </div>
        </CardContent>
      </Card>

      <ImageResult
        originalUrl={selfieDataUrl}
        showComparison={false}
        images={generatedImages}
        selectedIndex={selectedImageIndex}
        isLoading={isGenerating}
        prompt={generatedPrompt}
        onSelectImage={setSelectedImageIndex}
        onRegenerate={() => void handleGenerate({ modeOverride: "full_headshot" })}
        onSaveToGallery={(url) => {
          void (async () => {
            try {
              const res = await fetch("/api/v1/gallery/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url,
                  filename: `headshot_${new Date().toISOString().slice(0, 10)}.png`,
                  tags: ["folder:ai_headshots", "tool:headshot"],
                }),
              })
              const json = await res.json().catch(() => ({} as any))
              if (!res.ok) throw new Error(json?.error || "Save failed")
              toast.success("Saved to Gallery.")
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Save failed")
            }
          })()
        }}
      />
    </div>
  )
}
