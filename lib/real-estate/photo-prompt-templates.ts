export type ImageEditMode =
  | "declutter_remove_furniture"
  | "remove_personal_items"
  | "day_to_twilight"
  | "sky_replacement"
  | "virtual_staging"
  | "replace_furniture_style"
  | "virtual_renovation"
  | "brighten_and_correct"
  | "straighten_perspective"
  | "remove_cars_people"
  | "enhance_landscaping"
  | "remove_power_lines"
  | "pool_cleanup"
  | "change_camera_angle"
  | "plan_2d_to_3d_furnished"

export type VirtualStagingStyle =
  | "scandinavian"
  | "modern"
  | "contemporary"
  | "minimalist"
  | "industrial"
  | "classic"
  | "luxury"
  | "boho"
  | "mid_century"
  | "coastal"
  | "japandi"

export const VIRTUAL_STAGING_STYLES: Array<{ id: VirtualStagingStyle; label: string }> = [
  { id: "scandinavian", label: "Scandinavian" },
  { id: "modern", label: "Modern" },
  { id: "contemporary", label: "Contemporary" },
  { id: "minimalist", label: "Minimalist" },
  { id: "industrial", label: "Industrial" },
  { id: "classic", label: "Classic" },
  { id: "luxury", label: "Luxury" },
  { id: "boho", label: "Boho" },
  { id: "mid_century", label: "Mid-century" },
  { id: "coastal", label: "Coastal" },
  { id: "japandi", label: "Japandi" },
]

