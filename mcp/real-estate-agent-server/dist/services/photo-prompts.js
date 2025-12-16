/**
 * AI Photo prompt templates for real estate image editing
 * Ported from lib/real-estate/photo-prompt-templates.ts and lib/headshot/headshot-prompts.ts
 */
// ============================================
// Style Notes
// ============================================
const STAGING_STYLE_NOTES = {
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
};
const HEADSHOT_STYLE_PROMPTS = {
    studio_grey: "studio headshot; solid medium-grey seamless backdrop; clean modern retouching; natural skin texture; professional corporate portrait",
    studio_light: "studio headshot; soft white/light grey backdrop; bright clean lighting; natural skin texture; professional corporate portrait",
    modern_office: "modern tech office headshot; soft natural window light; premium interior bokeh; shallow depth of field; approachable professional vibe",
    outdoor_soft: "outdoor business headshot; soft natural daylight; blurred greenery background; warm tones; shallow depth of field; friendly and confident",
    bw_dramatic: "classic black and white headshot; dramatic Rembrandt lighting; high-contrast but natural; crisp detail; timeless editorial portrait",
};
const HEADSHOT_OUTFIT_PROMPTS = {
    agent_suit: "a sharp, well-fitted dark navy or charcoal blazer over a crisp light shirt; modern, premium, real-estate agent look; no logos",
    smart_casual: "smart-casual professional outfit: neutral knit or polo with optional light blazer; modern and approachable; no logos, no bold patterns",
    neutral_tshirt: "a plain neutral top (grey/white/black), minimal and professional; no logos",
    custom: "",
};
// ============================================
// Virtual Staging Prompt
// ============================================
export function renderVirtualStagingPrompt(input) {
    const roomType = input.roomType || "living room / open plan";
    const occupancy = input.occupancy || "empty";
    const styleNotes = STAGING_STYLE_NOTES[input.style];
    return `MODE: edit / inpaint (semantic) + composition-aware placement

CONTEXT:
Virtually stage the space for a real-estate listing by adding furniture and decor in a realistic, perspective-correct way while preserving architecture, lighting, and materials.

NARRATIVE:
The room is staged as a ${roomType} in a ${input.style} style: ${styleNotes}. The staging looks like a real photo: furniture is grounded with correct contact shadows, scale is accurate, and placements are practical for walking paths. Architecture, materials, and camera perspective remain unchanged.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: add elements, semantic inpainting (virtual staging)

PRESERVE (with PRIORITY):
- architecture (walls, ceilings, windows, doors, built-ins) [1.0]
- floor material & reflections (plank direction, tile pattern) [0.95]
- lighting (direction, softness, shadows, color temperature) [0.9]
- camera perspective & geometry (lens, horizon, verticals) [0.9]

ADD (SEMANTIC TARGETS):
- primary furniture appropriate for ${roomType} (sofa/bed/dining set) with correct scale
- secondary pieces (coffee table, side table, rug) without blocking doors/windows
- minimal decor (plants, art) consistent with ${input.style} style (no clutter)

CONSTRAINTS:
- occupancy: ${occupancy}; do not remove built-ins; do not alter room dimensions
- walking clearance: keep ≥ 80cm pathways where applicable
- keep windows unobstructed

NEGATIVE (SEMANTIC BANS):
- avoid unrealistic scale or floating furniture
- avoid blocking doors/windows or awkward placements
- avoid over-decorating or clutter
- avoid CGI look, plastic materials, blur

QUALITY & OUTPUT:
- photorealistic, listing-ready virtual staging
- output long edge ≥ 4096 px`;
}
// ============================================
// Declutter / Remove Furniture
// ============================================
export function renderDeclutterPrompt() {
    return `MODE: edit / inpaint (semantic)

CONTEXT:
Create a clean, empty interior by removing all movable furniture and objects while fully preserving architectural structure, materials, lighting, and perspective.

NARRATIVE:
The interior space appears empty, open, and move-in ready. All furniture and movable objects are removed seamlessly, revealing continuous floors and clean walls.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: removing elements, semantic inpainting

PRESERVE (with PRIORITY):
- architecture (walls, ceilings, windows, doors, built-ins) [1.0]
- floor material (plank direction, tile pattern, reflections) [0.95]
- lighting (direction, softness, shadows, color temperature) [0.9]
- camera perspective & geometry [0.9]

REMOVE (SEMANTIC TARGETS):
- all seating furniture (chairs, sofas, stools, benches)
- all tables and desks (dining, coffee, side, work)
- beds, dressers, cabinets, nightstands
- rugs, floor decor, lamps, movable shelves
- electronics and loose decorative objects

NEGATIVE (SEMANTIC BANS):
- avoid ghost outlines or furniture silhouettes
- avoid duplicated or stretched floor textures
- avoid lighting changes or added light sources

QUALITY & OUTPUT:
- photorealistic result
- output long edge ≥ 4096 px`;
}
// ============================================
// Remove Personal Items
// ============================================
export function renderRemovePersonalItemsPrompt() {
    return `MODE: edit / inpaint (semantic)

CONTEXT:
Create a neutral, listing-ready interior by removing personal items and clutter while preserving architecture, finishes, lighting, and perspective.

NARRATIVE:
The space feels clean, neutral, and ready to show. Personal belongings and clutter are removed seamlessly, leaving surfaces tidy and visually calm.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: removing elements, semantic inpainting

PRESERVE (with PRIORITY):
- architecture (walls, ceilings, windows, doors, built-ins) [1.0]
- materials (floors, countertops, cabinetry, tile) [0.95]
- lighting (direction, softness, shadows) [0.9]

REMOVE (SEMANTIC TARGETS):
- personal photos, frames, magnets, stickers, notes
- toiletries, towels, laundry, cosmetics
- cables, countertop clutter, paperwork
- trash bins, pet items, random loose objects

NEGATIVE (SEMANTIC BANS):
- avoid blur, smears, plastic textures
- avoid adding any new objects
- avoid changing furniture layout

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px`;
}
// ============================================
// Day to Twilight
// ============================================
export function renderDayToTwilightPrompt() {
    return `MODE: edit / global grade + targeted relight

CONTEXT:
Transform a daylight exterior property photo into a premium twilight listing photo while preserving all structural details, landscaping, and camera perspective.

NARRATIVE:
The home is presented at dusk with a rich blue-hour sky and warm, inviting interior window glow. The result looks like a real twilight photograph captured by a professional real-estate photographer.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: color grading, relighting, sky enhancement

PRESERVE (with PRIORITY):
- architecture and materials (facade, rooflines, windows) [1.0]
- property details (paths, greenery, signage) [0.95]
- camera perspective & geometry [0.9]

MODIFY:
- global → shift ambient to twilight (cooler WB, dusk contrast)
- windows → add warm interior glow ~3000K; realistic falloff
- sky → replace/grade to blue-hour with smooth gradient

NEGATIVE (SEMANTIC BANS):
- avoid fake HDR look, over-saturation
- avoid blown highlights or glowing halos
- avoid changing building shape

QUALITY & OUTPUT:
- photorealistic premium twilight result
- output long edge ≥ 4096 px`;
}
// ============================================
// Sky Replacement
// ============================================
export function renderSkyReplacementPrompt() {
    return `MODE: edit / inpaint (semantic)

CONTEXT:
Replace the sky with a clean, realistic sky that matches scene lighting and color temperature while preserving rooflines, trees, and windows without halos.

NARRATIVE:
The property remains unchanged and realistic. The sky is replaced with a natural, clean sky that matches the original scene's lighting direction and mood.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: sky replacement, semantic inpainting

PRESERVE (with PRIORITY):
- rooflines, trees, antennas, fine edges [1.0]
- building materials and colors [0.95]
- window reflections [0.9]

MODIFY:
- sky → replace with natural blue sky; clean gradients
- edges → halo ≤ 1px; preserve fine branches

NEGATIVE (SEMANTIC BANS):
- avoid halos/cutouts around roof and trees
- avoid cartoon clouds, banding
- avoid adding objects (birds, planes)

QUALITY & OUTPUT:
- photorealistic result
- output long edge ≥ 4096 px`;
}
// ============================================
// Virtual Renovation
// ============================================
export function renderVirtualRenovationPrompt(renovationRequest) {
    return `MODE: edit / targeted material replacement + realism pass

CONTEXT:
Virtually renovate the space for a listing by updating finishes/materials according to the request while preserving geometry, lighting, and photographic realism.

REQUEST:
- ${renovationRequest}

NARRATIVE:
The space looks newly refreshed and move-in ready. Materials and finishes are updated in a believable way that matches the original lighting and perspective.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: material replacement, targeted editing

PRESERVE (with PRIORITY):
- architecture & geometry [1.0]
- camera perspective & verticals [0.95]
- lighting & shadows [0.9]

MODIFY:
- materials → update per request; keep texture scale plausible
- edges → keep clean junctions

NEGATIVE (SEMANTIC BANS):
- avoid changing room dimensions
- avoid CGI/plastic surfaces
- avoid adding objects unless requested

QUALITY & OUTPUT:
- photorealistic, listing-ready renovation look
- output long edge ≥ 4096 px`;
}
// ============================================
// Brighten and Correct
// ============================================
export function renderBrightenPrompt() {
    return `MODE: edit / global grade + detail cleanup

CONTEXT:
Improve the photo for a real-estate listing with a natural, professional correction (not HDR) while preserving true materials and architectural detail.

NARRATIVE:
The image looks bright, clean, and professionally edited with natural contrast and accurate colors. Whites are neutral, shadows retain detail.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: exposure correction, color correction

PRESERVE (with PRIORITY):
- architecture and materials [1.0]
- edges and fine detail [0.95]
- realistic lighting [0.9]

MODIFY:
- exposure: brighten subtly; drift ≤ +0.4 EV
- white balance: neutralize
- contrast: add gentle micro-contrast; avoid HDR halos

NEGATIVE (SEMANTIC BANS):
- avoid HDR look, over-saturation
- avoid blown highlights, crushed blacks

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px`;
}
// ============================================
// Straighten Perspective
// ============================================
export function renderStraightenPrompt() {
    return `MODE: edit / geometry correction

CONTEXT:
Correct perspective for a professional listing photo: straighten verticals and level horizon while preserving the real look.

NARRATIVE:
The photo looks professionally corrected: vertical lines are straight, the horizon is level, and the composition remains natural.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: perspective correction

PRESERVE (with PRIORITY):
- architectural geometry [1.0]
- edge fidelity and sharpness [0.95]
- textures and patterns [0.9]

MODIFY:
- verticals: correct to within ±0.3° of true vertical
- horizon: level to within ±0.3°
- crop: keep minimal

NEGATIVE (SEMANTIC BANS):
- avoid wavy lines, stretched textures

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px`;
}
// ============================================
// Remove Cars/People
// ============================================
export function renderRemoveCarsPeoplePrompt() {
    return `MODE: edit / inpaint (semantic)

CONTEXT:
Remove vehicles and people from the scene while preserving architecture, street context, landscaping, and lighting realism.

NARRATIVE:
The property looks clean and unobstructed, as if photographed when the street/driveway was empty.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: removing elements, semantic inpainting

REMOVE (SEMANTIC TARGETS):
- cars, vans, bikes, scooters, license plates
- people, pedestrians

PRESERVE (with PRIORITY):
- architecture and materials [1.0]
- ground surfaces [0.95]
- lighting and shadows [0.9]

NEGATIVE (SEMANTIC BANS):
- avoid ghost outlines, duplicated textures
- avoid changing the sky or lighting

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px`;
}
// ============================================
// Enhance Landscaping
// ============================================
export function renderEnhanceLandscapingPrompt() {
    return `MODE: edit / targeted enhancement

CONTEXT:
Enhance curb appeal subtly by improving landscaping: greener grass, healthier foliage, and tidy edges while preserving natural lighting.

NARRATIVE:
The property looks well maintained: grass is evenly green, shrubs are tidy, and the scene feels fresh and inviting.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: enhancement

PRESERVE (with PRIORITY):
- architecture, driveway, paths [1.0]
- lighting and shadows [0.9]

MODIFY:
- grass: even green tone; avoid neon
- plants: increase health/saturation slightly
- edges: tidy borders along paths

NEGATIVE (SEMANTIC BANS):
- avoid over-saturation, neon greens
- avoid changing season drastically

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px`;
}
// ============================================
// Remove Power Lines
// ============================================
export function renderRemovePowerLinesPrompt() {
    return `MODE: edit / inpaint (semantic)

CONTEXT:
Remove power lines/cables while preserving sky gradients, trees, rooflines, and overall realism.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: removing elements, semantic inpainting

REMOVE (SEMANTIC TARGETS):
- overhead power lines, cables

PRESERVE (with PRIORITY):
- sky gradients and clouds [1.0]
- tree branches and fine edges [0.95]
- rooflines [0.95]

NEGATIVE (SEMANTIC BANS):
- avoid wavy sky artifacts, banding, halos

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px`;
}
// ============================================
// Pool Cleanup
// ============================================
export function renderPoolCleanupPrompt() {
    return `MODE: edit / targeted cleanup

CONTEXT:
Make the pool area look clean and inviting for a listing: clear water, tidy surface, and realistic reflections.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: cleanup, enhancement

PRESERVE (with PRIORITY):
- pool shape, tiles, coping edges [1.0]
- reflections and caustics realism [0.9]
- surrounding deck and landscaping [0.9]

MODIFY:
- water: clear and clean; natural blue/teal
- surface: remove debris; keep gentle ripples

NEGATIVE (SEMANTIC BANS):
- avoid fake mirror reflections, neon water

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px`;
}
// ============================================
// Change Camera Angle
// ============================================
export function renderChangeCameraAnglePrompt(input) {
    const roomType = input.roomType || "living room / open plan";
    const strength = input.strength || "moderate";
    const angleDescriptions = {
        top_down: "a top-down / overhead viewpoint, looking down into the space",
        high_corner: "a higher corner viewpoint, looking slightly downward",
        eye_level_straight: "an eye-level, straight-on viewpoint with clean verticals",
        low_angle: "a slightly lower viewpoint, looking slightly upward",
        three_quarter_left: "a three-quarter viewpoint from the left side",
        three_quarter_right: "a three-quarter viewpoint from the right side",
    };
    return `MODE: edit / viewpoint transform (photorealistic)

CONTEXT:
Create an alternate listing photo of the same ${roomType} by changing the camera angle to ${angleDescriptions[input.targetAngle]} while preserving the exact room identity, finishes, and realism.

NARRATIVE:
The image looks like a new photo taken by a professional from a different angle. The room identity stays the same. No CGI look.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: camera angle change, perspective-consistent re-render

PRESERVE (with PRIORITY):
- room identity & architecture [1.0]
- materials & finishes [0.95]
- lighting direction [0.9]

CAMERA:
- target_view: ${input.targetAngle}
- strength: ${strength}

NEGATIVE (SEMANTIC BANS):
- avoid changing room dimensions
- avoid warped textures, wavy lines
- avoid duplicated furniture

QUALITY & OUTPUT:
- photorealistic alternate angle
- output long edge ≥ 4096 px`;
}
// ============================================
// Headshot Generation
// ============================================
export function renderHeadshotPrompt(input) {
    const stylePrompt = HEADSHOT_STYLE_PROMPTS[input.style];
    const outfitPrompt = input.outfit === "custom" && input.customOutfit
        ? input.customOutfit
        : HEADSHOT_OUTFIT_PROMPTS[input.outfit];
    if (input.mode === "clothes_only") {
        return `MODE: edit / inpaint (semantic)

CONTEXT:
Replace ONLY the outfit/clothing of the person while preserving face identity, hair, pose, lighting, and background exactly.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: clothing replacement, identity lock

PRESERVE (with PRIORITY):
- identity(face shape, eyes, nose, lips, skin tone) [1.0]
- facial expression and gaze [1.0]
- pose and body position [0.95]
- background and environment [0.95]

MODIFY:
- replace clothing with: ${outfitPrompt || "professional neutral outfit"}; keep fabric realistic

NEGATIVE (SEMANTIC BANS):
- avoid changing face identity or expression
- avoid changing background
- avoid warped hands/arms

QUALITY & OUTPUT:
- photorealistic headshot result
- sharp eyes; clean edges`;
    }
    return `MODE: image_to_image (identity-preserving headshot)

CONTEXT:
Create a professional real-estate agent headshot suitable for listings, brochures, and business cards. Improve lighting and background while preserving the person's identity.

NARRATIVE:
A polished, modern, photorealistic headshot. The subject looks confident, approachable, and professional.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: portrait enhancement + background upgrade + optional wardrobe styling

PRESERVE (with PRIORITY):
- identity(face shape, eyes, nose, lips, skin tone, hairline) [1.0]
- facial expression and gaze [1.0]
- hairstyle and hair color [0.95]

MODIFY:
- apply headshot style: ${stylePrompt}
${outfitPrompt ? `- wardrobe: ${outfitPrompt}; correct fit; no logos` : "- wardrobe: keep clothing professional"}
- retouching: natural (no plastic skin); reduce blemishes subtly
- framing: head-and-shoulders

LIGHTING:
- flattering portrait lighting; key light soft

CAMERA:
- lens equivalent 50–85mm; shallow depth of field; crisp focus on eyes

NEGATIVE (SEMANTIC BANS):
- avoid identity drift, changed facial features
- avoid heavy beauty filters, waxy skin
- avoid distorted glasses, warped hands

QUALITY & OUTPUT:
- photorealistic professional headshot
- suitable for marketing`;
}
// ============================================
// Floor Plan to 3D
// ============================================
export function renderFloorPlanTo3DPrompt(input) {
    const styleNotes = STAGING_STYLE_NOTES[input.style];
    const includeLabels = input.includeLabels ?? true;
    return `MODE: image_to_image (structural transform + furnishing)

CONTEXT:
Convert a 2D floor plan into a fully furnished 3D floor plan that accurately represents scale, layout, and livability.

NARRATIVE:
The flat floor plan is transformed into a realistic 3D furnished plan. Style is ${input.style}: ${styleNotes}.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: structural transformation, furniture placement

PRESERVE (with PRIORITY):
- exact room layout and proportions [1.0]
- door and window placement [0.95]
- wall thickness and circulation paths [0.95]

TRANSFORM:
- extrude walls to 2.7 m height
- convert doors and windows into 3D openings
- generate continuous floor slabs per room

ADD — FURNITURE:
- living room: sofa, coffee table, TV unit
- bedrooms: bed, nightstands, wardrobe
- kitchen: cabinets, counter
- dining area: dining table with chairs
- bathrooms: vanity, toilet, shower/tub

VIEW & CAMERA:
- isometric / axonometric 3D view
- 35–45° downward angle
- entire unit visible in one frame

LABELING:
- ${includeLabels ? "include clean room labels" : "do not include text labels"}

NEGATIVE (SEMANTIC BANS):
- avoid changing room sizes
- avoid oversized furniture

QUALITY & OUTPUT:
- clean, furnished architectural visualization
- output long edge ≥ 4096 px`;
}
// ============================================
// Additional Prompt Functions for Tools
// ============================================
/**
 * Enhance photo prompt
 */
