export type HeadshotUseCase = "photorealistic"

export type HeadshotStyleId =
  | "studio_grey"
  | "studio_light"
  | "modern_office"
  | "outdoor_soft"
  | "bw_dramatic"

export type HeadshotStyle = {
  id: HeadshotStyleId
  name: string
  description: string
  promptStyle: string
}

export const HEADSHOT_STYLES: HeadshotStyle[] = [
  {
    id: "studio_grey",
    name: "Studio (Grey)",
    description: "Most common: clean studio look with neutral background.",
    promptStyle:
      "studio headshot; solid medium-grey seamless backdrop; clean modern retouching; natural skin texture; professional corporate portrait",
  },
  {
    id: "modern_office",
    name: "Modern Office",
    description: "Approachable and premium: blurred office background.",
    promptStyle:
      "modern tech office headshot; soft natural window light; premium interior bokeh; shallow depth of field; approachable professional vibe",
  },
  {
    id: "outdoor_soft",
    name: "Outdoor (Soft)",
    description: "Warm and friendly: natural light with soft greenery blur.",
    promptStyle:
      "outdoor business headshot; soft natural daylight; blurred greenery background; warm tones; shallow depth of field; friendly and confident",
  },
  {
    id: "bw_dramatic",
    name: "Black & White",
    description: "Timeless: monochrome with sculpted studio lighting.",
    promptStyle:
      "classic black and white headshot; dramatic Rembrandt lighting; high-contrast but natural; crisp detail; timeless editorial portrait",
  },
]

export type HeadshotMode = "full_headshot" | "clothes_only"

export type HeadshotOutfitPresetId = "agent_suit" | "smart_casual" | "neutral_tshirt" | "custom"

export type HeadshotOutfitPreset = { id: HeadshotOutfitPresetId; name: string; description: string; outfitPrompt: string }

export const HEADSHOT_OUTFITS: HeadshotOutfitPreset[] = [
  {
    id: "agent_suit",
    name: "Agent Suit",
    description: "Safe default: blazer + shirt (no loud patterns).",
    outfitPrompt:
      "a sharp, well-fitted dark navy or charcoal blazer over a crisp light shirt; modern, premium, real-estate agent look; no logos",
  },
  {
    id: "smart_casual",
    name: "Smart Casual",
    description: "Approachable: knit/polo + blazer optional.",
    outfitPrompt:
      "smart-casual professional outfit: neutral knit or polo with optional light blazer; modern and approachable; no logos, no bold patterns",
  },
  {
    id: "neutral_tshirt",
    name: "Neutral Top",
    description: "Minimal: plain neutral top (for clean focus).",
    outfitPrompt: "a plain neutral top (grey/white/black), minimal and professional; no logos",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Describe the outfit in your own words.",
    outfitPrompt: "",
  },
]

function normalizeOutfit(outfitPreset: HeadshotOutfitPresetId, customOutfit: string) {
  if (outfitPreset === "custom") return customOutfit.trim()
  const preset = HEADSHOT_OUTFITS.find((o) => o.id === outfitPreset)
  return preset?.outfitPrompt || ""
}

