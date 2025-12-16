/**
 * Property management tools
 */
import { z } from "zod";
import { PropertyTypeSchema, PropertyStatusSchema, AgencyIdSchema, AddressSchema, CharacteristicsSchema, } from "../../schemas/common.js";
import { getSupabaseClient, getById, insertRecord, updateRecord, deleteRecord, generatePropertyReference, } from "../../services/supabase.js";
import { resolveProperty } from "../../services/fuzzy-search.js";
import { createErrorResponse, createSuccessResponse } from "../../utils/errors.js";
import { formatProperty, formatPropertyList, formatPrice } from "../../services/formatters.js";
/**
 * Register all property-related tools
 */
export function registerPropertyTools(server) {
    // List properties
    server.tool("re_list_properties", `List properties with optional filters.

Examples:
- "Show all published apartments" → type: "apartment", status: "published"
- "Properties under 500k" → max_price: 500000
- "3 bedroom houses in Luxembourg City" → type: "house", city: "Luxembourg", min_bedrooms: 3`, {
        type: PropertyTypeSchema.optional().describe("Filter by property type"),
        status: PropertyStatusSchema.optional().describe("Filter by status"),
        min_price: z.number().optional().describe("Minimum price"),
        max_price: z.number().optional().describe("Maximum price"),
        city: z.string().optional().describe("Filter by city"),
        min_bedrooms: z.number().int().optional().describe("Minimum bedrooms"),
        min_surface: z.number().optional().describe("Minimum surface in m²"),
        tags: z.array(z.string()).optional().describe("Filter by tags"),
        owner_id: z.string().optional().describe("Filter by owner contact ID"),
        limit: z.number().min(1).max(100).default(20).describe("Max results"),
        offset: z.number().min(0).default(0).describe("Offset for pagination"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const supabase = getSupabaseClient();
            let query = supabase
                .from("properties")
                .select("*", { count: "exact" })
                .eq("agency_id", args.agency_id)
                .order("updated_at", { ascending: false });
            if (args.type)
                query = query.eq("type", args.type);
            if (args.status)
                query = query.eq("status", args.status);
            if (args.min_price)
                query = query.gte("price", args.min_price);
            if (args.max_price)
                query = query.lte("price", args.max_price);
            if (args.city)
                query = query.ilike("address->>city", `%${args.city}%`);
            if (args.min_bedrooms)
                query = query.gte("characteristics->>bedrooms", args.min_bedrooms);
            if (args.min_surface)
                query = query.gte("characteristics->>surface", args.min_surface);
            if (args.tags && args.tags.length > 0)
                query = query.overlaps("tags", args.tags);
            if (args.owner_id)
                query = query.eq("owner_id", args.owner_id);
            query = query.range(args.offset, args.offset + args.limit - 1);
            const { data, error, count } = await query;
            if (error) {
                return createErrorResponse(error.message);
            }
            const properties = data;
            return createSuccessResponse(formatPropertyList(properties, {
                total: count || 0,
                offset: args.offset,
                limit: args.limit,
            }));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Get property by ID or reference
    server.tool("re_get_property", `Get a specific property by ID or reference number.

Examples:
- "Show property APT-001" → query: "APT-001"
- "Details for the house on Grand Rue" → query: "Grand Rue"`, {
        query: z.string().describe("Property ID, reference, or address to search"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const result = await resolveProperty(args.query, args.agency_id);
            if (!result.property) {
                const msg = result.suggestions
                    ? `Property not found. Did you mean: ${result.suggestions.map(s => s.reference).join(", ")}?`
                    : `Property not found: ${args.query}`;
                return createErrorResponse(msg);
            }
            return createSuccessResponse(formatProperty(result.property, { detailed: true }));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Create or update property
    server.tool("re_upsert_property", `Create a new property or update an existing one.

Examples:
- "Create a new apartment listing at 12 Grand Rue for 450,000"
- "Update property APT-001 price to 500,000"`, {
        id: z.string().optional().describe("Property ID (required for update)"),
        reference: z.string().optional().describe("Property reference (auto-generated if not provided)"),
        type: PropertyTypeSchema.describe("Property type: house, apartment, office, retail, land"),
        status: PropertyStatusSchema.optional().describe("Status: draft, published, under_offer, sold, rented, archived"),
        price: z.number().positive().describe("Price in EUR"),
        address: AddressSchema.describe("Property address"),
        characteristics: CharacteristicsSchema.optional().describe("Property characteristics (surface, rooms, etc.)"),
        owner_id: z.string().optional().describe("Owner contact ID"),
        tags: z.array(z.string()).optional().describe("Tags for categorization"),
        images: z.array(z.string().url()).optional().describe("Image URLs"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            // Generate reference if not provided
            const reference = args.reference || generatePropertyReference(args.type, args.address?.city || "");
            const propertyData = {
                reference,
                type: args.type,
                status: args.status || "draft",
                price: args.price,
                address: args.address,
                characteristics: args.characteristics || {},
                owner_id: args.owner_id || null,
                tags: args.tags || [],
                images: args.images || [],
                agency_id: args.agency_id,
            };
            let result;
            let isNew = true;
            if (args.id) {
                // Update existing
                const { data, error } = await updateRecord("properties", args.id, args.agency_id, propertyData);
                if (error) {
                    return createErrorResponse(error);
                }
                if (!data) {
                    return createErrorResponse(`Property not found: ${args.id}`);
                }
                result = data;
                isNew = false;
            }
            else {
                // Create new
                const { data, error } = await insertRecord("properties", propertyData);
                if (error) {
                    return createErrorResponse(error);
                }
                if (!data) {
                    return createErrorResponse("Failed to create property");
                }
                result = data;
            }
            const action = isNew ? "created" : "updated";
            return createSuccessResponse(`# Property ${action.charAt(0).toUpperCase() + action.slice(1)}!\n\n` +
                formatProperty(result, { detailed: true }));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Delete property
    server.tool("re_delete_property", `Delete a property by ID.

⚠️ This action cannot be undone. Consider archiving instead.`, {
        id: z.string().describe("Property ID to delete"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const { data: property } = await getById("properties", args.id, args.agency_id);
            const { success, error } = await deleteRecord("properties", args.id, args.agency_id);
            if (error) {
                return createErrorResponse(error);
            }
            if (!success) {
                return createErrorResponse(`Failed to delete property: ${args.id}`);
            }
            const ref = property ? property.reference : args.id;
            return createSuccessResponse(`Property **${ref}** has been deleted.`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Update property status
    server.tool("re_update_property_status", `Update a property's listing status.

Examples:
- "Publish property APT-001" → status: "published"
- "Mark property as sold" → status: "sold"
- "Put property under offer" → status: "under_offer"`, {
        query: z.string().describe("Property ID or reference"),
        status: PropertyStatusSchema.describe("New status"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const result = await resolveProperty(args.query, args.agency_id);
            if (!result.property) {
                const msg = result.suggestions
                    ? `Property not found. Did you mean: ${result.suggestions.map(s => s.reference).join(", ")}?`
                    : `Property not found: ${args.query}`;
                return createErrorResponse(msg);
            }
            const { data, error } = await updateRecord("properties", result.property.id, args.agency_id, { status: args.status });
            if (error) {
                return createErrorResponse(error);
            }
            return createSuccessResponse(`# Status Updated!\n\n` +
                `Property **${result.property.reference}** is now **${args.status}**`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Update property price
    server.tool("re_update_property_price", `Update a property's price.

Examples:
- "Reduce price of APT-001 to 420,000"
- "Increase asking price to 500,000"`, {
        query: z.string().describe("Property ID or reference"),
        price: z.number().positive().describe("New price in EUR"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const result = await resolveProperty(args.query, args.agency_id);
            if (!result.property) {
                const msg = result.suggestions
                    ? `Property not found. Did you mean: ${result.suggestions.map(s => s.reference).join(", ")}?`
                    : `Property not found: ${args.query}`;
                return createErrorResponse(msg);
            }
            const oldPrice = result.property.price;
            const { data, error } = await updateRecord("properties", result.property.id, args.agency_id, { price: args.price });
            if (error) {
                return createErrorResponse(error);
            }
            const change = args.price > oldPrice ? "increased" : "reduced";
            const diff = Math.abs(args.price - oldPrice);
            return createSuccessResponse(`# Price ${change.charAt(0).toUpperCase() + change.slice(1)}!\n\n` +
                `**${result.property.reference}**\n\n` +
                `- Old: ${formatPrice(oldPrice)}\n` +
                `- New: ${formatPrice(args.price)}\n` +
                `- Change: ${formatPrice(diff)} (${((diff / oldPrice) * 100).toFixed(1)}%)`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Add images to property
    server.tool("re_add_property_images", `Add images to a property listing.

Examples:
- "Add these photos to property APT-001"`, {
        query: z.string().describe("Property ID or reference"),
        images: z.array(z.string().url()).min(1).describe("Image URLs to add"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const result = await resolveProperty(args.query, args.agency_id);
            if (!result.property) {
                const msg = result.suggestions
                    ? `Property not found. Did you mean: ${result.suggestions.map(s => s.reference).join(", ")}?`
                    : `Property not found: ${args.query}`;
                return createErrorResponse(msg);
            }
            const newImages = [...result.property.images, ...args.images];
            const { error } = await updateRecord("properties", result.property.id, args.agency_id, { images: newImages });
            if (error) {
                return createErrorResponse(error);
            }
            return createSuccessResponse(`# Images Added!\n\n` +
                `Added ${args.images.length} image(s) to **${result.property.reference}**\n\n` +
                `Total images: ${newImages.length}`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Search properties for matching
    server.tool("re_match_properties", `Find properties matching buyer criteria.

Examples:
- "Find apartments for John's budget of 400k-500k"
- "Match properties for buyer looking for 3 bedrooms in Kirchberg"`, {
        type: PropertyTypeSchema.optional().describe("Property type"),
        min_price: z.number().optional().describe("Minimum price"),
        max_price: z.number().optional().describe("Maximum price"),
        city: z.string().optional().describe("Preferred city"),
        min_bedrooms: z.number().int().optional().describe("Minimum bedrooms"),
        min_surface: z.number().optional().describe("Minimum surface in m²"),
        limit: z.number().int().min(1).max(20).default(10).describe("Maximum matches to return"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const supabase = getSupabaseClient();
            let query = supabase
                .from("properties")
                .select("*")
                .eq("agency_id", args.agency_id)
                .eq("status", "published")
                .order("created_at", { ascending: false });
            if (args.type)
                query = query.eq("type", args.type);
            if (args.min_price)
                query = query.gte("price", args.min_price);
            if (args.max_price)
                query = query.lte("price", args.max_price);
            if (args.city)
                query = query.ilike("address->>city", `%${args.city}%`);
            if (args.min_bedrooms)
                query = query.gte("characteristics->>bedrooms", args.min_bedrooms);
            if (args.min_surface)
                query = query.gte("characteristics->>surface", args.min_surface);
            query = query.limit(args.limit);
            const { data, error } = await query;
            if (error) {
                return createErrorResponse(error.message);
            }
            const properties = data;
            if (properties.length === 0) {
                return createSuccessResponse("No matching properties found.");
            }
            const criteria = [
                args.type && `Type: ${args.type}`,
                args.min_price && `Min: ${formatPrice(args.min_price)}`,
                args.max_price && `Max: ${formatPrice(args.max_price)}`,
                args.city && `City: ${args.city}`,
                args.min_bedrooms && `Bedrooms: ${args.min_bedrooms}+`,
                args.min_surface && `Surface: ${args.min_surface}+ m²`,
            ]
                .filter(Boolean)
                .join(" | ");
            return createSuccessResponse(`# Property Matches\n\n` +
                (criteria ? `**Criteria:** ${criteria}\n\n` : "") +
                formatPropertyList(properties));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
//# sourceMappingURL=properties.js.map