function firstNonEmpty(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function formatImageInputDescription(fallback: string, imageDescription?: string) {
  return firstNonEmpty(imageDescription, fallback) ?? fallback
}

export function renderDeclutterRemoveFurniturePrompt(input: {
  imageDescription?: string
  useCase?: string
}) {
  const desc = formatImageInputDescription("Interior photograph to declutter", input.imageDescription)
  return `MODE: edit / inpaint (semantic)

INPUTS:
- I1: id=base_image,
      description="${desc}",
      min_short_edge_px=1500,
      rights_confirmed=true

CONTEXT:
Create a completely empty, unfurnished interior by removing ALL movable
furniture and loose objects, while strictly preserving architecture,
built-in elements, materials, lighting, and camera geometry.

NARRATIVE:
The room appears fully vacant and move-in ready. No movable furniture,
decor, electronics, or personal objects remain anywhere in the space,
including corners, reflections, or partially visible areas. Floors,
walls, and surfaces are continuous, clean, and realistic, with original
lighting and architectural character preserved for professional
real-estate presentation.

GOOGLE_USE_CASE: photorealistic interior editing
EDIT_INTENT: removing elements, semantic inpainting

PRESERVE (with PRIORITY):
- architectural structure (walls, ceilings, windows, doors) [1.0]
- built-ins only (fixed cabinetry, fixed closets, fixed shelves) [1.0]
- floor material & layout (plank direction, tile pattern, reflections) [0.95]
- lighting (direction, softness, color temperature) [0.9]
- camera perspective & geometry (lens, horizon, verticals) [0.9]
- surface microtexture & edge integrity [0.85]

REMOVE (SEMANTIC TARGETS — MUST BE ZERO AT END):
- all seating furniture (chairs, sofas, stools, benches)
- all tables and desks of any kind
- beds, nightstands, dressers
- freestanding cabinets and movable shelving (NOT built-ins)
- rugs, lamps, floor decor
- electronics (TVs, monitors, speakers)
- plants, baskets, wall decor, loose objects
- furniture visible in mirrors, glass, or reflections

REGIONS:
- R0: semantic("entire interior space excluding architecture")
- R1: semantic("all movable furniture on floor and against walls")
- R2: semantic("decor, rugs, electronics, loose objects")
- R3: semantic("reflections in mirrors or glass")

MODIFY:
- R0 → enforce global emptiness constraint
- R1 → remove + semantic inpaint; reconstruct continuous floor surfaces
        with correct material alignment and continuity (ΔE ≤ 2)
- R2 → remove; extend walls/floors logically with no repetition or blur
- R3 → remove reflected objects; preserve realistic glass behavior

HARMONIZE:
- lighting: preserve original direction and softness; exposure drift ≤ ±0.2 EV
- shadows: regenerate ONLY architectural contact shadows; no object shadows
- perspective: maintain original vanishing points; deviation ≤ 1°

NEGATIVE (SEMANTIC BANS):
- any remaining furniture, decor, or objects
- ghost outlines or silhouettes
- duplicated or stretched textures
- added or altered light sources
- blur, painterly artifacts, plastic surfaces
- introduction of new objects of any kind

ORDER OF OPERATIONS:
1) global semantic scan for movable objects
2) remove detected objects (first pass)
3) re-scan entire image for residual items (second pass)
4) inpaint floors, walls, and background surfaces
5) restore natural architectural shadows
6) final global realism consistency check

SUCCESS CRITERIA (HARD CONSTRAINT):
- 0 visible movable furniture items
- 0 decor or loose objects
- 0 rugs, lamps, electronics, or plants
- space reads as completely empty to a human viewer

TOLERANCE:
- color shift ΔE ≤ 2
- perspective deviation ≤ 1°
- texture repetition visibility ≤ 5%

QUALITY & OUTPUT:
- photorealistic
- high-fidelity detail preservation
- edge integrity maintained
- 16-bit sRGB
- output long edge ≥ 4096 px
- no stylization or artistic interpretation

Approach this task like an eagle: stay focused, rise above the noise,
and execute each step with clarity and precision.`
}

export function renderRemovePersonalItemsPrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Interior photograph to neutralize (remove personal items)", input.imageDescription)
  return `MODE: edit / inpaint (semantic)

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Create a neutral, listing-ready interior by removing personal items and clutter while preserving architecture, finishes, lighting, and perspective.

NARRATIVE:
The space feels clean, neutral, and ready to show. Personal belongings and clutter are removed seamlessly, leaving surfaces tidy and visually calm. Architectural elements, materials, and natural lighting remain unchanged for a realistic, marketing-ready result.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: removing elements, semantic inpainting

PRESERVE (with PRIORITY):
- architecture (walls, ceilings, windows, doors, built-ins) [1.0]
- materials (floors, countertops, cabinetry, tile) [0.95]
- lighting (direction, softness, shadows, color temperature) [0.9]
- camera perspective & geometry (lens, horizon, verticals) [0.9]
- reflections (mirrors, glass, glossy surfaces) [0.85]

REMOVE (SEMANTIC TARGETS):
- personal photos, frames, magnets, stickers, notes
- toiletries, towels, laundry, cosmetics
- cables, small appliances (when clutter), countertop clutter
- branding/logos, paperwork, visible names, personal memorabilia
- trash bins, pet items, random loose objects

REGIONS:
- R1: semantic("countertops and surfaces clutter")
- R2: semantic("walls and fridge / boards with personal items")
- R3: semantic("bathroom items, laundry, miscellaneous clutter")

MODIFY:
- R1 → remove + semantic inpaint; rebuild clean surface continuity with correct material pattern (ΔE ≤ 2).
- R2 → remove; reconstruct wall/fridge surfaces with realistic texture and no patch seams.
- R3 → remove; extend background surfaces logically; preserve natural contact shadows.

HARMONIZE:
- lighting: preserve original light direction; exposure drift ≤ ±0.2 EV
- shadows: regenerate only natural architectural shadows; no object shadows
- perspective: preserve original vanishing points and scale

NEGATIVE (SEMANTIC BANS):
- avoid blur, smears, plastic textures
- avoid duplicated patterns or visible tiling
- avoid adding any new objects or decorations
- avoid changing furniture layout or architecture
- avoid text artifacts or watermarks

ORDER OF OPERATIONS:
1) detect and remove personal items semantically
2) inpaint surfaces with clean continuity
3) restore natural shadows/reflections
4) final realism and consistency pass

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
- no stylization

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderDayToTwilightPrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Exterior property photo to convert to twilight", input.imageDescription)
  return `MODE: edit / global grade + targeted relight

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Transform a daylight exterior property photo into a premium twilight listing photo while preserving all structural details, landscaping, and camera perspective.

NARRATIVE:
The home is presented at dusk with a rich blue-hour sky and warm, inviting interior window glow. The building materials, landscaping, and details remain unchanged. The result looks like a real twilight photograph captured by a professional real-estate photographer—natural, clean, and high-end.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: color grading, relighting, sky enhancement

PRESERVE (with PRIORITY):
- architecture and materials (facade, rooflines, windows) [1.0]
- property details (paths, greenery, signage) [0.95]
- camera perspective & geometry (verticals, horizon) [0.9]
- reflections (windows, glossy surfaces) [0.85]

MODIFY (atomic, quantified):
- global → shift ambient to twilight (cooler WB, dusk contrast); exposure drift ≤ ±0.3 EV
- windows → add warm interior glow ~3000K; keep realistic falloff; halo ≤ 1px
- sky → replace/grade to blue-hour with smooth gradient; banding visibility ≤ 2%
- shadows → maintain plausible direction; no new inconsistent shadow casting

NEGATIVE (SEMANTIC BANS):
- avoid fake HDR look, over-saturation, crushed blacks
- avoid blown highlights or glowing halos around windows
- avoid changing building shape, adding lights, or adding objects
- avoid sky edge cutouts around trees/roof (halo/cutout)

ORDER OF OPERATIONS:
1) global twilight grade (WB + contrast)
2) sky enhancement/replacement (edge-safe)
3) add warm window glow (realistic intensity/falloff)
4) consistency pass (shadows/reflections)

