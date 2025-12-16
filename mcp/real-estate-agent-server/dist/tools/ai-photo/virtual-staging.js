/**
 * Virtual staging AI photo tool
 */
import { z } from "zod";
import { VirtualStagingStyleSchema, ImageUrlSchema, AgencyIdSchema } from "../../schemas/common.js";
import { submitAndWaitForResult, isFalConfigured } from "../../services/fal.js";
import { renderVirtualStagingPrompt } from "../../services/photo-prompts.js";
import { createErrorResponse, createSuccessResponse, getFalNotConfiguredMessage } from "../../utils/errors.js";
/**
 * Register virtual staging tool
 */
export function registerVirtualStagingTools(server) {
    server.tool("re_virtual_staging", `Add virtual furniture and décor to empty property photos.

Transform empty rooms into beautifully staged spaces that help buyers visualize the potential.

Available styles:
- modern: Clean lines, minimalist, contemporary furniture
- traditional: Classic, elegant, timeless pieces
- scandinavian: Light woods, neutral colors, hygge vibes
- industrial: Exposed elements, metal accents, loft style
- minimalist: Essential pieces only, maximum space
- luxurious: High-end, premium materials, elegant

Examples:
- "Stage this empty living room in modern style"
- "Add Scandinavian furniture to the bedroom"
- "Make this office look luxurious"`, {
        image_url: ImageUrlSchema.describe("URL of the empty room photo"),
        style: VirtualStagingStyleSchema.describe("Staging style"),
        room_type: z.enum(["living_room", "bedroom", "dining_room", "office", "kitchen", "bathroom", "other"])
            .optional()
            .describe("Type of room (helps with furniture selection)"),
        notes: z.string().optional().describe("Additional instructions (e.g., 'focus on the window area', 'add plants')"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            if (!isFalConfigured()) {
                return createErrorResponse(getFalNotConfiguredMessage());
            }
            const prompt = renderVirtualStagingPrompt({
                style: args.style,
                roomType: args.room_type?.replace("_", " "),
            });
            const result = await submitAndWaitForResult(prompt, [args.image_url]);
            if (result.status === "FAILED" || result.error) {
                return createErrorResponse(`Virtual staging failed: ${result.error || "Unknown error"}`);
            }
            if (result.status !== "COMPLETED" || !result.images?.length) {
                return createErrorResponse(`Virtual staging incomplete. Status: ${result.status}`);
            }
            return createSuccessResponse(`# Virtual Staging Complete!\n\n` +
                `**Style**: ${args.style}\n` +
                (args.room_type ? `**Room**: ${args.room_type.replace("_", " ")}\n` : "") +
                `\n**Result**: ${result.images[0].url}\n\n` +
                `The staged photo is ready to use in your listing.`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Quick staging with defaults
    server.tool("re_quick_stage", `Quickly stage a room with automatic style detection.

Examples:
- "Stage this room" (uses modern style by default)
- "Quick stage living room"`, {
        image_url: ImageUrlSchema.describe("URL of the empty room photo"),
        style: VirtualStagingStyleSchema.default("modern").describe("Staging style (default: modern)"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            if (!isFalConfigured()) {
                return createErrorResponse(getFalNotConfiguredMessage());
            }
            const prompt = renderVirtualStagingPrompt({
                style: args.style,
            });
            const result = await submitAndWaitForResult(prompt, [args.image_url]);
            if (result.status === "FAILED" || result.error) {
                return createErrorResponse(`Quick staging failed: ${result.error || "Unknown error"}`);
            }
            if (result.status !== "COMPLETED" || !result.images?.length) {
                return createErrorResponse(`Quick staging incomplete. Status: ${result.status}`);
            }
            return createSuccessResponse(`Quick staging complete!\n\n` +
                `**Style**: ${args.style}\n` +
                `**Result**: ${result.images[0].url}`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
//# sourceMappingURL=virtual-staging.js.map