export function renderHeadshotPrompt(args: {
  mode: HeadshotMode
  useCase: HeadshotUseCase
  styleId: HeadshotStyleId
  outfitPreset: HeadshotOutfitPresetId
  customOutfit: string
  includePoseReference: boolean
  includeOutfitReferences: boolean
}) {
  const style = HEADSHOT_STYLES.find((s) => s.id === args.styleId) ?? HEADSHOT_STYLES[0]!
  const outfit = normalizeOutfit(args.outfitPreset, args.customOutfit)

  const baseInputs: string[] = [
    "- I1: id=selfie, description=\"User selfie\", min_short_edge_px=1500, rights_confirmed=true",
  ]
  if (args.includePoseReference) {
    baseInputs.push(
      "- I2: id=pose_ref, description=\"Pose / style reference (background + lighting)\", min_short_edge_px=1500, rights_confirmed=true",
    )
  }
  if (args.includeOutfitReferences) {
    baseInputs.push(
      "- I3+: id=outfit_refs, description=\"Outfit reference images (clothing only)\", min_short_edge_px=1024, rights_confirmed=true",
    )
  }

  if (args.mode === "clothes_only") {
    return [
      "MODE: edit / inpaint (semantic)",
      "",
      "INPUTS:",
      ...baseInputs,
      "",
      "CONTEXT:",
      "Replace ONLY the outfit/clothing of the person while preserving face identity, hair, pose, lighting, and background exactly.",
      "",
      `GOOGLE_USE_CASE: ${args.useCase}`,
      "EDIT_INTENT: clothing replacement, identity lock",
      "",
      "PRESERVE (with PRIORITY):",
      "- identity(face shape, eyes, nose, lips, skin tone, hairline) [1.0]",
      "- facial expression and gaze [1.0]",
      "- pose and body position [0.95]",
      "- background and environment [0.95]",
      "- lighting direction, softness, and shadows [0.95]",
      "",
      "MODIFY:",
      `- R1 → replace clothing with: ${outfit || "professional neutral outfit"}; keep fabric realistic and correctly fitted; no logos`,
      "",
      "NEGATIVE (SEMANTIC BANS):",
      "- avoid changing face identity or expression",
      "- avoid changing background, cropping, or camera angle",
      "- avoid warped hands/arms, broken collars, weird ties, missing buttons",
      "- avoid plastic skin, over-smoothing, or painterly texture",
      "",
      "QUALITY & OUTPUT:",
      "- photorealistic headshot result; natural skin texture; sharp eyes; clean edges; no artifacts",
      "Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.",
    ].join("\n")
  }

  return [
    "MODE: image_to_image (identity-preserving headshot)",
    "",
    "INPUTS:",
    ...baseInputs,
    "",
    "CONTEXT:",
    "Create a professional real-estate agent headshot suitable for listings, brochures, business cards, and portals. Improve lighting and background while preserving the person’s identity.",
    "",
    "NARRATIVE:",
    "A polished, modern, photorealistic headshot. The subject looks confident, approachable, and professional. Background is clean and premium with studio-grade lighting and natural skin texture.",
    "",
    `GOOGLE_USE_CASE: ${args.useCase}`,
    "EDIT_INTENT: portrait enhancement + background upgrade + optional wardrobe styling",
    "",
    "PRESERVE (with PRIORITY):",
    "- identity(face shape, eyes, nose, lips, skin tone, hairline) [1.0]",
    "- facial expression and gaze [1.0]",
    "- hairstyle and hair color [0.95]",
    "- head proportions and jawline [0.95]",
    "",
    "MODIFY (atomic, quantified):",
    `- R1 → apply headshot style: ${style.promptStyle}`,
    outfit
      ? `- R1 → wardrobe: ${outfit}; correct fit; natural folds; no logos; keep neck/shoulder anatomy consistent`
      : "- R1 → wardrobe: keep clothing professional; remove visible logos/branding if present",
    "- R1 → retouching: natural (no plastic skin); reduce blemishes subtly; preserve pores; eye clarity boost without changing eye shape",
    "- R1 → framing: head-and-shoulders; crop consistent; no extreme zoom; avoid distortion",
    "",
    "LIGHTING:",
    "- flattering portrait lighting; key light soft; controlled shadows; exposure drift ≤ ±0.2 EV",
    "",
    "CAMERA/LOOK:",
    "- lens equivalent 50–85mm; shallow depth of field; crisp focus on eyes; no wide-angle distortion",
    "",
    "NEGATIVE (SEMANTIC BANS):",
    "- avoid identity drift, changed facial features, or different expression",
    "- avoid heavy beauty filters, waxy skin, or over-sharpened halos",
    "- avoid distorted glasses, melted ears, warped hands",
    "- avoid adding text or watermarks",
    "",
    "QUALITY & OUTPUT:",
    "- photorealistic; professional headshot; clean background; suitable for marketing",
    "Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.",
  ].join("\n")
}