TOLERANCE:
- color shift ΔE ≤ 3
- perspective deviation ≤ 1°
- edge halo around roof/trees ≤ 1px

QUALITY & OUTPUT:
- photorealistic premium twilight result
- high-fidelity detail preservation
- output long edge ≥ 4096 px
- no stylization

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderSkyReplacementPrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Exterior property photo for sky replacement", input.imageDescription)
  return `MODE: edit / inpaint (semantic)

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Replace the sky with a clean, realistic sky that matches scene lighting and color temperature while preserving rooflines, trees, windows, and reflections without halos.

NARRATIVE:
The property remains unchanged and realistic. The sky is replaced with a natural, clean sky (subtle clouds optional) that matches the original scene’s lighting direction and mood. All edges are crisp and believable—no cutout artifacts—producing a professional listing photo.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: sky replacement, semantic inpainting

PRESERVE (with PRIORITY):
- rooflines, trees, antennas, fine edges [1.0]
- building materials and colors [0.95]
- window reflections and glass clarity [0.9]
- camera perspective & geometry [0.9]

REGIONS:
- R1: semantic("sky")

MODIFY:
- R1 → replace sky; maintain clean gradients; banding visibility ≤ 2%
- edges → halo ≤ 1px; preserve fine branches and roof details
- reflections → update only if necessary; keep subtle realism; no mirror-like exaggeration

NEGATIVE (SEMANTIC BANS):
- avoid halos/cutouts around roof and trees
- avoid cartoon clouds, over-saturation, banding
- avoid changing lighting direction or exposure > ±0.2 EV
- avoid adding objects (birds, planes, drones)

ORDER OF OPERATIONS:
1) segment sky safely
2) inpaint/replace sky with realistic gradient
3) edge refinement pass
4) final realism pass (reflections and color match)

TOLERANCE:
- edge halo ≤ 1px
- exposure drift ≤ ±0.2 EV
- color shift ΔE ≤ 2

QUALITY & OUTPUT:
- photorealistic result
- high-fidelity detail preservation
- output long edge ≥ 4096 px
- no stylization

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderVirtualStagingPrompt(input: {
  imageDescription?: string
  useCase?: string
  style: VirtualStagingStyle
  roomType?: string
  occupancy?: "empty" | "partly_furnished"
}) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Empty interior photograph for virtual staging", input.imageDescription)
  const roomType = firstNonEmpty(input.roomType, "living room / open plan") ?? "living room / open plan"
  const occupancy = input.occupancy || "empty"

  const styleNotes: Record<VirtualStagingStyle, string> = {
    scandinavian: "light woods, neutral textiles, simple forms, minimal decor, cozy but uncluttered",
    modern: "clean lines, neutral palette with bold accents, contemporary furniture, minimal decor",
    contemporary: "current high-end neutral styling, layered textures, balanced decor, premium feel",
    minimalist: "very few pieces, clean negative space, neutral tones, no clutter, sharp geometry",
    industrial: "metal + wood, darker neutrals, concrete/brick feel, practical furniture, restrained decor",
    classic: "timeless forms, balanced symmetry, warm neutrals, subtle patterns, tasteful decor",
    luxury: "premium materials, elevated design, statement pieces, refined decor, upscale hotel vibe",
    boho: "warm earthy palette, natural textures, plants, layered textiles, curated decor (not cluttered)",
    mid_century: "mid-century silhouettes, tapered legs, walnut tones, graphic but restrained decor, warm neutrals",
    coastal: "light airy palette, soft whites and sands, natural fibers, relaxed furniture, subtle seaside accents",
    japandi: "Japanese + Scandinavian, warm minimalism, clean lines, natural wood, low-profile furniture, calm neutrals",
  }

  return `MODE: edit / inpaint (semantic) + composition-aware placement

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Virtually stage the space for a real-estate listing by adding furniture and decor in a realistic, perspective-correct way while preserving architecture, lighting, and materials.

NARRATIVE:
The room is staged as a ${roomType} in a ${input.style} style: ${styleNotes[input.style]}. The staging looks like a real photo: furniture is grounded with correct contact shadows, scale is accurate, and placements are practical for walking paths. Architecture, materials, and camera perspective remain unchanged.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: add elements, semantic inpainting (virtual staging)

