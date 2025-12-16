/**
 * AI Photo prompt templates for real estate image editing
 * Ported from lib/real-estate/photo-prompt-templates.ts and lib/headshot/headshot-prompts.ts
 */
import type { VirtualStagingStyle, HeadshotStyleId, HeadshotOutfitId, CameraAngle } from "../constants.js";
export declare function renderVirtualStagingPrompt(input: {
    style: VirtualStagingStyle;
    roomType?: string;
    occupancy?: "empty" | "partly_furnished";
}): string;
export declare function renderDeclutterPrompt(): string;
export declare function renderRemovePersonalItemsPrompt(): string;
export declare function renderDayToTwilightPrompt(): string;
export declare function renderSkyReplacementPrompt(): string;
export declare function renderVirtualRenovationPrompt(renovationRequest: string): string;
export declare function renderBrightenPrompt(): string;
export declare function renderStraightenPrompt(): string;
export declare function renderRemoveCarsPeoplePrompt(): string;
export declare function renderEnhanceLandscapingPrompt(): string;
export declare function renderRemovePowerLinesPrompt(): string;
export declare function renderPoolCleanupPrompt(): string;
export declare function renderChangeCameraAnglePrompt(input: {
    targetAngle: CameraAngle;
    roomType?: string;
    strength?: "subtle" | "moderate" | "strong";
}): string;
export declare function renderHeadshotPrompt(input: {
    style: HeadshotStyleId;
    outfit: HeadshotOutfitId;
    customOutfit?: string;
    mode: "full_headshot" | "clothes_only";
}): string;
export declare function renderFloorPlanTo3DPrompt(input: {
    style: VirtualStagingStyle;
    includeLabels?: boolean;
}): string;
/**
 * Enhance photo prompt
 */
export declare function renderEnhancePrompt(adjustments?: string[]): string;
/**
 * Green grass prompt
 */
export declare function renderGreenGrassPrompt(intensity?: string): string;
/**
 * Remove object prompt
 */
export declare function renderRemoveObjectPrompt(objectToRemove: string, fillWith?: string): string;
/**
 * Pool water prompt
 */
export declare function renderPoolWaterPrompt(color?: string): string;
/**
 * Add fire to fireplace prompt
 */
export declare function renderAddFirePrompt(intensity?: string): string;
/**
 * Add TV content prompt
 */
export declare function renderAddTvContentPrompt(contentType?: string): string;
/**
 * Brighten/darken adjustment prompt
 */
export declare function renderBrightenDarkenPrompt(adjustment: string, intensity?: string): string;
//# sourceMappingURL=photo-prompts.d.ts.map