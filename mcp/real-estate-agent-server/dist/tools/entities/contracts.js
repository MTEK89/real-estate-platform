/**
 * Contract management tools
 */
import { z } from "zod";
import { ContractTypeSchema, ContractStatusSchema, AgencyIdSchema, } from "../../schemas/common.js";
import { getSupabaseClient, getById, insertRecord, updateRecord, deleteRecord, } from "../../services/supabase.js";
import { resolveContact, resolveProperty } from "../../services/fuzzy-search.js";
import { formatContract, formatContractList } from "../../services/formatters.js";
import { createErrorResponse, createSuccessResponse } from "../../utils/errors.js";
import { parseDate, formatDateDisplay } from "../../services/date-parser.js";
/**
 * Register all contract-related tools
 */
export function registerContractTools(server) {
    // List contracts
    server.tool("re_list_contracts", `List contracts with optional filters.

Examples:
- "Show all active mandates" → type: "mandate", status: "active"
- "Pending sales contracts" → type: "sale", status: "pending"`, {
        type: ContractTypeSchema.optional().describe("Filter by contract type"),
        status: ContractStatusSchema.optional().describe("Filter by status"),
        property_query: z.string().optional().describe("Filter by property ID or reference"),
        contact_query: z.string().optional().describe("Filter by contact ID or name"),
        limit: z.number().min(1).max(100).default(20).describe("Max results"),
        offset: z.number().min(0).default(0).describe("Offset for pagination"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const supabase = getSupabaseClient();
            let query = supabase
                .from("contracts")
                .select("*, properties(*), contacts(*)", { count: "exact" })
                .eq("agency_id", args.agency_id)
                .order("created_at", { ascending: false });
            if (args.type)
                query = query.eq("type", args.type);
            if (args.status)
                query = query.eq("status", args.status);
            // Property filter
            if (args.property_query) {
                const propResult = await resolveProperty(args.property_query, args.agency_id);
                if (propResult.property) {
                    query = query.eq("property_id", propResult.property.id);
                }
            }
            // Contact filter
            if (args.contact_query) {
                const contactResult = await resolveContact(args.contact_query, args.agency_id);
                if (contactResult.contact) {
                    query = query.eq("contact_id", contactResult.contact.id);
                }
            }
            query = query.range(args.offset, args.offset + args.limit - 1);
            const { data, error, count } = await query;
            if (error) {
                return createErrorResponse(error.message);
            }
            const contracts = (data || []).map((row) => ({
                contract: row,
                property: row.properties,
                contact: row.contacts,
            }));
            return createSuccessResponse(formatContractList(contracts, {
                total: count || 0,
                offset: args.offset,
                limit: args.limit,
            }));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Get contract details
    server.tool("re_get_contract", `Get details of a specific contract.`, {
        id: z.string().describe("Contract ID"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from("contracts")
                .select("*, properties(*), contacts(*)")
                .eq("id", args.id)
                .eq("agency_id", args.agency_id)
                .single();
            if (error) {
                return createErrorResponse(error.message);
            }
            if (!data) {
                return createErrorResponse(`Contract not found: ${args.id}`);
            }
            const contract = data;
            const property = data.properties;
            const contact = data.contacts;
            return createSuccessResponse(formatContract(contract, { property, contact, detailed: true }));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Create contract
    server.tool("re_create_contract", `Create a new contract (mandate, sale, or rental).

Examples:
- "Create a sale contract for property APT-001 with John Smith"
- "New mandate for Marie's property, 3% commission, exclusive"`, {
        type: ContractTypeSchema.describe("Contract type: mandate, sale, rental"),
        property_query: z.string().describe("Property ID or reference"),
        contact_query: z.string().describe("Contact ID or name"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            // Resolve property
            const propResult = await resolveProperty(args.property_query, args.agency_id);
            if (!propResult.property) {
                const msg = propResult.suggestions
                    ? `Property not found. Did you mean: ${propResult.suggestions.map(s => s.reference).join(", ")}?`
                    : `Property not found: ${args.property_query}`;
                return createErrorResponse(msg);
            }
            // Resolve contact
            const contactResult = await resolveContact(args.contact_query, args.agency_id);
            if (!contactResult.contact) {
                const msg = contactResult.suggestions
                    ? `Contact not found. Did you mean: ${contactResult.suggestions.map(s => `${s.first_name} ${s.last_name}`).join(", ")}?`
                    : `Contact not found: ${args.contact_query}`;
                return createErrorResponse(msg);
            }
            const contractData = {
                type: args.type,
                property_id: propResult.property.id,
                contact_id: contactResult.contact.id,
                property_category: propResult.property.type,
                status: "draft",
                signature_method: "electronic",
                auto_filled: false,
                data: {},
                agency_id: args.agency_id,
            };
            const { data, error } = await insertRecord("contracts", contractData);
            if (error) {
                return createErrorResponse(error);
            }
            if (!data) {
                return createErrorResponse("Failed to create contract");
            }
            const typeEmoji = getContractTypeEmoji(data.type);
            return createSuccessResponse(`# Contract Created!\n\n` +
                `${typeEmoji} **${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Contract**\n` +
                `**Property**: ${propResult.property.reference}\n` +
                `**Client**: ${contactResult.contact.first_name} ${contactResult.contact.last_name}\n` +
                `**Status**: Draft\n` +
                `\n**ID**: \`${data.id}\``);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Update contract status
    server.tool("re_update_contract_status", `Update a contract's status.

Examples:
- "Activate contract [id]" → status: "active"
- "Mark contract as signed" → status: "signed"
- "Complete the sale contract" → status: "completed"`, {
        id: z.string().describe("Contract ID"),
        status: ContractStatusSchema.describe("New status: draft, pending, active, signed, completed, cancelled, expired"),
        notes: z.string().optional().describe("Notes about the status change"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const { data: existing, error: fetchError } = await getById("contracts", args.id, args.agency_id);
            if (fetchError || !existing) {
                return createErrorResponse(fetchError || `Contract not found: ${args.id}`);
            }
            const updateData = {
                status: args.status,
            };
            const { data, error } = await updateRecord("contracts", args.id, args.agency_id, updateData);
            if (error) {
                return createErrorResponse(error);
            }
            const statusEmoji = getContractStatusEmoji(args.status);
            return createSuccessResponse(`# Contract Updated!\n\n` +
                `**Type**: ${existing.type}\n` +
                `**New Status**: ${statusEmoji} ${args.status}\n` +
                (args.notes ? `**Note**: ${args.notes}` : ""));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Sign contract (convenience method)
    server.tool("re_sign_contract", `Mark a contract as signed with optional signing date.`, {
        id: z.string().describe("Contract ID"),
        signed_date: z.string().optional().describe("Signing date (defaults to today)"),
        notes: z.string().optional().describe("Signing notes"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const { data: existing, error: fetchError } = await getById("contracts", args.id, args.agency_id);
            if (fetchError || !existing) {
                return createErrorResponse(fetchError || `Contract not found: ${args.id}`);
            }
            let signedDate = new Date().toISOString();
            if (args.signed_date) {
                const parsed = parseDate(args.signed_date);
                if (parsed) {
                    signedDate = new Date(parsed).toISOString();
                }
            }
            const { data, error } = await updateRecord("contracts", args.id, args.agency_id, {
                status: "signed",
                signed_at: signedDate,
            });
            if (error) {
                return createErrorResponse(error);
            }
            return createSuccessResponse(`# Contract Signed! ✅\n\n` +
                `**Type**: ${existing.type}\n` +
                `**Signed**: ${formatDateDisplay(signedDate.split("T")[0])}\n` +
                (args.notes ? `**Notes**: ${args.notes}` : ""));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Delete contract
    server.tool("re_delete_contract", `Delete a contract.

⚠️ This action cannot be undone. Consider changing status to cancelled instead.`, {
        id: z.string().describe("Contract ID"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const { data: existing, error: fetchError } = await getById("contracts", args.id, args.agency_id);
            if (fetchError || !existing) {
                return createErrorResponse(fetchError || `Contract not found: ${args.id}`);
            }
            const { success, error } = await deleteRecord("contracts", args.id, args.agency_id);
            if (error) {
                return createErrorResponse(error);
            }
            return createSuccessResponse(`Contract deleted: **${existing.type}** contract (\`${existing.id}\`)`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
function getContractTypeEmoji(type) {
    const emojis = {
        mandate: "📋",
        sale: "🏷️",
        rental: "🔑",
    };
    return emojis[type] || "📄";
}
function getContractStatusEmoji(status) {
    const emojis = {
        draft: "📝",
        pending: "⏳",
        active: "🟢",
        signed: "✅",
        completed: "🏁",
        cancelled: "❌",
        expired: "⚠️",
    };
    return emojis[status] || "⚪";
}
//# sourceMappingURL=contracts.js.map