PRESERVE (with PRIORITY):
- architecture (walls, ceilings, windows, doors, built-ins) [1.0]
- floor material & reflections (plank direction, tile pattern) [0.95]
- lighting (direction, softness, shadows, color temperature) [0.9]
- camera perspective & geometry (lens, horizon, verticals) [0.9]
- surface textures (paint grain, wood microtexture, glass clarity) [0.85]

ADD (SEMANTIC TARGETS):
- primary furniture appropriate for ${roomType} (sofa/bed/dining set) with correct scale
- secondary pieces (coffee table, side table, rug) without blocking doors/windows
- minimal decor (plants, art) consistent with ${input.style} style (no clutter)

CONSTRAINTS:
- occupancy: ${occupancy}; do not remove built-ins; do not alter room dimensions
- walking clearance: keep ≥ 80cm pathways where applicable
- keep windows unobstructed; keep radiators/vents accessible

HARMONIZE:
- lighting: match original light direction; add only plausible shadows; exposure drift ≤ ±0.2 EV
- shadows: realistic contact shadows; no floating furniture
- perspective: maintain original vanishing points; scale drift ≤ 1%
- reflections: update only where physically plausible (glass, glossy floors)

NEGATIVE (SEMANTIC BANS):
- avoid unrealistic scale or floating furniture
- avoid blocking doors/windows or awkward placements
- avoid over-decorating or clutter
- avoid changing wall/floor materials or color grading drastically
- avoid CGI look, plastic materials, blur, smeared textures

ORDER OF OPERATIONS:
1) detect room geometry and vanishing points
2) place primary furniture with correct scale and perspective
3) add secondary pieces and minimal decor
4) integrate shadows/reflections
5) final realism and consistency pass

TOLERANCE:
- color shift ΔE ≤ 2
- perspective deviation ≤ 1°
- scale drift ≤ 1%

QUALITY & OUTPUT:
- photorealistic, listing-ready virtual staging
- high-fidelity detail preservation
- output long edge ≥ 4096 px
- no stylization beyond the chosen staging style

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderReplaceFurnitureStylePrompt(input: {
  imageDescription?: string
  useCase?: string
  style: VirtualStagingStyle
  roomType?: string
  intensity?: "light" | "full"
}) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Furnished interior photograph to restyle", input.imageDescription)
  const roomType = firstNonEmpty(input.roomType, "living room / open plan") ?? "living room / open plan"
  const intensity = input.intensity || "full"

  const styleNotes: Record<VirtualStagingStyle, string> = {
    scandinavian: "light woods, neutral textiles, simple forms, minimal decor",
    modern: "clean lines, neutral palette with bold accents, contemporary furniture",
    contemporary: "premium neutral styling, layered textures, balanced decor",
    minimalist: "few pieces, strong negative space, crisp geometry, no clutter",
    industrial: "metal + wood, darker neutrals, practical shapes, restrained decor",
    classic: "timeless forms, symmetry, warm neutrals, subtle patterns",
    luxury: "upscale materials, refined statement pieces, hotel-like finish",
    boho: "earthy palette, natural textures, plants, layered textiles (not cluttered)",
    mid_century: "mid-century silhouettes, walnut tones, tapered legs, restrained graphic decor",
    coastal: "airy whites/sands, natural fibers, relaxed pieces, subtle coastal accents",
    japandi: "warm minimalism, clean lines, natural wood, calm neutrals, low-profile furniture",
  }

  return `MODE: edit / semantic replacement + realism pass

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Restyle the room for a real-estate listing by replacing existing movable furniture/decor with a cohesive ${input.style} look while preserving architecture, materials, lighting, and camera geometry.

NARRATIVE:
The room is presented as a ${roomType} in a ${input.style} style (${styleNotes[input.style]}). The layout stays practical and proportional: seating, tables, rugs, and decor are placed realistically with correct scale and contact shadows. Architecture and finishes remain unchanged; the result looks like a real professional listing photo, not CGI.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: replace elements, semantic inpainting

PRESERVE (with PRIORITY):
- architecture (walls, ceilings, windows, doors, built-ins) [1.0]
- floor material & reflections (plank direction, tile pattern) [0.95]
- lighting (direction, softness, shadows, color temperature) [0.9]
- camera perspective & geometry (lens, horizon, verticals) [0.9]
- surface textures (paint grain, wood microtexture, glass clarity) [0.85]

REPLACE (SEMANTIC TARGETS):
- seating furniture, tables, beds, storage pieces (movable)
- rugs, lamps, movable shelving, small decor (keep minimal)
- remove visual clutter; keep staging neutral and market-friendly

CONSTRAINTS:
- intensity: ${intensity}; ${
    intensity === "light"
      ? "keep a similar furniture footprint and positions; swap style/materials/colors only."
      : "replace most movable pieces, but keep practical placements and walking paths."
  }
- do not remove built-ins; do not change room dimensions
- keep walking clearance ≥ 80cm where applicable

HARMONIZE:
- lighting: match original direction and softness; exposure drift ≤ ±0.2 EV
- shadows: realistic contact shadows; no floating furniture
- perspective: maintain vanishing points; scale drift ≤ 1%

NEGATIVE (SEMANTIC BANS):
- avoid unrealistic scale, floating items, or blocked doors/windows
- avoid over-decorating, clutter, or messy staging
- avoid changing wall/floor materials or heavy color grading
- avoid CGI/plastic look, blur, smeared textures

ORDER OF OPERATIONS:
1) detect existing movable furniture and remove/replace semantically
2) place new furniture consistent with ${input.style} style
3) integrate shadows/reflections and material realism
4) final consistency pass (edges, textures, lighting)

TOLERANCE:
- color shift ΔE ≤ 2
- perspective deviation ≤ 1°
- scale drift ≤ 1%

QUALITY & OUTPUT:
- photorealistic, listing-ready restyle
- high-fidelity detail preservation
- output long edge ≥ 4096 px
- no stylization beyond the chosen style

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderVirtualRenovationPrompt(input: {
  imageDescription?: string
  useCase?: string
  renovationRequest: string
}) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Interior photograph for virtual renovation", input.imageDescription)
  const renovationRequest = firstNonEmpty(input.renovationRequest, "refresh finishes with neutral, modern materials")!

  return `MODE: edit / targeted material replacement + realism pass

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Virtually renovate the space for a listing by updating finishes/materials according to the request while preserving geometry, lighting, and photographic realism.

