"use client"

import { useMemo, useRef, useState, type ChangeEvent, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Sparkles, UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ImageResult } from "@/components/prompt-master/image-result"
import { useDataStore } from "@/lib/data-store"
import {
  VIRTUAL_STAGING_STYLES,
  type ImageEditMode,
  type VirtualStagingStyle,
  renderBrightenAndCorrectPrompt,
  renderDayToTwilightPrompt,
  renderDeclutterRemoveFurniturePrompt,
  renderEnhanceLandscapingPrompt,
  renderPoolCleanupPrompt,
  renderRemoveCarsPeoplePrompt,
  renderRemovePersonalItemsPrompt,
  renderRemovePowerLinesPrompt,
  renderSkyReplacementPrompt,
  renderStraightenPerspectivePrompt,
  renderChangeCameraAnglePrompt,
  renderReplaceFurnitureStylePrompt,
  renderVirtualStagingPrompt,
  renderVirtualRenovationPrompt,
  renderPlan2DTo3DFurnishedPrompt,
} from "@/lib/real-estate/photo-prompt-templates"

const useCases = ["photorealistic", "stylized/illustration", "product mockup", "minimalist"] as const

type FalImage = { url: string; width?: number; height?: number; content_type?: string; file_name?: string }

export function RealEstatePhotoTools() {
  const { properties, contacts, photoGenerations, addPhotoGeneration } = useDataStore()

  // Radix Select uses generated IDs; any render-order differences between SSR and CSR can trigger hydration warnings.
  // Dashboard tools don't need SSR, so we render a stable placeholder until mounted.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [mode, setMode] = useState<ImageEditMode>("declutter_remove_furniture")
  const [useCase, setUseCase] = useState<(typeof useCases)[number]>("photorealistic")
  const [linkedPropertyId, setLinkedPropertyId] = useState<string>("")
  const [linkedContactId, setLinkedContactId] = useState<string>("")

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageDescription, setImageDescription] = useState("")
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [stagingStyle, setStagingStyle] = useState<VirtualStagingStyle>("scandinavian")
  const [stagingRoomType, setStagingRoomType] = useState("living room / open plan")
  const [stagingOccupancy, setStagingOccupancy] = useState<"empty" | "partly_furnished">("empty")

  const [restyleStyle, setRestyleStyle] = useState<VirtualStagingStyle>("modern")
  const [restyleRoomType, setRestyleRoomType] = useState("living room / open plan")
  const [restyleIntensity, setRestyleIntensity] = useState<"light" | "full">("full")

  const [renovationRequest, setRenovationRequest] = useState("")
  const [angleRoomType, setAngleRoomType] = useState("living room / open plan")
  const [angleTarget, setAngleTarget] = useState<
    "top_down" | "high_corner" | "eye_level_straight" | "low_angle" | "three_quarter_left" | "three_quarter_right"
  >("high_corner")
  const [angleStrength, setAngleStrength] = useState<"subtle" | "moderate" | "strong">("moderate")
  const [angleLens, setAngleLens] = useState<16 | 18 | 24 | 28 | 35>(24)
  const [planStyle, setPlanStyle] = useState<VirtualStagingStyle>("modern")
  const [planIncludeLabels, setPlanIncludeLabels] = useState(true)

  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [generatedImages, setGeneratedImages] = useState<FalImage[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [numVariants, setNumVariants] = useState<1 | 2 | 3 | 4>(1)
  const [falRequestId, setFalRequestId] = useState<string | null>(null)
  const generationTokenRef = useRef(0)
  const [falModel, setFalModel] = useState<string>("fal-ai/gemini-25-flash-image/edit")
  const [falSupportedModels, setFalSupportedModels] = useState<string[]>([
    "fal-ai/gemini-25-flash-image/edit",
    "fal-ai/nano-banana-pro/edit",
    "fal-ai/bytedance/seedream/v4.5/edit",
  ])

  const canAnalyze = Boolean(uploadedImage) && !isAnalyzingImage

  const modeTitle = useMemo(() => {
    switch (mode) {
      case "declutter_remove_furniture":
        return "Remove furniture"
      case "remove_personal_items":
        return "Remove personal items"
      case "day_to_twilight":
        return "Day → Twilight"
      case "sky_replacement":
        return "Sky replacement"
      case "virtual_staging":
        return "Virtual staging"
      case "replace_furniture_style":
        return "Replace furniture style"
      case "virtual_renovation":
        return "Virtual renovation"
      case "brighten_and_correct":
        return "Brighten & correct"
      case "straighten_perspective":
        return "Straighten perspective"
      case "remove_cars_people":
        return "Remove cars & people"
      case "enhance_landscaping":
        return "Enhance landscaping"
      case "remove_power_lines":
        return "Remove power lines"
      case "pool_cleanup":
        return "Pool cleanup"
      case "change_camera_angle":
        return "Change camera angle"
      case "plan_2d_to_3d_furnished":
        return "2D plan → 3D furnished"
      default:
        return "Photo tools"
    }
  }, [mode])

  const modeDescription = useMemo(() => {
    switch (mode) {
      case "declutter_remove_furniture":
        return "Remove all movable furniture/objects to create a clean, empty interior while preserving architecture, floors, lighting, and perspective."
      case "remove_personal_items":
        return "Remove personal belongings and clutter (photos, toiletries, papers, cables, branding) while keeping the room intact and realistic."
      case "virtual_staging":
        return "Add realistic, perspective-correct furniture and minimal decor to stage an empty/underfurnished space for a listing."
      case "replace_furniture_style":
        return "Swap existing furniture/decor to a cohesive style while keeping architecture, lighting, and realism. Great to modernize a furnished listing."
      case "virtual_renovation":
        return "Update finishes/materials (paint, flooring, kitchen/bath surfaces) while preserving geometry and photographic realism."
      case "brighten_and_correct":
        return "Natural pro-grade exposure + color correction (no fake HDR), keeping true materials and crisp detail."
      case "straighten_perspective":
        return "Correct verticals and level horizon for a professional listing look, avoiding warping artifacts."
      case "day_to_twilight":
        return "Convert a daylight exterior into a premium twilight listing photo with blue-hour ambience and warm interior glow."
      case "sky_replacement":
        return "Replace the sky with a clean, realistic sky while preserving rooflines/trees, reflections, and edge fidelity (no halos)."
      case "remove_cars_people":
        return "Remove vehicles and people from exteriors (driveway/street) with seamless inpainting and realistic shadows."
      case "enhance_landscaping":
        return "Subtle curb-appeal boost: greener grass, healthier foliage, tidy edges—believable, not fake/neon."
      case "remove_power_lines":
        return "Remove overhead cables/power lines without damaging sky gradients, branches, or roof edges."
      case "pool_cleanup":
        return "Clean up pool water and surface (remove debris, improve clarity) with realistic reflections and ripples."
      case "change_camera_angle":
        return "Generate an alternate interior photo from a different angle (top-down / corner / 3-4 view) while preserving the same room identity and realism."
      case "plan_2d_to_3d_furnished":
        return "Convert a 2D floor plan into a clean, accurate, furnished 3D isometric plan suitable for marketing."
      default:
        return ""
    }
  }, [mode])

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string)
      setImageDescription("")
      toast.success("Image uploaded.")
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
    setImageDescription("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAnalyzeImage = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first.")
      return
    }

    setIsAnalyzingImage(true)
    toast.info("Analyzing image...")

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage }),
      })

      const analysis = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(analysis.error || "Failed to analyze image.")

      if (typeof analysis.description === "string") {
        setImageDescription(analysis.description)
      }
      if (typeof analysis.useCase === "string" && (useCases as readonly string[]).includes(analysis.useCase)) {
        setUseCase(analysis.useCase as (typeof useCases)[number])
      }

      toast.success("Image analysis applied.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  const handleGenerate = () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first.")
      return
    }

    setGeneratedImages([])
    setSelectedImageIndex(0)
    setFalRequestId(null)

    let prompt = ""
    switch (mode) {
      case "declutter_remove_furniture":
        prompt = renderDeclutterRemoveFurniturePrompt({ imageDescription, useCase })
        break
      case "remove_personal_items":
        prompt = renderRemovePersonalItemsPrompt({ imageDescription, useCase })
        break
      case "day_to_twilight":
        prompt = renderDayToTwilightPrompt({ imageDescription, useCase })
        break
      case "sky_replacement":
        prompt = renderSkyReplacementPrompt({ imageDescription, useCase })
        break
      case "virtual_staging":
        prompt = renderVirtualStagingPrompt({
          imageDescription,
          useCase,
          style: stagingStyle,
          roomType: stagingRoomType,
          occupancy: stagingOccupancy,
        })
        break
      case "replace_furniture_style":
        prompt = renderReplaceFurnitureStylePrompt({
          imageDescription,
          useCase,
          style: restyleStyle,
          roomType: restyleRoomType,
          intensity: restyleIntensity,
        })
        break
      case "virtual_renovation":
        prompt = renderVirtualRenovationPrompt({
          imageDescription,
          useCase,
          renovationRequest: renovationRequest.trim(),
        })
        break
      case "brighten_and_correct":
        prompt = renderBrightenAndCorrectPrompt({ imageDescription, useCase })
        break
      case "straighten_perspective":
        prompt = renderStraightenPerspectivePrompt({ imageDescription, useCase })
        break
      case "remove_cars_people":
        prompt = renderRemoveCarsPeoplePrompt({ imageDescription, useCase })
        break
      case "enhance_landscaping":
        prompt = renderEnhanceLandscapingPrompt({ imageDescription, useCase })
        break
      case "remove_power_lines":
        prompt = renderRemovePowerLinesPrompt({ imageDescription, useCase })
        break
      case "pool_cleanup":
        prompt = renderPoolCleanupPrompt({ imageDescription, useCase })
        break
      case "change_camera_angle":
        prompt = renderChangeCameraAnglePrompt({
          imageDescription,
          useCase,
          roomType: angleRoomType,
          targetAngle: angleTarget,
          strength: angleStrength,
          lensMm: angleLens,
        })
        break
      case "plan_2d_to_3d_furnished":
        prompt = renderPlan2DTo3DFurnishedPrompt({
          imageDescription,
          useCase,
          style: planStyle,
          includeLabels: planIncludeLabels,
        })
        break
      default:
        toast.error("Unsupported tool.")
        return
    }

    setGeneratedPrompt(prompt)

    void startGeneration({ prompt, tool: mode })
  }

  const startGeneration = async ({ prompt, tool }: { prompt: string; tool: string }) => {
    if (!uploadedImage) return

    const token = ++generationTokenRef.current
    setIsGeneratingImage(true)
    setGeneratedImages([])
    setSelectedImageIndex(0)
    setFalRequestId(null)

    try {
      const submitResp = await fetch("/api/fal/nano-banana/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: falModel,
          prompt,
          image_url: uploadedImage,
          num_images: numVariants,
          output_format: "png",
        }),
      })

      const submitData = await submitResp.json().catch(() => ({}))
      if (!submitResp.ok) throw new Error(submitData?.error || "Failed to submit generation.")

      const requestId = submitData?.requestId as string | undefined
      if (!requestId) throw new Error("No requestId returned.")
      setFalRequestId(requestId)

      const startedAt = Date.now()
      const timeoutMs = 120_000
      const intervalMs = 1500

      while (Date.now() - startedAt < timeoutMs) {
        if (generationTokenRef.current !== token) return

        const statusResp = await fetch(
          `/api/fal/nano-banana/edit?requestId=${encodeURIComponent(requestId)}&model=${encodeURIComponent(falModel)}`,
        )
        const statusData = await statusResp.json().catch(() => ({}))
        if (!statusResp.ok) throw new Error(statusData?.error || "Failed to fetch generation status.")

        const status = statusData?.status as string | undefined
        if (status === "FAILED" || status === "CANCELLED") {
          throw new Error("Generation failed.")
        }
        if (status === "COMPLETED") {
          const images = (statusData?.images as FalImage[] | undefined) || []
          if (!images.length) throw new Error("No images returned.")
          setGeneratedImages(images)
          setSelectedImageIndex(0)
          addPhotoGeneration({
            tool,
            prompt,
            images: images.map((img) => ({
              url: img.url,
              content_type: img.content_type,
              file_name: img.file_name,
              width: img.width,
              height: img.height,
            })),
            propertyId: linkedPropertyId || null,
            contactId: linkedContactId || null,
            note: null,
          })
          return
        }

        await new Promise((r) => setTimeout(r, intervalMs))
      }

      throw new Error("Timed out waiting for generation.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      if (generationTokenRef.current === token) setIsGeneratingImage(false)
    }
  }

  useEffect(() => {
    return () => {
      generationTokenRef.current++
    }
  }, [])

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

        const defaultModel =
          typeof json?.fal?.model === "string" && json.fal.model.trim().length > 0 ? (json.fal.model as string).trim() : null
        if (defaultModel) setFalModel(defaultModel)
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const formatPropertyLabel = (p: (typeof properties)[number]) => {
    const street = typeof (p as any)?.address?.street === "string" ? (p as any).address.street : ""
    const city = typeof (p as any)?.address?.city === "string" ? (p as any).address.city : ""
    const ref = typeof (p as any)?.reference === "string" ? (p as any).reference : ""
    const title = typeof (p as any)?.title === "string" ? (p as any).title : ""

    const parts = title
      ? [title]
      : [ref, street, city].filter(Boolean)

    return parts.length ? parts.join(" • ") : ref || "Property"
  }

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Photo Tools</CardTitle>
            <CardDescription>Loading…</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-24 rounded-md border bg-muted/20" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Loading…</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-24 rounded-md border bg-muted/20" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload listing photo</CardTitle>
            <CardDescription>
              Upload a photo, optionally analyze it, then generate a Nano-style prompt for the selected tool.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!uploadedImage ? (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Drag and drop an image here, or click to select a file.</p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="re-photo-upload"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedImage} alt="Uploaded" className="h-auto max-h-80 w-full object-contain" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-full space-y-2">
                    <Label htmlFor="re-use-case">Use case</Label>
                    <Select value={useCase} onValueChange={(v) => setUseCase(v as (typeof useCases)[number])}>
                      <SelectTrigger id="re-use-case">
                        <SelectValue placeholder="Select a use case" />
                      </SelectTrigger>
                      <SelectContent>
                        {useCases.map((uc) => (
                          <SelectItem key={uc} value={uc}>
                            {uc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" onClick={handleAnalyzeImage} disabled={!canAnalyze} className="shrink-0">
                    {isAnalyzingImage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isAnalyzingImage ? "Analyzing..." : "Analyze image"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="re-image-description">Image description (optional)</Label>
                  <Textarea
                    id="re-image-description"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Use AI analysis or write a short description to improve results (e.g., 'Bright living room with parquet floor, large windows')."
                    className="min-h-[90px]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="re-link-property">Link to property (optional)</Label>
                    <Select value={linkedPropertyId || "none"} onValueChange={(v) => setLinkedPropertyId(v === "none" ? "" : v)}>
                      <SelectTrigger id="re-link-property">
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {formatPropertyLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="re-link-contact">Link to contact (optional)</Label>
                    <Select value={linkedContactId || "none"} onValueChange={(v) => setLinkedContactId(v === "none" ? "" : v)}>
                      <SelectTrigger id="re-link-contact">
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{modeTitle}</CardTitle>
            <CardDescription>Choose a tool and generate a precise prompt that preserves realism and architecture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="re-fal-model">Model</Label>
              <Select value={falModel} onValueChange={setFalModel}>
                <SelectTrigger id="re-fal-model">
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
                Choose the model used for the image edit. Higher quality models may cost more per edit.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="re-tool">Tool</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as ImageEditMode)}>
                <SelectTrigger id="re-tool">
                  <SelectValue placeholder="Select a tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="declutter_remove_furniture">Interior — Remove furniture (declutter)</SelectItem>
                  <SelectItem value="remove_personal_items">Interior — Remove personal items</SelectItem>
                  <SelectItem value="virtual_staging">Interior — Virtual staging (add furniture)</SelectItem>
                  <SelectItem value="replace_furniture_style">Interior — Replace furniture style</SelectItem>
                  <SelectItem value="virtual_renovation">Interior — Virtual renovation (materials)</SelectItem>
                  <SelectItem value="brighten_and_correct">Any — Brighten & correct (pro edit)</SelectItem>
                  <SelectItem value="straighten_perspective">Any — Straighten perspective</SelectItem>
                  <SelectItem value="day_to_twilight">Exterior — Day → Twilight</SelectItem>
                  <SelectItem value="sky_replacement">Exterior — Sky replacement</SelectItem>
                  <SelectItem value="remove_cars_people">Exterior — Remove cars & people</SelectItem>
                  <SelectItem value="enhance_landscaping">Exterior — Enhance landscaping</SelectItem>
                  <SelectItem value="remove_power_lines">Exterior — Remove power lines</SelectItem>
                  <SelectItem value="pool_cleanup">Exterior — Pool cleanup</SelectItem>
                  <SelectItem value="change_camera_angle">Interior — Change camera angle</SelectItem>
                  <SelectItem value="plan_2d_to_3d_furnished">Floor plan — 2D → 3D furnished</SelectItem>
                </SelectContent>
              </Select>
              {modeDescription ? <p className="text-sm text-muted-foreground">{modeDescription}</p> : null}
            </div>

            {mode === "virtual_staging" ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="re-staging-style">Style</Label>
                    <Select value={stagingStyle} onValueChange={(v) => setStagingStyle(v as VirtualStagingStyle)}>
                      <SelectTrigger id="re-staging-style">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        {VIRTUAL_STAGING_STYLES.map((styleOption) => (
                          <SelectItem key={styleOption.id} value={styleOption.id}>
                            {styleOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="re-staging-occupancy">Occupancy</Label>
                    <Select
                      value={stagingOccupancy}
                      onValueChange={(v) => setStagingOccupancy(v as "empty" | "partly_furnished")}
                    >
                      <SelectTrigger id="re-staging-occupancy">
                        <SelectValue placeholder="Select occupancy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empty">Empty</SelectItem>
                        <SelectItem value="partly_furnished">Partly furnished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="re-staging-roomtype">Room type</Label>
                  <Input
                    id="re-staging-roomtype"
                    value={stagingRoomType}
                    onChange={(e) => setStagingRoomType(e.target.value)}
                    placeholder="e.g., living room, bedroom, open plan kitchen"
                  />
                </div>
              </div>
            ) : null}

            {mode === "replace_furniture_style" ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="re-restyle-style">Style</Label>
                    <Select value={restyleStyle} onValueChange={(v) => setRestyleStyle(v as VirtualStagingStyle)}>
                      <SelectTrigger id="re-restyle-style">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        {VIRTUAL_STAGING_STYLES.map((styleOption) => (
                          <SelectItem key={styleOption.id} value={styleOption.id}>
                            {styleOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="re-restyle-intensity">Intensity</Label>
                    <Select value={restyleIntensity} onValueChange={(v) => setRestyleIntensity(v as "light" | "full")}>
                      <SelectTrigger id="re-restyle-intensity">
                        <SelectValue placeholder="Select intensity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light (keep layout)</SelectItem>
                        <SelectItem value="full">Full restyle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="re-restyle-roomtype">Room type</Label>
                  <Input
                    id="re-restyle-roomtype"
                    value={restyleRoomType}
                    onChange={(e) => setRestyleRoomType(e.target.value)}
                    placeholder="e.g., living room, bedroom, dining area"
                  />
                </div>
              </div>
            ) : null}

            {mode === "virtual_renovation" ? (
              <div className="space-y-2">
                <Label htmlFor="re-renovation-request">Renovation request</Label>
                <Textarea
                  id="re-renovation-request"
                  value={renovationRequest}
                  onChange={(e) => setRenovationRequest(e.target.value)}
                  placeholder="e.g., Paint walls warm white, replace floor with light oak, modernize kitchen cabinets to matte white with black handles."
                  className="min-h-[100px]"
                />
              </div>
            ) : null}

            {mode === "change_camera_angle" ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="re-angle-target">Target angle</Label>
                    <Select
                      value={angleTarget}
                      onValueChange={(v) =>
                        setAngleTarget(
                          v as
                            | "top_down"
                            | "high_corner"
                            | "eye_level_straight"
                            | "low_angle"
                            | "three_quarter_left"
                            | "three_quarter_right",
                        )
                      }
                    >
                      <SelectTrigger id="re-angle-target">
                        <SelectValue placeholder="Select angle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top_down">Top-down / overhead</SelectItem>
                        <SelectItem value="high_corner">High corner (slight down)</SelectItem>
                        <SelectItem value="eye_level_straight">Eye-level straight-on</SelectItem>
                        <SelectItem value="three_quarter_left">3/4 from left</SelectItem>
                        <SelectItem value="three_quarter_right">3/4 from right</SelectItem>
                        <SelectItem value="low_angle">Low angle (slight up)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="re-angle-strength">Strength</Label>
                    <Select value={angleStrength} onValueChange={(v) => setAngleStrength(v as "subtle" | "moderate" | "strong")}>
                      <SelectTrigger id="re-angle-strength">
                        <SelectValue placeholder="Select strength" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subtle">Subtle</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="re-angle-lens">Lens</Label>
                    <Select value={String(angleLens)} onValueChange={(v) => setAngleLens(Number(v) as 16 | 18 | 24 | 28 | 35)}>
                      <SelectTrigger id="re-angle-lens">
                        <SelectValue placeholder="Select lens" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16">16mm</SelectItem>
                        <SelectItem value="18">18mm</SelectItem>
                        <SelectItem value="24">24mm</SelectItem>
                        <SelectItem value="28">28mm</SelectItem>
                        <SelectItem value="35">35mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="re-angle-roomtype">Room type</Label>
                    <Input
                      id="re-angle-roomtype"
                      value={angleRoomType}
                      onChange={(e) => setAngleRoomType(e.target.value)}
                      placeholder="e.g., living room, bedroom, kitchen"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "plan_2d_to_3d_furnished" ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="re-plan-style">Furnishing style</Label>
                    <Select value={planStyle} onValueChange={(v) => setPlanStyle(v as VirtualStagingStyle)}>
                      <SelectTrigger id="re-plan-style">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        {VIRTUAL_STAGING_STYLES.map((styleOption) => (
                          <SelectItem key={styleOption.id} value={styleOption.id}>
                            {styleOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Labels</Label>
                    <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                      <Checkbox
                        checked={planIncludeLabels}
                        onCheckedChange={(v) => setPlanIncludeLabels(Boolean(v))}
                        id="re-plan-labels"
                      />
                      <Label htmlFor="re-plan-labels" className="text-sm font-normal">
                        Include room names in the 3D plan
                      </Label>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Tip: upload the highest-resolution plan you have (with clean lines). If labels/dimensions are present,
                  keep them readable in the input.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full space-y-2">
                <Label htmlFor="re-variants">Variants</Label>
                <Select value={String(numVariants)} onValueChange={(v) => setNumVariants(Number(v) as 1 | 2 | 3 | 4)}>
                  <SelectTrigger id="re-variants">
                    <SelectValue placeholder="Select number of variants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {falRequestId ? (
                <div className="text-xs text-muted-foreground sm:pb-2">Request: {falRequestId.slice(0, 8)}…</div>
              ) : null}
            </div>

            <Button onClick={handleGenerate} className="w-full" disabled={!uploadedImage || isGeneratingImage}>
              {isGeneratingImage ? "Generating image…" : "Generate image"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Recent generations (stored locally on this browser).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {photoGenerations
              .filter((g) => (linkedPropertyId ? g.propertyId === linkedPropertyId : true))
              .filter((g) => (linkedContactId ? g.contactId === linkedContactId : true))
              .slice(0, 10)
              .map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="w-full rounded-md border bg-muted/30 p-3 text-left hover:bg-muted/50"
                  onClick={() => {
                    setGeneratedPrompt(g.prompt)
                    setGeneratedImages(g.images.map((img) => ({ url: img.url, width: img.width, height: img.height })))
                    setSelectedImageIndex(0)
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{g.tool.replaceAll("_", " ")}</div>
                    <div className="text-xs text-muted-foreground">{new Date(g.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{g.images.length} image(s)</div>
                </button>
              ))}
            {!photoGenerations.length ? <div className="text-sm text-muted-foreground">No generations yet.</div> : null}
          </CardContent>
        </Card>
      </div>

      <ImageResult
        originalUrl={uploadedImage}
        images={generatedImages}
        selectedIndex={selectedImageIndex}
        onSelectImage={setSelectedImageIndex}
        isLoading={isGeneratingImage}
        prompt={generatedPrompt}
        onRegenerate={generatedPrompt ? () => void startGeneration({ prompt: generatedPrompt, tool: mode }) : undefined}
      />
    </div>
  )
}