export function renderEnhancePrompt(adjustments) {
    const adjustmentsList = adjustments?.length
        ? adjustments.join(", ")
        : "brightness, contrast, saturation, sharpness, color correction";
    return `MODE: edit / global enhancement

CONTEXT:
Enhance the photo for a real-estate listing with professional-level adjustments: ${adjustmentsList}.

NARRATIVE:
The image looks professionally edited with optimal exposure, accurate colors, and good detail.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: photo enhancement

PRESERVE (with PRIORITY):
- architecture and materials [1.0]
- spatial relationships [0.95]
- natural lighting character [0.9]

MODIFY:
- apply enhancements: ${adjustmentsList}
- maintain natural appearance

NEGATIVE (SEMANTIC BANS):
- avoid over-processing, HDR look
- avoid color casts or unnatural tones

QUALITY & OUTPUT:
- photorealistic, listing-ready
- output long edge ≥ 4096 px`;
}
/**
 * Green grass prompt
 */
export function renderGreenGrassPrompt(intensity = "natural") {
    return `MODE: edit / targeted enhancement

CONTEXT:
Make the lawn/grass appear healthy and green (${intensity} intensity) while preserving realism.

NARRATIVE:
The lawn looks healthy and well-maintained with an appropriate green color.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: lawn enhancement

PRESERVE (with PRIORITY):
- architecture [1.0]
- pathways, driveways [0.95]
- lighting and shadows [0.9]

MODIFY:
- grass color: healthy green, ${intensity} intensity
- maintain natural variation

NEGATIVE (SEMANTIC BANS):
- avoid neon or artificial green
- avoid uniform color without texture

QUALITY & OUTPUT:
- photorealistic result
- output long edge ≥ 4096 px`;
}
/**
 * Remove object prompt
 */