NARRATIVE:
The space looks newly refreshed and move-in ready. Materials and finishes are updated in a believable way that matches the original lighting and perspective. The renovation is subtle and market-friendly, like a professional renovation render that still reads as a real photo.

REQUEST:
- ${renovationRequest}

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: material replacement, targeted editing

PRESERVE (with PRIORITY):
- architecture & geometry (walls, ceilings, windows, doors, built-ins) [1.0]
- camera perspective & verticals [0.95]
- lighting & shadows (direction, softness, color temperature) [0.9]
- reflections (glass, glossy surfaces) [0.85]

MODIFY (atomic, quantified):
- materials → update per request; keep texture scale physically plausible; repetition visibility ≤ 5%
- edges → keep clean junctions (baseboards, corners); seam visibility ≤ 2%
- exposure → drift ≤ ±0.2 EV; avoid dramatic grade shifts

NEGATIVE (SEMANTIC BANS):
- avoid changing room dimensions or layout
- avoid CGI/plastic surfaces, blur, warped patterns
- avoid uneven tiling, misaligned planks, or incorrect perspective on textures
- avoid adding objects or decor unless requested

ORDER OF OPERATIONS:
1) detect surfaces (walls/floors/cabinets/countertops)
2) apply material replacements with correct perspective/scale
3) restore junction edges, shadows, and reflections
4) final realism and consistency pass

TOLERANCE:
- perspective deviation ≤ 1°
- color shift ΔE ≤ 2

QUALITY & OUTPUT:
- photorealistic, listing-ready renovation look
- high-fidelity detail preservation
- output long edge ≥ 4096 px
- no stylization

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderBrightenAndCorrectPrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Listing photo to correct exposure and color", input.imageDescription)
  return `MODE: edit / global grade + detail cleanup

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Improve the photo for a real-estate listing with a natural, professional correction (not HDR) while preserving true materials and architectural detail.

NARRATIVE:
The image looks bright, clean, and professionally edited with natural contrast and accurate colors. Whites are neutral, shadows retain detail without haze, and highlights are controlled. The result resembles a professional real-estate photographer edit.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: exposure correction, color correction, cleanup

PRESERVE (with PRIORITY):
- architecture and materials (true textures and colors) [1.0]
- edges and fine detail (railings, frames, branches) [0.95]
- realistic lighting (no new light sources) [0.9]

MODIFY (atomic, quantified):
- exposure: brighten subtly; drift ≤ +0.4 EV
- white balance: neutralize; keep warm/cool mood realistic; ΔE ≤ 2
- contrast: add gentle micro-contrast; avoid HDR halos; halo ≤ 1px
- clarity: reduce noise minimally; avoid smoothing; microtexture retention ≥ 90%

NEGATIVE (SEMANTIC BANS):
- avoid HDR look, over-saturation, orange/blue casts
- avoid blown highlights, crushed blacks, halos on edges
- avoid changing sky/building shape or adding objects

QUALITY & OUTPUT:
- photorealistic, listing-ready
- high-fidelity detail preservation
- output long edge ≥ 4096 px

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderStraightenPerspectivePrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Property photo needing perspective correction", input.imageDescription)
  return `MODE: edit / geometry correction + edge protection

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Correct perspective for a professional listing photo: straighten verticals and level horizon while preserving the real look and avoiding warping artifacts.

