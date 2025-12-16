/**
 * FAL AI client service for photo editing operations
 */
import type { AIPhotoResult } from "../types.js";
/**
 * Ensure FAL client is configured
 */
export declare function ensureFalConfigured(): boolean;
/**
 * Check if FAL is available
 */
export declare function isFalAvailable(): boolean;
/**
 * Check if FAL is configured (alias for isFalAvailable)
 */
export declare function isFalConfigured(): boolean;
/**
 * Submit an image editing job to FAL
 */
export declare function submitPhotoEdit(prompt: string, imageUrls: string[], options?: {
    numImages?: number;
    outputFormat?: "png" | "jpeg" | "webp";
}): Promise<{
    requestId: string;
    error?: string;
}>;
/**
 * Check status of a FAL job
 */
export declare function checkPhotoEditStatus(requestId: string): Promise<AIPhotoResult>;
/**
 * Submit and wait for completion (with polling)
 */
export declare function submitAndWaitForResult(prompt: string, imageUrls: string[], options?: {
    numImages?: number;
    outputFormat?: "png" | "jpeg" | "webp";
    maxWaitMs?: number;
    pollIntervalMs?: number;
}): Promise<AIPhotoResult>;
/**
 * Validate image URL (basic validation)
 */
export declare function isValidImageUrl(url: string): boolean;
//# sourceMappingURL=fal.d.ts.map