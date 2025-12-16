"use client"

import type React from "react"
import { useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PromptDisplay } from "@/components/prompt-master/prompt-display"
import { Input } from "@/components/ui/input"
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Square,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const useCases = [
  "photorealistic",
  "stylized/illustration",
  "product mockup",
  "minimalist",
  "sequential art",
  "accurate text rendering",
]

type RealEstatePresetId =
  | "none"
  | "declutter_remove_furniture"
  | "remove_personal_items"
  | "twilight_conversion"
  | "sky_replacement"

const realEstatePresets: Array<{
  id: RealEstatePresetId
  title: string
  description: string
  defaultUseCase: (typeof useCases)[number]
}> = [
  {
    id: "none",
    title: "No preset",
    description: "Use the standard prompt builder.",
    defaultUseCase: "photorealistic",
  },
  {
    id: "declutter_remove_furniture",
    title: "Declutter (Remove furniture)",
    description: "Remove all movable furniture and objects, keep architecture intact.",
    defaultUseCase: "photorealistic",
  },
  {
    id: "remove_personal_items",
    title: "Remove personal items",
    description: "Remove photos, toiletries, clutter, branding, and personal belongings.",
    defaultUseCase: "photorealistic",
  },
  {
    id: "twilight_conversion",
    title: "Day → Twilight",
    description: "Convert exterior daylight shot into professional twilight with warm interior glow.",
    defaultUseCase: "photorealistic",
  },
  {
    id: "sky_replacement",
    title: "Sky replacement",
    description: "Replace sky with clean, realistic sky while preserving edges and reflections.",
    defaultUseCase: "photorealistic",
  },
]

const getColorPaletteDescription = (palette: string, customColors?: string): string => {
  if (customColors && customColors.trim()) return `custom colors: ${customColors}`
  switch (palette) {
    case "warm":
      return "warm tones with rich reds, oranges, and golden yellows"
    case "cool":
      return "cool tones with calming blues, greens, and purples"
    case "monochrome":
      return "monochromatic scheme with blacks, whites, and grayscale tones"
    case "pastel":
      return "soft pastel colors with light, airy, and gentle hues"
    case "vibrant":
      return "vibrant saturated colors with high contrast and intensity"
    case "earth":
      return "natural earth tones with browns, greens, and tans"
    case "neon":
      return "electric neon colors with fluorescent and glowing effects"
    case "vintage":
      return "vintage aged colors with muted, nostalgic tones"
    case "cyberpunk":
      return "cyberpunk palette with electric blues, pinks, and purples"
    case "sunset":
      return "sunset gradients with warm oranges, pinks, and purples"
    case "ocean":
      return "ocean colors with deep blues, teals, and aquas"
    case "forest":
      return "forest palette with natural greens, browns, and earth tones"
    case "desert":
      return "desert colors with warm tans, oranges, and reds"
    case "arctic":
      return "arctic colors with cool whites, blues, and icy tones"
    default:
      return "harmonized with scene mood"
  }
}

type SelectedRegion = {
  id: string
  type: "bbox" | "semantic"
  coordinates?: { x: number; y: number; width: number; height: number }
  description: string
  editRequest: string
}