NARRATIVE:
The photo looks professionally corrected: vertical lines are straight, the horizon is level, and the composition remains natural. Details like windows, frames, and edges stay crisp with no stretching or wavy distortions.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: perspective correction

PRESERVE (with PRIORITY):
- architectural geometry and proportions [1.0]
- edge fidelity and sharpness [0.95]
- textures and patterns (tiles, bricks) [0.9]

MODIFY (atomic, quantified):
- verticals: correct to within ±0.3° of true vertical
- horizon: level to within ±0.3°
- crop: keep minimal; preserve subject framing
- warping: limit stretching; texture distortion visibility ≤ 3%

NEGATIVE (SEMANTIC BANS):
- avoid wavy lines, stretched textures, or misaligned patterns
- avoid changing the building shape or adding objects

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderRemoveCarsPeoplePrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Exterior property photo with cars/people to remove", input.imageDescription)
  return `MODE: edit / inpaint (semantic)

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Remove vehicles and people from the scene while preserving architecture, street context, landscaping, and lighting realism.

NARRATIVE:
The property looks clean and unobstructed, as if photographed when the street/driveway was empty. Removed elements are seamlessly inpainted with correct pavement/grass continuity and natural shadows.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: removing elements, semantic inpainting

REMOVE (SEMANTIC TARGETS):
- cars, vans, bikes, scooters, license plates
- people, pedestrians, reflections of people when obvious

PRESERVE (with PRIORITY):
- architecture and materials [1.0]
- ground surfaces (asphalt, pavers, gravel, grass) [0.95]
- lighting and shadows consistency [0.9]

REGIONS:
- R1: semantic("vehicles and people")

MODIFY:
- R1 → remove + inpaint; reconstruct continuous ground and background surfaces; seam visibility ≤ 2%
- shadows → keep only plausible environmental shadows; no object shadows

NEGATIVE (SEMANTIC BANS):
- avoid ghost outlines, duplicated textures, smears
- avoid changing the sky or lighting direction
- avoid adding new objects

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderEnhanceLandscapingPrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Exterior property photo for landscaping enhancement", input.imageDescription)
  return `MODE: edit / targeted enhancement + realism pass

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Enhance curb appeal subtly (not fake) by improving landscaping: greener grass, healthier foliage, and tidy edges while preserving natural lighting and realism.

NARRATIVE:
The property looks well maintained: grass is evenly green, shrubs are tidy, and the scene feels fresh and inviting. Improvements are subtle and believable, like a real gardener just maintained the yard.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: enhancement, targeted editing

PRESERVE (with PRIORITY):
- architecture, driveway, paths [1.0]
- lighting and shadows [0.9]
- natural color relationships [0.85]

MODIFY (atomic, quantified):
- grass: even green tone; avoid neon; ΔE ≤ 3 vs natural greens
- plants: increase health/saturation slightly; avoid plastic look
- edges: tidy borders along paths/driveway; keep realistic texture

NEGATIVE (SEMANTIC BANS):
- avoid over-saturation, neon greens, fake turf texture
- avoid changing season drastically or adding new plants
- avoid changing sky/building structure

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderRemovePowerLinesPrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Exterior photo with power lines to remove", input.imageDescription)
  return `MODE: edit / inpaint (semantic)

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Remove power lines/cables and related visual clutter while preserving sky gradients, trees, rooflines, and overall realism.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: removing elements, semantic inpainting

REMOVE (SEMANTIC TARGETS):
- overhead power lines, cables, small hanging fixtures

PRESERVE (with PRIORITY):
- sky gradients and clouds [1.0]
- tree branches and fine edges [0.95]
- rooflines and building edges [0.95]

MODIFY:
- remove cables; inpaint sky/foliage cleanly; halo ≤ 1px; seam visibility ≤ 2%

NEGATIVE (SEMANTIC BANS):
- avoid wavy sky artifacts, banding, halos, cutouts
- avoid changing the sky mood or lighting direction

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderPoolCleanupPrompt(input: { imageDescription?: string; useCase?: string }) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Exterior photo with pool needing cleanup", input.imageDescription)
  return `MODE: edit / targeted cleanup + realism pass

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Make the pool area look clean and inviting for a listing: clear water, tidy surface, and realistic reflections while preserving the surrounding architecture and lighting.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: cleanup, enhancement

