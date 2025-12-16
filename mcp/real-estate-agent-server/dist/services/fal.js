/**
 * FAL AI client service for photo editing operations
 */
import { fal } from "@fal-ai/client";
import { FAL_MODEL } from "../constants.js";
let falConfigured = false;
/**
 * Get FAL API key from environment
 */
function getFalKey() {
    return process.env.FAL_KEY || process.env.FAL_API_KEY || process.env.FAL_TOKEN;
}
/**
 * Ensure FAL client is configured
 */
export function ensureFalConfigured() {
    if (falConfigured)
        return true;
    const key = getFalKey();
    if (!key) {
        return false;
    }
    fal.config({ credentials: key });
    falConfigured = true;
    return true;
}
/**
 * Check if FAL is available
 */
export function isFalAvailable() {
    return !!getFalKey();
}
/**
 * Check if FAL is configured (alias for isFalAvailable)
 */
export function isFalConfigured() {
    return isFalAvailable();
}
/**
 * Submit an image editing job to FAL
 */
export async function submitPhotoEdit(prompt, imageUrls, options = {}) {
    if (!ensureFalConfigured()) {
        return { requestId: "", error: "FAL API key not configured. Set FAL_KEY environment variable." };
    }
    const numImages = Math.min(Math.max(options.numImages || 1, 1), 4);
    const outputFormat = options.outputFormat || "png";
    try {
        const submit = await fal.queue.submit(FAL_MODEL, {
            input: {
                prompt,
                image_urls: imageUrls,
                num_images: numImages,
                output_format: outputFormat,
                sync_mode: false,
            },
        });
        return { requestId: submit.request_id };
    }
    catch (error) {
        return {
            requestId: "",
            error: error instanceof Error ? error.message : "Unknown error submitting to FAL",
        };
    }
}
/**
 * Check status of a FAL job
 */
export async function checkPhotoEditStatus(requestId) {
    if (!ensureFalConfigured()) {
        return {
            request_id: requestId,
            status: "FAILED",
            error: "FAL API key not configured",
        };
    }
    try {
        const status = await fal.queue.status(FAL_MODEL, { requestId, logs: false });
        const state = status.status;
        if (state !== "COMPLETED") {
            return {
                request_id: requestId,
                status: state,
                queue_position: status.queue_position ?? undefined,
            };
        }
        // Get the result
        const result = await fal.queue.result(FAL_MODEL, { requestId });
        const data = result.data;
        const images = data?.images?.length
            ? data.images.map((img) => ({
                url: img.url,
                content_type: img.content_type,
                file_name: img.file_name,
                file_size: img.file_size,
                width: img.width,
                height: img.height,
            }))
            : data?.image
                ? [
                    {
                        url: data.image.url,
                        content_type: data.image.content_type,
                        file_name: data.image.file_name,
                        file_size: data.image.file_size,
                        width: data.image.width,
                        height: data.image.height,
                    },
                ]
                : [];
        return {
            request_id: requestId,
            status: "COMPLETED",
            images,
        };
    }
    catch (error) {
        return {
            request_id: requestId,
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error checking FAL status",
        };
    }
}
/**
 * Submit and wait for completion (with polling)
 */
export async function submitAndWaitForResult(prompt, imageUrls, options = {}) {
    const { maxWaitMs = 120000, pollIntervalMs = 2000 } = options;
    const { requestId, error } = await submitPhotoEdit(prompt, imageUrls, options);
    if (error || !requestId) {
        return {
            request_id: "",
            status: "FAILED",
            error: error || "Failed to submit job",
        };
    }
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
        const status = await checkPhotoEditStatus(requestId);
        if (status.status === "COMPLETED" || status.status === "FAILED" || status.status === "CANCELLED") {
            return status;
        }
        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    return {
        request_id: requestId,
        status: "IN_PROGRESS",
        error: "Timeout waiting for result. Job is still processing. Use request_id to check status later.",
    };
}
/**
 * Validate image URL (basic validation)
 */
export function isValidImageUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "data:";
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=fal.js.map