export function PromptGenerator() {
  const [preset, setPreset] = useState<RealEstatePresetId>("none")
  const [rawRequest, setRawRequest] = useState("")
  const [useCase, setUseCase] = useState(useCases[0])
  const [narrative, setNarrative] = useState("")
  const [style, setStyle] = useState("")
  const [lighting, setLighting] = useState("")
  const [camera, setCamera] = useState("")
  const [negatives, setNegatives] = useState("")
  const [imageSize, setImageSize] = useState("1024x1024")
  const [colorPalette] = useState("natural")
  const [customColors, setCustomColors] = useState("")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [showAdvancedFields, setShowAdvancedFields] = useState(false)

  // Image states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageDescription, setImageDescription] = useState("")
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reference states
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceDescription, setReferenceDescription] = useState("")
  const [isAnalyzingReference, setIsAnalyzingReference] = useState(false)
  const [referenceIdea, setReferenceIdea] = useState("")
  const referenceFileInputRef = useRef<HTMLInputElement>(null)

  // Region selection states
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([])
  const [isSelectingRegion, setIsSelectingRegion] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [currentSelection, setCurrentSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [showRegionDialog, setShowRegionDialog] = useState(false)
  const [editingRegion, setEditingRegion] = useState<string | null>(null)
  const [regionEditRequest, setRegionEditRequest] = useState("")

  const handleAiSuggestion = async () => {
    if (!rawRequest.trim()) {
      toast.error("Please enter your idea first.")
      return
    }

    setIsSuggesting(true)
    toast.info("AI is generating suggestions...")

    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: rawRequest }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to get suggestions.")
      }

      const suggestions = await response.json()
      setUseCase(suggestions.useCase || useCases[0])
      setNarrative(suggestions.narrative || "")
      setStyle(suggestions.style || "")
      setLighting(suggestions.lighting || "")
      setCamera(suggestions.camera || "")
      setNegatives(suggestions.negatives || "")
      setShowAdvancedFields(false)
      toast.success("AI suggestions have been applied!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsSuggesting(false)
    }
  }

  const applyPreset = (id: RealEstatePresetId) => {
    setPreset(id)
    const presetConfig = realEstatePresets.find((p) => p.id === id)
    setUseCase(presetConfig?.defaultUseCase ?? "photorealistic")

    switch (id) {
      case "declutter_remove_furniture":
        setNarrative(
          "The interior space appears empty, open, and move-in ready. All furniture and movable objects are removed seamlessly, revealing continuous floors and clean walls. Natural lighting, room proportions, and architectural character remain unchanged, resulting in a realistic, professionally decluttered interior suitable for real-estate presentation.",
        )
        setStyle("Photorealistic architectural photography, neutral tones, natural textures, crisp edges")
        setLighting("Preserve original light direction, softness, shadows; exposure drift ≤ ±0.2 EV; no new light sources")
        setCamera("Preserve original lens geometry, verticals, horizon, vanishing points; no perspective warp")
        setNegatives(
          "ghost outlines or silhouettes, duplicated textures, stretched floor patterns, lighting changes, added objects, blur, plastic surfaces, painterly artifacts",
        )
        setShowAdvancedFields(true)
        return

      case "remove_personal_items":
        setNarrative(
          "The space feels clean, neutral, and listing-ready. Remove personal belongings and visual clutter while preserving the room’s architecture, finishes, and lighting. Maintain realistic surface continuity and natural shadows.",
        )
        setStyle("Photorealistic real-estate photography, neutral grading, clean surfaces, accurate materials")
        setLighting("Preserve original lighting and shadows; exposure drift ≤ ±0.2 EV")
        setCamera("Maintain original perspective and geometry; no lens distortion changes")
        setNegatives("missing edges, smeared textures, duplicated patterns, unnatural blur, new objects, watermark, text")
        setShowAdvancedFields(true)
        return

      case "twilight_conversion":
        setNarrative(
          "Convert the exterior to a premium twilight listing photo. Keep the building materials and landscaping unchanged while shifting the sky to dusk and adding warm interior window glow. Preserve realism and the original camera perspective.",
        )
        setStyle("Photorealistic premium real-estate twilight, subtle contrast, natural color transitions")
        setLighting("Dusk ambient with soft sky fill; warm interior glow ~3000K; exposure drift ≤ ±0.3 EV")
        setCamera("Preserve composition, lens, verticals; no scale drift")
        setNegatives("over-saturation, fake glow halos, blown highlights, crushed shadows, HDR artifacts, added objects")
        setShowAdvancedFields(true)
        return

      case "sky_replacement":
        setNarrative(
          "Replace the sky with a clean, realistic sky that matches the scene’s lighting and color temperature. Preserve rooflines, trees, windows, and reflections without halos or cutout edges.",
        )
        setStyle("Photorealistic real-estate photo, clean sky, natural gradients, high edge fidelity")
        setLighting("Match original light direction and softness; no exposure shift beyond ±0.2 EV")
        setCamera("Maintain original perspective and scale; no warping")
        setNegatives("halo edges, cutout artifacts, banding, mismatched reflections, unnatural clouds, blur")
        setShowAdvancedFields(true)
        return

      default:
        setNarrative("")
        setStyle("")
        setLighting("")
        setCamera("")
        setNegatives("")
        return
    }
  }

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
      toast.success("Image uploaded successfully!")
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyzeImage = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first.")
      return
    }

    setIsAnalyzingImage(true)
    toast.info("AI is analyzing your image...")

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage }),
      })

      const analysis = await response.json()
      if (!response.ok) {
        throw new Error(analysis.error || "Failed to analyze image.")
      }

      setImageDescription(analysis.description || "")
      setUseCase(analysis.useCase || useCases[0])
      setNarrative(analysis.narrative || "")
      setStyle(analysis.style || "")
      setLighting(analysis.lighting || "")
      setCamera(analysis.camera || "")
      setNegatives(analysis.negatives || "")
      setRawRequest(analysis.description || "")

      toast.success("Image analyzed successfully! Suggestions have been applied.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
    setImageDescription("")
    setSelectedRegions([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleReferenceUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string)
      setReferenceDescription("")
      toast.success("Reference image uploaded successfully!")
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyzeReference = async () => {
    if (!referenceImage) {
      toast.error("Please upload a reference image first.")
      return
    }
    if (!referenceIdea.trim()) {
      toast.error("Please enter your idea for the reference.")
      return
    }

    setIsAnalyzingReference(true)
    toast.info("AI is analyzing your reference...")

    try {
      const response = await fetch("/api/analyze-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: referenceImage, idea: referenceIdea }),
      })

      const analysis = await response.json()
      if (!response.ok) throw new Error(analysis.error || "Failed to analyze reference.")

      setReferenceDescription(analysis.description || "")
      setUseCase(analysis.useCase || useCases[0])
      setNarrative(analysis.narrative || "")
      setStyle(analysis.style || "")
      setLighting(analysis.lighting || "")
      setCamera(analysis.camera || "")
      setNegatives(analysis.negatives || "")
      setRawRequest(analysis.description || "")
      setShowAdvancedFields(false)

      toast.success("Reference analyzed successfully! Suggestions have been applied.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsAnalyzingReference(false)
    }
  }

  const handleRemoveReference = () => {
    setReferenceImage(null)
    setReferenceDescription("")
    setReferenceIdea("")
    if (referenceFileInputRef.current) referenceFileInputRef.current.value = ""
  }

  const handleImageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectingRegion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setSelectionStart({ x, y })
    setCurrentSelection(null)
  }

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectingRegion || !selectionStart) return
    const rect = e.currentTarget.getBoundingClientRect()
    const currentX = ((e.clientX - rect.left) / rect.width) * 100
    const currentY = ((e.clientY - rect.top) / rect.height) * 100
    const width = Math.abs(currentX - selectionStart.x)
    const height = Math.abs(currentY - selectionStart.y)
    const x = Math.min(selectionStart.x, currentX)
    const y = Math.min(selectionStart.y, currentY)
    setCurrentSelection({ x, y, width, height })
  }

  const handleImageMouseUp = () => {
    if (!isSelectingRegion || !selectionStart || !currentSelection) return
    if (currentSelection.width > 2 && currentSelection.height > 2) {
      setShowRegionDialog(true)
    } else {
      setSelectionStart(null)
      setCurrentSelection(null)
    }
  }

  const handleAddOrUpdateRegion = () => {
    if (!currentSelection && !editingRegion) return
    if (!regionEditRequest.trim()) return

    if (editingRegion) {
      setSelectedRegions((prev) =>
        prev.map((r) => (r.id === editingRegion ? { ...r, editRequest: regionEditRequest, description: regionEditRequest } : r)),
      )
    } else if (currentSelection) {
      const newRegion: SelectedRegion = {
        id: `R${selectedRegions.length + 1}`,
        type: "bbox",
        coordinates: currentSelection,
        description: regionEditRequest,
        editRequest: regionEditRequest,
      }
      setSelectedRegions((prev) => [...prev, newRegion])
    }

    setRegionEditRequest("")
    setShowRegionDialog(false)
    setSelectionStart(null)
    setCurrentSelection(null)
    setIsSelectingRegion(false)
    setEditingRegion(null)
    toast.success(editingRegion ? "Region updated!" : "Region added successfully!")
  }

  const handleEditRegion = (regionId: string) => {
    const region = selectedRegions.find((r) => r.id === regionId)
    if (!region) return
    setEditingRegion(regionId)
    setRegionEditRequest(region.editRequest)
    setShowRegionDialog(true)
  }

  const handleRemoveRegion = (regionId: string) => {
    setSelectedRegions((prev) => prev.filter((r) => r.id !== regionId))
    toast.success("Region removed!")
  }

  const handleGenerate = () => {
    const promptParts: string[] = []
    promptParts.push(`MODE: [text2img]`)
    promptParts.push("")
    promptParts.push("INPUTS:")
    promptParts.push(`- I1: [id=concept_ref, description="${rawRequest}", min_short_edge_px=1024, rights? true]`)
    promptParts.push("")
    promptParts.push("CONTEXT: [Generate new image from text description]")
    promptParts.push(
      `NARRATIVE: [${narrative || `Create a visually compelling scene featuring ${rawRequest}, with careful attention to composition, lighting, and atmospheric mood.`}]`,
    )
    promptParts.push("")
    promptParts.push(`GOOGLE_USE_CASE: [${useCase}]`)
    promptParts.push("EDIT_INTENT: [global generation]")
    promptParts.push("")
    promptParts.push("PRESERVE (with priorities):")
    promptParts.push("- composition(rule-of-thirds | golden ratio) [0.9]")
    promptParts.push("- lighting(direction 45° L/+15°, contrast 1:2) [0.8]")
    promptParts.push("- texture(microtexture retain, edge integrity) [0.8]")
    promptParts.push("")
    promptParts.push("REGIONS:")
    promptParts.push('- R1: [semantic("entire scene")]')
    promptParts.push("")
    promptParts.push("MODIFY (atomic, quantified):")
    promptParts.push("- R1 → [generate from narrative], quality_target [production-ready]")
    promptParts.push("")
    promptParts.push("STYLE:")
    promptParts.push(`- [${style || "photographic realism with cinematic quality"}], palette [${getColorPaletteDescription(colorPalette, customColors)}]`)
    promptParts.push("")
    promptParts.push("LIGHTING:")
    promptParts.push(`- ${lighting || "key 45° camera-left, fill -0.5 EV, rim 5600K; softness medium"}`)
    promptParts.push("")
    promptParts.push("CAMERA/LOOK:")
    promptParts.push(`- ${camera || "shot: medium-angle, lens 50mm, f/2.8, grain ISO 200, DoF medium, bokeh circular"}`)
    promptParts.push("")
    promptParts.push("NEGATIVE (prefer semantic phrasing):")
    promptParts.push(`- ${negatives || "artificial plastic appearance, excessive smoothing, loss of fine detail, color banding, halo effects"}`)
    promptParts.push("")
    promptParts.push("QUALITY & OUTPUT:")
    const [width, height] = imageSize.split("x").map((n) => Number.parseInt(n, 10))
    promptParts.push(`- high-fidelity detail preservation; dimensions [${width}px × ${height}px]; upscale [1.5x] with texture preservation.`)

    setGeneratedPrompt(promptParts.join("\n"))
  }

  const handleGenerateFromReference = () => {
    const promptParts: string[] = []
    promptParts.push(`MODE: [text2img]`)
    promptParts.push("")
    promptParts.push("INPUTS:")
    promptParts.push(
      `- I1: [id=reference_ref, description="${referenceDescription || "Reference image analysis"}", min_short_edge_px=1024, rights? true]`,
    )
    promptParts.push(`- I2: [id=concept_ref, description="${referenceIdea}", min_short_edge_px=1024, rights? true]`)
    promptParts.push("")
    promptParts.push("CONTEXT: [Generate new image based on reference analysis and user idea]")
    promptParts.push(
      `NARRATIVE: [${narrative || `Create a visually compelling scene inspired by the reference, incorporating ${referenceIdea}, with careful attention to composition, lighting, and atmospheric mood.`}]`,
    )
    promptParts.push("")
    promptParts.push(`GOOGLE_USE_CASE: [${useCase}]`)
    promptParts.push("EDIT_INTENT: [global generation]")
    promptParts.push("")
    promptParts.push("REGIONS:")
    promptParts.push('- R1: [semantic("entire scene")]')
    promptParts.push("")
    promptParts.push("STYLE:")
    promptParts.push(`- [${style || "photographic realism with cinematic quality"}], palette [${getColorPaletteDescription(colorPalette, customColors)}], style_mix: [ref I1 weight 0.4]`)
    promptParts.push("")
    promptParts.push("LIGHTING:")
    promptParts.push(`- ${lighting || "key 45° camera-left, fill -0.5 EV, rim 5600K; softness medium"}`)
    promptParts.push("")
    promptParts.push("CAMERA/LOOK:")
    promptParts.push(`- ${camera || "shot: medium-angle, lens 50mm, f/2.8, grain ISO 200, DoF medium, bokeh circular"}`)
    promptParts.push("")
    promptParts.push("NEGATIVE (prefer semantic phrasing):")
    promptParts.push(`- ${negatives || "artificial plastic appearance, excessive smoothing, loss of fine detail, color banding, halo effects"}`)
    promptParts.push("")
    promptParts.push("QUALITY & OUTPUT:")
    const [width, height] = imageSize.split("x").map((n) => Number.parseInt(n, 10))
    promptParts.push(`- high-fidelity detail preservation; dimensions [${width}px × ${height}px]; upscale [1.5x] with texture preservation.`)
    setGeneratedPrompt(promptParts.join("\n"))
  }

  const handleGenerateFromImage = () => {
    if (preset === "declutter_remove_furniture") {
      const prompt = `MODE: edit / inpaint (semantic)

INPUTS:
- I1: id=base_image, description="${imageDescription || "Interior photograph to declutter"}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Create a clean, empty interior by removing all movable furniture and objects while fully preserving architectural structure, materials, lighting, and perspective.

NARRATIVE:
The interior space appears empty, open, and move-in ready. All furniture and movable objects are removed seamlessly, revealing continuous floors and clean walls. Natural lighting, room proportions, and architectural character remain unchanged, resulting in a realistic, professionally decluttered interior suitable for real-estate or architectural presentation.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: removing elements, semantic inpainting

PRESERVE (with PRIORITY):
- architecture (walls, ceilings, windows, doors, built-ins) [1.0]
- floor material (plank direction, tile pattern, reflections) [0.95]
- lighting (direction, softness, shadows, color temperature) [0.9]
- camera perspective & geometry (lens, horizon, verticals) [0.9]
- surface textures (paint grain, wood microtexture, glass clarity) [0.85]

REMOVE (SEMANTIC TARGETS):
- all seating furniture (chairs, sofas, stools, benches)
- all tables and desks (dining, coffee, side, work)
- beds, dressers, cabinets, nightstands
- rugs, floor decor, lamps, movable shelves
- electronics (TVs, monitors) and loose decorative objects

REGIONS:
- R1: semantic(\"all movable furniture on floor\")
- R2: semantic(\"seating furniture and tables\")
- R3: semantic(\"decor, rugs, electronics, movable objects\")

MODIFY:
- R1 → remove + semantic inpaint; reconstruct continuous floor surfaces with correct material continuity and plank/tile alignment (ΔE ≤ 2).
- R2 → remove; rebuild wall–floor and wall–window junctions with clean edges and realistic contact shadows.
- R3 → remove; extend background surfaces logically without repetition, warping, or blur.

HARMONIZE:
- lighting: preserve original light direction and softness; exposure drift ≤ ±0.2 EV
- shadows: regenerate only natural architectural shadows; no object shadows
- perspective: maintain original vanishing points and scale relationships

NEGATIVE (SEMANTIC BANS):
- avoid ghost outlines or furniture silhouettes
- avoid duplicated or stretched floor textures
- avoid lighting changes or added light sources
- avoid blur, plastic surfaces, painterly artifacts
- avoid adding new objects of any kind

ORDER OF OPERATIONS:
1) detect and remove furniture semantically
2) inpaint floors, walls, and background surfaces
3) restore natural shadow continuity
4) global realism and consistency pass

TOLERANCE:
- color shift ΔE ≤ 2
- perspective deviation ≤ 1°
- texture repetition visibility ≤ 5%

QUALITY & OUTPUT:
- photorealistic result
- high-fidelity detail preservation
- edge integrity maintained
- 16-bit sRGB
- output long edge ≥ 4096 px
- no stylization or artistic interpretation

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`

      setGeneratedPrompt(prompt)
      return
    }

    const promptParts: string[] = []
    promptParts.push("MODE: [image_to_image]")
    promptParts.push("")
    promptParts.push("INPUTS:")
    promptParts.push(
      `- I1: [id=base_image, description="${imageDescription || "Uploaded image for editing"}", min_short_edge_px=1500, rights? true]`,
    )
    promptParts.push("")
    promptParts.push("CONTEXT: [User-provided image for enhancement and editing]")
    promptParts.push(
      `NARRATIVE: [${narrative || "Enhance and modify the uploaded image while preserving core identity and composition, applying desired style and lighting improvements."}]`,
    )
    promptParts.push("")
    promptParts.push(`GOOGLE_USE_CASE: [${useCase}]`)
    const editIntent = selectedRegions.length > 0 ? "inpainting (semantic) | targeted editing" : "global grade | style enhancement"
    promptParts.push(`EDIT_INTENT: [${editIntent}]`)
    promptParts.push("")
    promptParts.push("REGIONS:")
    if (selectedRegions.length > 0) {
      selectedRegions.forEach((region) => {
        const bbox = region.coordinates
          ? `bbox(${region.coordinates.x.toFixed(2)},${region.coordinates.y.toFixed(2)},${region.coordinates.width.toFixed(2)},${region.coordinates.height.toFixed(2)})`
          : "semantic(region)"
        promptParts.push(`- ${region.id}: [${bbox}]`)
      })
    } else {
      promptParts.push('- R1: [semantic("entire image")]')
    }
    promptParts.push("")
    promptParts.push("MODIFY (atomic, quantified):")
    if (selectedRegions.length > 0) {
      selectedRegions.forEach((region) => {
        promptParts.push(`- ${region.id} → [inpaint semantic], prompt: "${region.editRequest}", perspective_match [true]`)
      })
    } else {
      promptParts.push("- R1 → [style transfer], weight [0.7], protect identity [true]")
      promptParts.push("- R1 → [global lighting grade], temp_adjust [±200K], intensity [±0.3 EV]")
    }
    promptParts.push("")
    promptParts.push("STYLE:")
    promptParts.push(`- [${style || "photographic realism with enhanced clarity and depth"}], palette [${getColorPaletteDescription(colorPalette, customColors)}], style_mix: [ref I1 weight 0.3]`)
    promptParts.push("")
    promptParts.push("LIGHTING:")
    promptParts.push(`- ${lighting || "key 45° camera-left, fill -0.5 EV, rim 5600K; softness medium"}`)
    promptParts.push("")
    promptParts.push("CAMERA/LOOK:")
    promptParts.push(`- ${camera || "shot: medium-angle, lens 50mm, f/2.8, grain ISO 200, DoF medium, bokeh circular"}`)
    promptParts.push("")
    promptParts.push("NEGATIVE (prefer semantic phrasing):")
    promptParts.push(`- ${negatives || "artificial plastic appearance, excessive smoothing, loss of fine detail, color banding, halo effects"}`)
    promptParts.push("")
    promptParts.push("QUALITY & OUTPUT:")
    const [width, height] = imageSize.split("x").map((n) => Number.parseInt(n, 10))
    promptParts.push(`- high-fidelity detail preservation; dimensions [${width}px × ${height}px]; upscale [1.5x] with texture preservation.`)
    setGeneratedPrompt(promptParts.join("\n"))
  }

  const advancedFields = (
    <div className="space-y-4 pt-2 border-t">
      <div className="space-y-2">
        <Label htmlFor="style">Style</Label>
        <Input
          id="style"
          placeholder="e.g., 'Vaporwave, neon colors, 80s aesthetic'"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lighting">Lighting</Label>
        <Input
          id="lighting"
          placeholder="e.g., 'Golden hour, soft shadows'"
          value={lighting}
          onChange={(e) => setLighting(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="camera">Camera / Look</Label>
        <Input
          id="camera"
          placeholder="e.g., 'Wide-angle, 24mm lens, cinematic'"
          value={camera}
          onChange={(e) => setCamera(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="negatives">Negative Prompt</Label>
        <Input
          id="negatives"
          placeholder="e.g., 'blurry, low quality, watermark'"
          value={negatives}
          onChange={(e) => setNegatives(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="custom-colors">Color Palette (Hex Codes)</Label>
        <Input
          id="custom-colors"
          placeholder="e.g., #FF5733, #33FF57, #3357FF"
          value={customColors}
          onChange={(e) => setCustomColors(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="image-size">Output Size</Label>
        <Select value={imageSize} onValueChange={setImageSize}>
          <SelectTrigger id="image-size">
            <SelectValue placeholder="Select output size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="512x512">512×512</SelectItem>
            <SelectItem value="768x768">768×768</SelectItem>
            <SelectItem value="1024x1024">1024×1024</SelectItem>
            <SelectItem value="1024x768">1024×768</SelectItem>
            <SelectItem value="768x1024">768×1024</SelectItem>
            <SelectItem value="1920x1080">1920×1080</SelectItem>
            <SelectItem value="1080x1920">1080×1920</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <>
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text">From Text</TabsTrigger>
          <TabsTrigger value="reference">From Reference</TabsTrigger>
          <TabsTrigger value="image">From Image</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Prompt from Text</CardTitle>
                <CardDescription>Real-estate prompt builder (listing photos, staging, edits).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Real Estate Preset</Label>
                  <Select value={preset} onValueChange={(v) => applyPreset(v as RealEstatePresetId)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {realEstatePresets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {realEstatePresets.find((p) => p.id === preset)?.description}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="raw-request">Your Idea</Label>
                    <Button variant="outline" size="sm" onClick={handleAiSuggestion} disabled={isSuggesting}>
                      {isSuggesting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {isSuggesting ? "Suggesting..." : "Suggest Details"}
                    </Button>
                  </div>
                  <Textarea
                    id="raw-request"
                    placeholder="e.g., 'A futuristic cityscape at sunset'"
                    value={rawRequest}
                    onChange={(e) => setRawRequest(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="use-case">Use Case</Label>
                  <Select value={useCase} onValueChange={setUseCase}>
                    <SelectTrigger id="use-case">
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

                <div className="space-y-2">
                  <Label htmlFor="narrative">Narrative</Label>
                  <Textarea
                    id="narrative"
                    placeholder="A detailed narrative describing the scene, action, and mood."
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    className="min-h-[120px] resize-y"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedFields((p) => !p)}
                    className="w-full justify-center text-muted-foreground hover:text-foreground"
                    type="button"
                  >
                    {showAdvancedFields ? (
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
                </div>

                {showAdvancedFields ? advancedFields : null}

                <Button onClick={handleGenerate} className="w-full" type="button">
                  Generate Prompt
                </Button>
              </CardContent>
            </Card>

            <PromptDisplay prompt={generatedPrompt} />
          </div>
        </TabsContent>

        <TabsContent value="reference">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Prompt from Reference</CardTitle>
                <CardDescription>Upload a reference image and describe your idea to generate a prompt based on both.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!referenceImage ? (
                  <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Upload a reference image (LinkedIn post, design, etc.)</p>
                    <Input
                      ref={referenceFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceUpload}
                      className="hidden"
                      id="reference-upload"
                    />
                    <Button variant="outline" onClick={() => referenceFileInputRef.current?.click()} type="button">
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload Reference
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img src={referenceImage} alt="Reference" className="w-full h-auto max-h-96 object-contain rounded-lg bg-muted" />
                      <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={handleRemoveReference} type="button">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reference-idea">Your Idea</Label>
                      <Textarea
                        id="reference-idea"
                        placeholder="Describe what you want to create based on this reference..."
                        value={referenceIdea}
                        onChange={(e) => setReferenceIdea(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <Button onClick={handleAnalyzeReference} disabled={isAnalyzingReference} className="w-full" type="button">
                      {isAnalyzingReference ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isAnalyzingReference ? "Analyzing..." : "Analyze Reference"}
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="reference-description">Reference Analysis</Label>
                      <Textarea
                        id="reference-description"
                        placeholder="AI analysis will appear here..."
                        value={referenceDescription}
                        onChange={(e) => setReferenceDescription(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button onClick={handleGenerateFromReference} className="w-full" type="button">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Reference-Based Prompt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <PromptDisplay prompt={generatedPrompt} />
          </div>
        </TabsContent>

        <TabsContent value="image">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Prompt from Image</CardTitle>
                <CardDescription>Upload a listing photo to analyze and generate an editing prompt.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Real Estate Preset</Label>
                  <Select value={preset} onValueChange={(v) => applyPreset(v as RealEstatePresetId)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {realEstatePresets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {realEstatePresets.find((p) => p.id === preset)?.description}
                  </p>
                </div>
                {!uploadedImage ? (
                  <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Drag and drop an image here, or click to select a file.</p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} type="button">
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <div
                        className={`relative w-full rounded-lg overflow-hidden bg-muted ${isSelectingRegion ? "cursor-crosshair" : "cursor-default"}`}
                        onMouseDown={handleImageMouseDown}
                        onMouseMove={handleImageMouseMove}
                        onMouseUp={handleImageMouseUp}
                        onMouseLeave={handleImageMouseUp}
                      >
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-auto max-h-96 object-contain" />

                        {selectedRegions.map((region) => (
                          <div
                            key={region.id}
                            className="absolute border-2 border-blue-500 bg-blue-500/20"
                            style={{
                              left: `${region.coordinates?.x || 0}%`,
                              top: `${region.coordinates?.y || 0}%`,
                              width: `${region.coordinates?.width || 0}%`,
                              height: `${region.coordinates?.height || 0}%`,
                            }}
                          >
                            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-1 rounded">{region.id}</div>
                          </div>
                        ))}

                        {currentSelection ? (
                          <div
                            className="absolute border-2 border-green-500 bg-green-500/20"
                            style={{
                              left: `${currentSelection.x}%`,
                              top: `${currentSelection.y}%`,
                              width: `${currentSelection.width}%`,
                              height: `${currentSelection.height}%`,
                            }}
                          />
                        ) : null}
                      </div>

                      <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={handleRemoveImage} type="button">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={isSelectingRegion ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsSelectingRegion((p) => !p)}
                        className="flex-1"
                        type="button"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        {isSelectingRegion ? "Selecting Region..." : "Select Region"}
                      </Button>
                      {selectedRegions.length > 0 ? (
                        <Button variant="outline" size="sm" onClick={() => setSelectedRegions([])} type="button">
                          Clear All
                        </Button>
                      ) : null}
                    </div>

                    {selectedRegions.length > 0 ? (
                      <div className="space-y-2">
                        <Label>Selected Regions</Label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedRegions.map((region) => (
                            <div key={region.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                              <div className="min-w-0 flex-1 truncate">
                                <span className="font-medium">{region.id}:</span> {region.editRequest}
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditRegion(region.id)} type="button">
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveRegion(region.id)} type="button">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="image-description">Image Description</Label>
                      <Textarea
                        id="image-description"
                        placeholder="AI will analyze your image..."
                        value={imageDescription}
                        onChange={(e) => setImageDescription(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button onClick={handleAnalyzeImage} disabled={isAnalyzingImage} className="w-full" type="button">
                      {isAnalyzingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isAnalyzingImage ? "Analyzing..." : "Analyze Image"}
                    </Button>

                    <Button onClick={handleGenerateFromImage} className="w-full" type="button">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image-to-Image Prompt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <PromptDisplay prompt={generatedPrompt} />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showRegionDialog}
        onOpenChange={(open) => {
          setShowRegionDialog(open)
          if (!open) {
            setRegionEditRequest("")
            setEditingRegion(null)
            setSelectionStart(null)
            setCurrentSelection(null)
            setIsSelectingRegion(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRegion ? "Edit Region" : "Add Region"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="region-edit-request">What do you want to change in this region?</Label>
              <Textarea
                id="region-edit-request"
                placeholder='e.g., "make the person smile", "change the car color to red"'
                value={regionEditRequest}
                onChange={(e) => setRegionEditRequest(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRegionDialog(false)
                setRegionEditRequest("")
                setEditingRegion(null)
                setSelectionStart(null)
                setCurrentSelection(null)
                setIsSelectingRegion(false)
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={handleAddOrUpdateRegion} disabled={!regionEditRequest.trim()} type="button">
              {editingRegion ? "Update" : "Add"} Region
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