PRESERVE (with PRIORITY):
- pool shape, tiles, coping edges [1.0]
- reflections and caustics realism [0.9]
- surrounding deck and landscaping [0.9]

MODIFY (atomic, quantified):
- water: clear and clean; natural blue/teal; avoid neon; ΔE ≤ 3 vs realistic pool water
- surface: remove debris; keep gentle ripples; no CGI flatness
- reflections: keep consistent with sky/light direction

NEGATIVE (SEMANTIC BANS):
- avoid fake mirror reflections, neon water, plastic textures
- avoid changing pool dimensions or adding objects

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderChangeCameraAnglePrompt(input: {
  imageDescription?: string
  useCase?: string
  roomType?: string
  targetAngle: "top_down" | "high_corner" | "eye_level_straight" | "low_angle" | "three_quarter_left" | "three_quarter_right"
  strength?: "subtle" | "moderate" | "strong"
  lensMm?: 16 | 18 | 24 | 28 | 35
}) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription("Interior listing photo to re-angle", input.imageDescription)
  const roomType = firstNonEmpty(input.roomType, "living room / open plan") ?? "living room / open plan"
  const strength = input.strength || "moderate"
  const lens = input.lensMm ?? 24

  const angleNotes: Record<typeof input.targetAngle, string> = {
    top_down: "a top-down / overhead viewpoint, looking down into the space",
    high_corner: "a higher corner viewpoint (raised camera height), looking slightly downward",
    eye_level_straight: "an eye-level, straight-on viewpoint with clean verticals",
    low_angle: "a slightly lower viewpoint, looking slightly upward (but still realistic for real estate)",
    three_quarter_left: "a three-quarter viewpoint from the left side, showing depth into the room",
    three_quarter_right: "a three-quarter viewpoint from the right side, showing depth into the room",
  }

  const strengthRules: Record<typeof strength, string> = {
    subtle: "small change only; keep viewpoint close to original; avoid layout drift",
    moderate: "clear viewpoint change while keeping the same room identity; avoid adding/removing objects",
    strong: "significant viewpoint change; keep architecture consistent; do not hallucinate new features",
  }

  return `MODE: edit / viewpoint transform (photorealistic)

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Create an alternate listing photo of the same ${roomType} by changing the camera angle to ${angleNotes[input.targetAngle]} while preserving the exact room identity, finishes, and realism.

NARRATIVE:
The image looks like a new photo taken by a professional real-estate photographer from a different angle. The room identity stays the same (same architecture, same openings, same finishes). The new viewpoint is physically plausible, with correct perspective, scale, and lighting continuity. No CGI look.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: camera angle change, perspective-consistent re-render

PRESERVE (with PRIORITY):
- room identity & architecture (walls, ceilings, windows, doors, built-ins) [1.0]
- materials & finishes (floors, paint, cabinetry, tile) [0.95]
- lighting direction and softness (no new sources); exposure drift ≤ ±0.2 EV [0.9]
- texture realism (microtexture retention ≥ 90%) [0.85]

CAMERA/LOOK:
- target_view: ${input.targetAngle}
- camera_height: ${input.targetAngle === "top_down" ? "high" : input.targetAngle === "low_angle" ? "low" : "standard"}
- lens: ${lens}mm equivalent; wide enough for real estate, with straight verticals
- geometry: verticals corrected; horizon level ±0.3°

CONSTRAINTS:
- strength: ${strength}; ${strengthRules[strength]}
- keep the same floor plan and relative object placement; no layout hallucination
- do not change decor style; do not add/remove major objects unless strictly necessary for consistency

NEGATIVE (SEMANTIC BANS):
- avoid changing room dimensions or adding/removing windows/doors
- avoid warped textures, wavy lines, stretched tiles/planks
- avoid inconsistent lighting or shadows; avoid HDR/CGI look
- avoid duplicated furniture, floating objects, or impossible geometry

ORDER OF OPERATIONS:
1) infer room geometry and vanishing points
2) re-render from target viewpoint with perspective consistency
3) preserve materials and lighting; correct verticals
4) final realism pass (edges, textures, noise)

TOLERANCE:
- perspective deviation ≤ 1°
- texture distortion visibility ≤ 3%
- color shift ΔE ≤ 2

QUALITY & OUTPUT:
- photorealistic, listing-ready alternate angle
- output long edge ≥ 4096 px

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}

export function renderPlan2DTo3DFurnishedPrompt(input: {
  imageDescription?: string
  useCase?: string
  style: VirtualStagingStyle
  includeLabels?: boolean
}) {
  const useCase = input.useCase || "photorealistic"
  const desc = formatImageInputDescription(
    "2D architectural floor plan with labeled rooms and dimensions",
    input.imageDescription,
  )
  const includeLabels = input.includeLabels ?? true

  const styleNotes: Record<VirtualStagingStyle, string> = {
    scandinavian: "light wood floors, white walls, simple modern furniture, neutral textiles",
    modern: "clean lines, neutral palette with subtle contrast, contemporary furniture",
    contemporary: "high-end neutral styling, balanced textures, premium feel",
    minimalist: "very clean and uncluttered, fewer pieces, lots of negative space",
    industrial: "wood + metal accents, darker neutrals, practical furniture shapes",
    classic: "timeless furniture forms, warm neutrals, balanced layout",
    luxury: "upscale finishes, refined furniture, premium hotel-like staging",
    boho: "earthy neutral palette, natural textures, curated decor (not cluttered)",
    mid_century: "mid-century silhouettes, walnut tones, tapered legs, restrained decor",
    coastal: "airy whites/sands, natural fibers, relaxed pieces, subtle coastal accents",
    japandi: "warm minimalism, natural wood, calm neutrals, low-profile pieces",
  }

  return `MODE: image_to_image (structural transform + furnishing)