export function renderRemoveObjectPrompt(objectToRemove, fillWith = "auto") {
    return `MODE: edit / inpaint (semantic)

CONTEXT:
Remove "${objectToRemove}" from the image and fill the space naturally with ${fillWith === "auto" ? "appropriate surroundings" : fillWith}.

NARRATIVE:
The object is removed seamlessly, leaving a clean and natural-looking scene.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: object removal, semantic inpainting

REMOVE (SEMANTIC TARGETS):
- ${objectToRemove}

PRESERVE (with PRIORITY):
- architecture [1.0]
- surrounding context [0.95]
- lighting and shadows [0.9]

FILL:
- method: ${fillWith === "auto" ? "context-aware" : fillWith}
- seamless blending with surroundings

NEGATIVE (SEMANTIC BANS):
- avoid visible seams or artifacts
- avoid duplicated textures

QUALITY & OUTPUT:
- photorealistic result
- output long edge ≥ 4096 px`;
}
/**
 * Pool water prompt
 */
export function renderPoolWaterPrompt(color = "crystal_blue") {
    return `MODE: edit / targeted enhancement

CONTEXT:
Make the pool water appear clean, clear, and inviting with ${color.replace("_", " ")} color.

NARRATIVE:
The pool water looks crystal clear and inviting, perfect for a listing photo.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: pool water enhancement

PRESERVE (with PRIORITY):
- pool shape and edges [1.0]
- surrounding deck [0.95]
- reflections [0.9]

MODIFY:
- water color: ${color.replace("_", " ")}
- clarity: crystal clear
- add natural sparkle and reflections

NEGATIVE (SEMANTIC BANS):
- avoid fake-looking water
- avoid losing natural reflections

QUALITY & OUTPUT:
- photorealistic result
- output long edge ≥ 4096 px`;
}
/**
 * Add fire to fireplace prompt
 */
