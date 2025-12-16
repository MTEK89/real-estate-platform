/**
 * Professional headshot AI photo tool
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HeadshotStyleSchema, HeadshotOutfitSchema, ImageUrlSchema, AgencyIdSchema } from "../../schemas/common.js";
import { submitAndWaitForResult, isFalConfigured } from "../../services/fal.js";
import { renderHeadshotPrompt } from "../../services/photo-prompts.js";
import { createErrorResponse, createSuccessResponse, getFalNotConfiguredMessage } from "../../utils/errors.js";
import type { HeadshotStyleId, HeadshotOutfitId } from "../../constants.js";

/**
 * Register headshot generation tools
 */
export function registerHeadshotTools(server: McpServer): void {
  server.tool(
    "re_generate_headshot",
    `Generate a professional real estate agent headshot from a casual photo.

Transform any photo into a polished, professional headshot perfect for:
- Business cards
- Website profiles
- Marketing materials
- Social media

Styles:
- studio_grey: Traditional professional headshot
- studio_light: Bright clean lighting
- modern_office: Contemporary, lifestyle feel
- outdoor_soft: Natural outdoor lighting
- bw_dramatic: Magazine-quality, artistic

Outfits:
- agent_suit: Professional suit
- smart_casual: Blazer with open collar
- neutral_tshirt: Minimal and professional
- custom: Specify your own

Examples:
- "Create a professional headshot from this photo"
- "Generate a modern headshot with smart casual attire"
- "Make a corporate headshot for my business card"`,
    {
      image_url: ImageUrlSchema.describe("URL of the source photo"),
      style: HeadshotStyleSchema.describe("Headshot style"),
      outfit: HeadshotOutfitSchema.optional().describe("Outfit style"),
      custom_outfit: z.string().optional().describe("Custom outfit description (if outfit is 'custom')"),
      mode: z.enum(["full_headshot", "clothes_only"]).default("full_headshot")
        .describe("Mode: full_headshot or clothes_only"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderHeadshotPrompt({
          style: args.style as HeadshotStyleId,
          outfit: (args.outfit || "agent_suit") as HeadshotOutfitId,
          customOutfit: args.custom_outfit,
          mode: args.mode,
        });

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Headshot generation failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Headshot generation incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `# Professional Headshot Generated!\n\n` +
            `**Style**: ${args.style}\n` +
            (args.outfit ? `**Outfit**: ${args.outfit.replace("_", " ")}\n` : "") +
            `**Mode**: ${args.mode}\n` +
            `\n**Result**: ${result.images[0].url}\n\n` +
            `Your new professional headshot is ready to use!`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Quick headshot
  server.tool(
    "re_quick_headshot",
    `Quickly generate a classic professional headshot.

Examples:
- "Quick headshot from this photo"
- "Make my photo professional"`,
    {
      image_url: ImageUrlSchema.describe("URL of the source photo"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        if (!isFalConfigured()) {
          return createErrorResponse(getFalNotConfiguredMessage());
        }

        const prompt = renderHeadshotPrompt({
          style: "studio_grey",
          outfit: "agent_suit",
          mode: "full_headshot",
        });

        const result = await submitAndWaitForResult(prompt, [args.image_url]);

        if (result.status === "FAILED" || result.error) {
          return createErrorResponse(`Quick headshot failed: ${result.error || "Unknown error"}`);
        }

        if (result.status !== "COMPLETED" || !result.images?.length) {
          return createErrorResponse(`Quick headshot incomplete. Status: ${result.status}`);
        }

        return createSuccessResponse(
          `Professional headshot generated!\n\n` +
            `**Result**: ${result.images[0].url}`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}