INPUTS:
- I1: id=base_image, description="${desc}",
      min_short_edge_px=1500, rights_confirmed=true

CONTEXT:
Convert a 2D floor plan into a fully furnished 3D floor plan that accurately represents scale, layout, and livability.

NARRATIVE:
The flat floor plan is transformed into a realistic 3D furnished plan. Walls are extruded, rooms gain depth, and each space is furnished appropriately to demonstrate function and scale. The result is a clean, modern 3D visualization suitable for real-estate marketing and client presentation. Style is ${input.style}: ${styleNotes[input.style]}.

GOOGLE_USE_CASE: ${useCase}
EDIT_INTENT: structural transformation, depth reconstruction, furniture placement

PRESERVE (with PRIORITY):
- exact room layout and proportions [1.0]
- door and window placement [0.95]
- wall thickness and circulation paths [0.95]
- original room dimensions [0.95]

TRANSFORM:
- extrude walls to 2.7 m (9 ft) height
- wall thickness 150–200 mm
- convert doors and windows into 3D openings
- generate continuous floor slabs per room

ADD — FURNITURE (REQUIRED):
- living room: sofa, coffee table, TV unit, optional rug
- bedrooms: bed, nightstands, wardrobe or closet block
- kitchen: cabinets, island or counter, bar stools if applicable
- dining area: dining table with chairs
- bathrooms: vanity, toilet, shower/tub
- balcony (if present): minimal outdoor seating

FURNITURE RULES:
- furniture scaled accurately to room size (±5%)
- modern, neutral style consistent with ${input.style}
- furniture aligned to walls and circulation paths
- no overcrowding; maintain realistic walkways

VIEW & CAMERA:
- isometric / axonometric 3D view
- 35–45° downward angle
- no perspective distortion
- entire unit visible in one frame

STYLE:
- modern real-estate presentation
- neutral palette (light wood, beige, soft gray)
- simplified but clearly recognizable furniture forms

LIGHTING:
- soft global illumination
- neutral daylight (~5500 K)
- minimal shadows for clarity

LABELING:
- ${includeLabels ? "include clean room labels (recommended)" : "do not include text labels"}
- if included: simple sans-serif font, aligned to room orientation, readable but unobtrusive

NEGATIVE (SEMANTIC BANS):
- avoid changing room sizes
- avoid oversized or underscaled furniture
- avoid decorative clutter
- avoid dramatic lighting or artistic stylization

ORDER OF OPERATIONS:
1) reconstruct walls and floors in 3D
2) place core furniture per room function
3) adjust scale and spacing
4) apply lighting and materials
5) final clarity pass

TOLERANCE:
- dimensional deviation ≤ 2%
- furniture scale error ≤ 5%
- camera skew ≤ 0.5°

QUALITY & OUTPUT:
- clean, furnished architectural visualization
- crisp edges and readable furniture
- 16-bit sRGB
- output long edge ≥ 4096 px

Approach this task like an eagle: stay focused, rise above the noise, and execute each step with clarity and precision.`
}