export function renderAddFirePrompt(intensity = "moderate") {
    return `MODE: edit / inpaint (semantic)

CONTEXT:
Add realistic ${intensity} flames to the fireplace, creating a cozy ambiance.

NARRATIVE:
The fireplace has realistic flames that create a warm, inviting atmosphere.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: add fire, semantic inpainting

PRESERVE (with PRIORITY):
- fireplace structure [1.0]
- room lighting [0.9]
- surrounding decor [0.9]

ADD:
- realistic ${intensity} flames in fireplace
- natural glow and warm light effect
- subtle reflections on nearby surfaces

NEGATIVE (SEMANTIC BANS):
- avoid cartoon flames
- avoid excessive glow

QUALITY & OUTPUT:
- photorealistic result
- output long edge ≥ 4096 px`;
}
/**
 * Add TV content prompt
 */
export function renderAddTvContentPrompt(contentType = "nature") {
    const contentDescriptions = {
        nature: "a beautiful landscape scene",
        fireplace: "a cozy fireplace video",
        abstract: "modern abstract art",
        black: "a clean black screen",
    };
    return `MODE: edit / inpaint (semantic)

CONTEXT:
Add ${contentDescriptions[contentType] || contentType} to the TV screen.

NARRATIVE:
The TV displays attractive content that enhances the room's appeal.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: add TV content, semantic inpainting

PRESERVE (with PRIORITY):
- TV frame and bezels [1.0]
- room lighting [0.9]
- reflections on screen [0.8]

ADD:
- display content: ${contentDescriptions[contentType] || contentType}
- appropriate screen brightness
- subtle screen reflections

NEGATIVE (SEMANTIC BANS):
- avoid unrealistic screen brightness
- avoid content that looks pasted on

QUALITY & OUTPUT:
- photorealistic result
- output long edge ≥ 4096 px`;
}
/**
 * Brighten/darken adjustment prompt
 */
export function renderBrightenDarkenPrompt(adjustment, intensity = "moderate") {
    return `MODE: edit / global grade

CONTEXT:
${adjustment === "brighten" ? "Brighten" : adjustment === "darken" ? "Darken" : "Balance the lighting of"} the image with ${intensity} intensity.

NARRATIVE:
The image has optimal exposure with ${adjustment === "brighten" ? "lifted shadows and better visibility" : adjustment === "darken" ? "reduced highlights and better mood" : "balanced lighting throughout"}.

GOOGLE_USE_CASE: photorealistic
EDIT_INTENT: exposure adjustment

PRESERVE (with PRIORITY):
- architecture [1.0]
- materials and textures [0.95]
- color accuracy [0.9]

MODIFY:
- ${adjustment}: ${intensity} adjustment
- maintain natural appearance
- preserve detail in shadows and highlights

NEGATIVE (SEMANTIC BANS):
- avoid blown highlights
- avoid crushed blacks
- avoid HDR look

QUALITY & OUTPUT:
- photorealistic result
- output long edge ≥ 4096 px`;
}
//# sourceMappingURL=photo-prompts.js.map