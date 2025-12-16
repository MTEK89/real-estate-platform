/**
 * Property photo editing tools - Day to twilight, declutter, enhance, etc.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ImageUrlSchema, AgencyIdSchema } from "../../schemas/common.js";
import { submitAndWaitForResult, isFalConfigured } from "../../services/fal.js";
import {
  renderDayToTwilightPrompt,
  renderDeclutterPrompt,
  renderEnhancePrompt,
  renderSkyReplacementPrompt,
  renderGreenGrassPrompt,
  renderRemoveObjectPrompt,
  renderPoolWaterPrompt,
  renderAddFirePrompt,
  renderAddTvContentPrompt,
  renderBrightenDarkenPrompt,
} from "../../services/photo-prompts.js";
import { createErrorResponse, createSuccessResponse, getFalNotConfiguredMessage } from "../../utils/errors.js";

/**
 * Register all photo editing tools
 */
export function registerPhotoEditTools(server: McpServer): void {
  // Day to Twilight
  server.tool(
    "re_day_to_twilight",
    `Transform a daytime exterior photo into a stunning twilight/dusk shot.

Creates dramatic evening ambiance with:
- Warm interior lighting glowing through windows
- Beautiful dusk sky
- Soft exterior lighting

Perfect for creating eye-catching listing photos.

Examples:
- "Make this a twilight photo"
- "Convert to dusk lighting"
- "Add evening ambiance"`,
    {
      image_url: ImageUrlSchema.describe("URL of the daytime exterior photo"),
      intensity: z.enum(["subtle", "moderate", "dramatic"]).default("moderate")
        .describe("Twilight intensity"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderDayToTwilightPrompt();

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Day to twilight conversion failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Day to twilight incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Twilight Conversion Complete!\n\n` +
            `**Intensity**: ${args.intensity}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The photo now has beautiful evening ambiance.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Declutter
  server.tool(
    "re_declutter",
    `Remove clutter and personal items from property photos.

Removes:
- Personal photos and memorabilia
- Excess furniture and items
- Children's toys
- Pet items
- Visible cables and clutter

Creates a clean, neutral space for buyers to envision themselves.

Examples:
- "Declutter this room"
- "Remove personal items from the photo"
- "Clean up the living room photo"`,
    {
      image_url: ImageUrlSchema.describe("URL of the cluttered photo"),
      level: z.enum(["light", "moderate", "thorough"]).default("moderate")
        .describe("Declutter level"),
      preserve: z.array(z.string()).optional()
        .describe("Items to keep (e.g., ['plants', 'artwork'])"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderDeclutterPrompt();

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Declutter failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Declutter incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Declutter Complete!\n\n` +
            `**Level**: ${args.level}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The space now looks clean and ready for listing.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Enhance photo
  server.tool(
    "re_enhance_photo",
    `Enhance property photo quality with professional adjustments.

Improvements:
- Color correction and white balance
- Exposure optimization
- Sharpness and clarity
- HDR-like dynamic range
- Lens distortion correction

Examples:
- "Enhance this photo"
- "Make this photo look professional"
- "Improve the image quality"`,
    {
      image_url: ImageUrlSchema.describe("URL of the photo to enhance"),
      adjustments: z.array(z.enum(["brightness", "contrast", "saturation", "sharpness", "hdr", "color_correction"]))
        .optional()
        .describe("Specific adjustments to apply"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderEnhancePrompt(args.adjustments);

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Photo enhancement failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Photo enhancement incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Photo Enhanced!\n\n` +
            (args.adjustments ? `**Adjustments**: ${args.adjustments.join(", ")}\n` : "") +
            `**Result**: ${result.images[0].url}\n\n` +
            `The photo now looks professionally edited.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Sky replacement
  server.tool(
    "re_sky_replacement",
    `Replace overcast or dull skies with beautiful alternatives.

Sky options:
- blue_sky: Clear blue sky with light clouds
- sunset: Warm sunset colors
- dramatic: Dramatic cloud formations
- twilight: Evening sky
- clear: Perfectly clear blue

Examples:
- "Replace the grey sky with blue"
- "Add a sunset sky"
- "Make the sky more dramatic"`,
    {
      image_url: ImageUrlSchema.describe("URL of the exterior photo"),
      sky_type: z.enum(["blue_sky", "sunset", "dramatic", "twilight", "clear"]).default("blue_sky")
        .describe("Type of sky to add"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderSkyReplacementPrompt();

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Sky replacement failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Sky replacement incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Sky Replaced!\n\n` +
            `**Sky Type**: ${args.sky_type.replace("_", " ")}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The photo now has a beautiful sky.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Green grass
  server.tool(
    "re_green_grass",
    `Make brown or patchy grass look lush and green.

Perfect for:
- Winter photos with dead grass
- Drought-affected lawns
- Patchy or uneven grass

Examples:
- "Make the grass green"
- "Fix the lawn"
- "Make the garden look better"`,
    {
      image_url: ImageUrlSchema.describe("URL of the exterior photo"),
      intensity: z.enum(["natural", "vibrant", "lush"]).default("natural")
        .describe("Grass color intensity"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderGreenGrassPrompt(args.intensity);

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Green grass failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Green grass incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Grass Greened!\n\n` +
            `**Intensity**: ${args.intensity}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The lawn now looks healthy and green.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Remove object
  server.tool(
    "re_remove_object",
    `Remove unwanted objects from property photos.

Can remove:
- Trash cans and bins
- Cars from driveways
- Lawn equipment
- Construction materials
- Signs and posts
- Any specified object

Examples:
- "Remove the car from the driveway"
- "Take out the trash cans"
- "Remove the ladder from the photo"`,
    {
      image_url: ImageUrlSchema.describe("URL of the photo"),
      object_to_remove: z.string().describe("Description of the object to remove"),
      fill_with: z.enum(["auto", "grass", "pavement", "floor", "wall"]).default("auto")
        .describe("What to fill the space with"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderRemoveObjectPrompt(args.object_to_remove, args.fill_with);

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Object removal failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Object removal incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Object Removed!\n\n` +
            `**Removed**: ${args.object_to_remove}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The object has been seamlessly removed.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Pool water enhancement
  server.tool(
    "re_pool_water",
    `Make pool water look crystal clear and inviting.

Transforms:
- Murky water to clear blue
- Green algae-affected pools
- Reflections and sparkle

Examples:
- "Make the pool water clear"
- "Fix the green pool"
- "Make the pool look inviting"`,
    {
      image_url: ImageUrlSchema.describe("URL of the pool photo"),
      color: z.enum(["crystal_blue", "turquoise", "caribbean", "natural"]).default("crystal_blue")
        .describe("Pool water color"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderPoolWaterPrompt(args.color);

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Pool water enhancement failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Pool water enhancement incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Pool Water Enhanced!\n\n` +
            `**Color**: ${args.color.replace("_", " ")}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The pool now looks crystal clear and inviting.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Add fire to fireplace
  server.tool(
    "re_add_fire",
    `Add realistic flames to an empty fireplace.

Creates cozy ambiance with:
- Realistic flames
- Warm glow
- Proper lighting effects

Examples:
- "Add fire to the fireplace"
- "Light up the fireplace"
- "Make the fireplace look cozy"`,
    {
      image_url: ImageUrlSchema.describe("URL of the photo with fireplace"),
      intensity: z.enum(["gentle", "moderate", "roaring"]).default("moderate")
        .describe("Fire intensity"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderAddFirePrompt(args.intensity);

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Add fire failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Add fire incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Fire Added!\n\n` +
            `**Intensity**: ${args.intensity}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The fireplace now looks warm and inviting.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Add TV content
  server.tool(
    "re_add_tv_content",
    `Add attractive content to blank TV screens.

Options:
- nature: Beautiful landscape scenery
- fireplace: Cozy fireplace video
- abstract: Modern abstract art
- black: Clean black screen

Examples:
- "Add content to the TV"
- "Put a nature scene on the TV"
- "Make the TV screen look good"`,
    {
      image_url: ImageUrlSchema.describe("URL of the photo with TV"),
      content_type: z.enum(["nature", "fireplace", "abstract", "black"]).default("nature")
        .describe("Type of content to show"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderAddTvContentPrompt(args.content_type);

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Add TV content failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Add TV content incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# TV Content Added!\n\n` +
            `**Content**: ${args.content_type}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The TV now displays attractive content.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Brighten/darken
  server.tool(
    "re_adjust_lighting",
    `Brighten dark rooms or balance overexposed areas.

Examples:
- "Brighten this dark room"
- "The photo is too bright, tone it down"
- "Balance the lighting"`,
    {
      image_url: ImageUrlSchema.describe("URL of the photo"),
      adjustment: z.enum(["brighten", "darken", "balance"]).describe("Type of adjustment"),
      intensity: z.enum(["subtle", "moderate", "strong"]).default("moderate")
        .describe("Adjustment intensity"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderBrightenDarkenPrompt(args.adjustment, args.intensity);

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Lighting adjustment failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Lighting adjustment incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Lighting Adjusted!\n\n` +
            `**Adjustment**: ${args.adjustment}\n` +
            `**Intensity**: ${args.intensity}\n` +
            `**Result**: ${result.images[0].url}\n\n` +
            `The photo lighting has been optimized.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}
