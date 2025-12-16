/**
 * Create listing workflow tool - The main "here are the photos, create a listing" workflow
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  PropertyTypeSchema,
  AgencyIdSchema,
  AddressSchema,
  CharacteristicsSchema,
} from "../../schemas/common.js";
import { insertRecord, generatePropertyReference } from "../../services/supabase.js";
import { resolveContact } from "../../services/fuzzy-search.js";
import { formatPrice, formatAddressShort } from "../../services/formatters.js";
import { createErrorResponse, createSuccessResponse, getContactNotFoundMessage } from "../../utils/errors.js";
import type { Property, Contact } from "../../types.js";

/**
 * Register create listing workflow tool
 */
export function registerCreateListingTools(server: McpServer): void {
  server.tool(
    "re_create_listing",
    `Create a new property listing from a natural language description.

This is the workflow tool that agents use most often. It handles:
1. Creating the property record
2. Linking to owner (if provided)
3. Adding images
4. Generating reference number

Examples:
- "Create a listing for a 3-bedroom apartment at 12 Grand Rue, Luxembourg, 450,000 EUR"
- "Here are the photos, create a listing: 4 bedroom house, 180m², garden, 850,000"
- "New property: Office space, 500m², Kirchberg, owner is Jean Dupont"`,
    {
      type: PropertyTypeSchema.describe("Property type: house, apartment, office, retail, land"),
      price: z.number().positive().describe("Asking price in EUR"),
      address: AddressSchema.describe("Property address"),
      characteristics: CharacteristicsSchema.optional().describe("Property characteristics"),
      description: z.string().optional().describe("Property description (can be natural language - will be formatted)"),
      owner_query: z.string().optional().describe("Owner contact ID or name (will create if not found)"),
      owner_first_name: z.string().optional().describe("Owner first name (if creating new)"),
      owner_last_name: z.string().optional().describe("Owner last name (if creating new)"),
      owner_phone: z.string().optional().describe("Owner phone (if creating new)"),
      owner_email: z.string().email().optional().describe("Owner email (if creating new)"),
      images: z.array(z.string().url()).optional().describe("Property image URLs"),
      tags: z.array(z.string()).optional().describe("Tags for the listing"),
      publish: z.boolean().default(false).describe("Publish immediately (default: draft)"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const actions_taken: string[] = [];
        let owner: Contact | null = null;

        // Step 1: Handle owner
        let ownerId: string | undefined;

        if (args.owner_query) {
          const ownerResult = await resolveContact(args.owner_query, args.agency_id);

          if (ownerResult.contact) {
            ownerId = ownerResult.contact.id;
            owner = ownerResult.contact;
            actions_taken.push(`Linked to existing owner: ${ownerResult.contact.first_name} ${ownerResult.contact.last_name}`);
          } else if (args.owner_first_name && args.owner_last_name) {
            // Create new owner contact
            const { data: newOwner, error: ownerError } = await insertRecord<Contact>("contacts", {
              first_name: args.owner_first_name,
              last_name: args.owner_last_name,
              type: "seller",
              status: "new",
              email: args.owner_email || null,
              phone: args.owner_phone || null,
              source: "mcp",
              tags: [],
              notes: "",
              agency_id: args.agency_id,
            });
            if (ownerError || !newOwner) {
              return createErrorResponse(ownerError || "Failed to create owner contact");
            }
            ownerId = newOwner.id;
            owner = newOwner;
            actions_taken.push(`Created new owner contact: ${newOwner.first_name} ${newOwner.last_name}`);
          } else {
            // Return suggestions
            return createErrorResponse(
              getContactNotFoundMessage(args.owner_query, ownerResult.suggestions) +
                "\n\nTo create a new owner, also provide: owner_first_name, owner_last_name"
            );
          }
        } else if (args.owner_first_name && args.owner_last_name) {
          // Create new owner without search
          const { data: newOwner, error: ownerError } = await insertRecord<Contact>("contacts", {
            first_name: args.owner_first_name,
            last_name: args.owner_last_name,
            type: "seller",
            status: "new",
            email: args.owner_email || null,
            phone: args.owner_phone || null,
            source: "mcp",
            tags: [],
            notes: "",
            agency_id: args.agency_id,
          });
          if (ownerError || !newOwner) {
            return createErrorResponse(ownerError || "Failed to create owner contact");
          }
          ownerId = newOwner.id;
          owner = newOwner;
          actions_taken.push(`Created new owner contact: ${newOwner.first_name} ${newOwner.last_name}`);
        }

        // Step 2: Generate reference
        const reference = generatePropertyReference(args.type, args.address?.city || "");
        actions_taken.push(`Generated reference: ${reference}`);

        // Step 3: Create property
        const { data: property, error: propError } = await insertRecord<Property>("properties", {
          reference,
          type: args.type,
          status: args.publish ? "published" : "draft",
          price: args.price,
          address: args.address,
          characteristics: args.characteristics || {},
          description: args.description || "",
          owner_id: ownerId || null,
          tags: args.tags || [],
          images: args.images || [],
          agency_id: args.agency_id,
        });

        if (propError || !property) {
          return createErrorResponse(propError || "Failed to create property");
        }

        actions_taken.push(`Created property listing (${args.publish ? "published" : "draft"})`);

        if (args.images && args.images.length > 0) {
          actions_taken.push(`Added ${args.images.length} image(s)`);
        }

        // Format response
        const lines = [
          `# Listing Created Successfully!`,
          "",
          `**Reference**: ${property.reference}`,
          `**Type**: ${property.type}`,
          `**Price**: ${formatPrice(property.price)}`,
          `**Address**: ${formatAddressShort(property.address)}`,
          `**Status**: ${property.status}`,
        ];

        if (owner) {
          lines.push(`**Owner**: ${owner.first_name} ${owner.last_name}`);
        }

        if (property.characteristics) {
          const chars = property.characteristics;
          const charParts = [];
          if (chars.surface) charParts.push(`${chars.surface} m²`);
          if (chars.bedrooms) charParts.push(`${chars.bedrooms} bed`);
          if (chars.bathrooms) charParts.push(`${chars.bathrooms} bath`);
          if (charParts.length > 0) {
            lines.push(`**Features**: ${charParts.join(" | ")}`);
          }
        }

        if (property.images.length > 0) {
          lines.push(`**Images**: ${property.images.length} photo(s)`);
        }

        lines.push("");
        lines.push("## Actions Taken");
        for (const action of actions_taken) {
          lines.push(`- ✅ ${action}`);
        }

        if (property.status === "draft") {
          lines.push("");
          lines.push("💡 **Next Steps**: Use `re_update_property_status` to publish when ready.");
        }

        lines.push("");
        lines.push(`**ID**: \`${property.id}\``);

        return createSuccessResponse(lines.join("\n"));
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Quick listing from photos
  server.tool(
    "re_quick_listing",
    `Create a minimal listing quickly - just the essentials.

Perfect for: "Here are some photos, create a quick listing"

Examples:
- "Quick listing: apartment, 350k, Esch-sur-Alzette"
- "Add a house listing for 600,000 in Strassen"`,
    {
      type: PropertyTypeSchema.describe("Property type"),
      price: z.number().positive().describe("Price in EUR"),
      city: z.string().describe("City name"),
      street: z.string().optional().describe("Street address"),
      images: z.array(z.string().url()).optional().describe("Image URLs"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const reference = generatePropertyReference(args.type, args.city);

        const { data: property, error } = await insertRecord<Property>("properties", {
          reference,
          type: args.type,
          status: "draft",
          price: args.price,
          address: {
            city: args.city,
            street: args.street || "",
            postal_code: "",
            country: "Luxembourg",
          },
          characteristics: {},
          tags: [],
          images: args.images || [],
          agency_id: args.agency_id,
        });

        if (error || !property) {
          return createErrorResponse(error || "Failed to create property");
        }

        return createSuccessResponse(
          `Quick listing created!\n\n` +
            `**${reference}** - ${args.type}\n` +
            `${formatPrice(args.price)} | ${args.city}\n` +
            (args.images?.length ? `${args.images.length} photo(s)\n` : "") +
            `\n📝 Status: Draft\n\n` +
            `**ID**: \`${property.id}\`\n\n` +
            `Use \`re_get_property\` to see full details or \`re_upsert_property\` to add more information.`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}
