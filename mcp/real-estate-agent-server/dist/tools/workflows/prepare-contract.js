/**
 * Prepare contract workflow tool - The "prepare a contract for this contact" workflow
 */
import { z } from "zod";
import { ContractTypeSchema, AgencyIdSchema } from "../../schemas/common.js";
import { getSupabaseClient, insertRecord, updateRecord } from "../../services/supabase.js";
import { resolveContact, resolveProperty } from "../../services/fuzzy-search.js";
import { formatAddressShort, formatPrice } from "../../services/formatters.js";
import { createErrorResponse, createSuccessResponse, getContactNotFoundMessage, getPropertyNotFoundMessage } from "../../utils/errors.js";
import { formatDateString } from "../../services/date-parser.js";
/**
 * Register prepare contract workflow tool
 */
export function registerPrepareContractTools(server) {
    server.tool("re_prepare_contract", `Prepare a contract for a property and contact.

This workflow:
1. Finds the property
2. Finds or creates the contact
3. Creates the contract with terms
4. Creates follow-up tasks

Examples:
- "Prepare a sale contract for John Smith, property APT-001, 450,000 EUR"
- "Create a mandate for Marie's property at 3% commission"
- "Draft a rental agreement for the apartment with Pierre, 2000/month"`, {
        type: ContractTypeSchema.describe("Contract type: mandate, sale, rental"),
        property_query: z.string().describe("Property ID or reference"),
        contact_query: z.string().describe("Contact ID or name"),
        // Contract details
        commission_rate: z.number().min(0).max(100).optional().describe("Commission rate (%)"),
        duration_months: z.number().int().positive().optional().describe("Contract duration in months"),
        exclusivity: z.boolean().optional().describe("Exclusive contract?"),
        // Contact creation
        contact_first_name: z.string().optional().describe("First name (if creating new contact)"),
        contact_last_name: z.string().optional().describe("Last name (if creating new contact)"),
        contact_phone: z.string().optional().describe("Phone (if creating new contact)"),
        contact_email: z.string().email().optional().describe("Email (if creating new contact)"),
        contact_type: z.enum(["buyer", "seller", "investor"]).optional().describe("Contact type"),
        // Options
        notes: z.string().optional().describe("Contract notes"),
        create_tasks: z.boolean().default(true).describe("Create follow-up tasks"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const actions_taken = [];
            const next_steps = [];
            let contact = null;
            let property = null;
            // Step 1: Resolve property
            const propResult = await resolveProperty(args.property_query, args.agency_id);
            if (!propResult.property) {
                return createErrorResponse(getPropertyNotFoundMessage(args.property_query, propResult.suggestions));
            }
            property = propResult.property;
            actions_taken.push(`Found property: ${propResult.property.reference}`);
            // Step 2: Resolve or create contact
            const contactResult = await resolveContact(args.contact_query, args.agency_id);
            if (contactResult.contact) {
                contact = contactResult.contact;
                actions_taken.push(`Found contact: ${contactResult.contact.first_name} ${contactResult.contact.last_name}`);
            }
            else if (args.contact_first_name && args.contact_last_name) {
                // Determine contact type based on contract type
                const contactType = args.contact_type || (args.type === "mandate" ? "seller" : "buyer");
                const { data: newContact, error: contactError } = await insertRecord("contacts", {
                    first_name: args.contact_first_name,
                    last_name: args.contact_last_name,
                    type: contactType,
                    status: "new",
                    phone: args.contact_phone || null,
                    email: args.contact_email || null,
                    source: "mcp",
                    tags: [],
                    notes: "",
                    agency_id: args.agency_id,
                });
                if (contactError || !newContact) {
                    return createErrorResponse(contactError || "Failed to create contact");
                }
                contact = newContact;
                actions_taken.push(`Created new contact: ${newContact.first_name} ${newContact.last_name} (${contactType})`);
            }
            else {
                return createErrorResponse(getContactNotFoundMessage(args.contact_query, contactResult.suggestions) +
                    "\n\nTo create a new contact, also provide: contact_first_name, contact_last_name");
            }
            // Step 3: Build contract data
            const contractData = {
                type: args.type,
                property_id: property.id,
                contact_id: contact.id,
                property_category: property.type,
                status: "draft",
                signature_method: "electronic",
                auto_filled: false,
                data: {
                    commission_rate: args.commission_rate,
                    duration_months: args.duration_months,
                    exclusivity: args.exclusivity,
                    notes: args.notes,
                },
                agency_id: args.agency_id,
            };
            // Step 4: Create contract
            const { data: contract, error: contractError } = await insertRecord("contracts", contractData);
            if (contractError || !contract) {
                return createErrorResponse(contractError || "Failed to create contract");
            }
            actions_taken.push(`Created ${args.type} contract (draft)`);
            // Step 5: Update property status for sale contracts
            const supabase = getSupabaseClient();
            const isSaleContract = args.type === "sale_existing" || args.type === "sale_vefa";
            if (isSaleContract && property.status === "published") {
                await updateRecord("properties", property.id, args.agency_id, { status: "under_offer" });
                actions_taken.push("Updated property status to 'under offer'");
            }
            // Step 6: Create follow-up tasks
            if (args.create_tasks) {
                const today = formatDateString(new Date());
                // Review and send contract
                await insertRecord("tasks", {
                    title: `Review and send ${args.type} contract`,
                    description: `Contract for ${contact.first_name} ${contact.last_name} - Property ${property.reference}`,
                    due_date: today,
                    priority: "high",
                    status: "todo",
                    assigned_to: args.agency_id,
                    related_to: { type: "contract", id: contract.id },
                    agency_id: args.agency_id,
                });
                // Follow up on signature
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + 3);
                await insertRecord("tasks", {
                    title: `Follow up on ${args.type} contract signature`,
                    description: `Check if ${contact.first_name} has signed the contract`,
                    due_date: formatDateString(followUpDate),
                    priority: "medium",
                    status: "todo",
                    assigned_to: args.agency_id,
                    related_to: { type: "contract", id: contract.id },
                    agency_id: args.agency_id,
                });
                actions_taken.push("Created follow-up tasks");
            }
            // Determine next steps based on contract type
            if (args.type === "mandate") {
                next_steps.push("Review contract terms with property owner", "Discuss exclusivity and commission", "Get contract signed", "Start marketing the property");
            }
            else if (args.type === "sale_existing" || args.type === "sale_vefa") {
                next_steps.push("Review terms with buyer and seller", "Coordinate with notary", "Schedule signing appointment", "Prepare property handover");
            }
            else if (args.type === "rental") {
                next_steps.push("Review lease terms", "Verify tenant references", "Schedule lease signing", "Plan move-in inspection");
            }
            else if (args.type === "offer") {
                next_steps.push("Review offer terms with buyer", "Present offer to seller", "Negotiate if needed", "Prepare sale contract if accepted");
            }
            else if (args.type === "reservation") {
                next_steps.push("Confirm reservation details", "Collect deposit if required", "Schedule property visit", "Prepare final contract");
            }
            // Format response
            const typeEmoji = {
                mandate: "📋",
                sale_existing: "🏷️",
                sale_vefa: "🏗️",
                rental: "🔑",
                offer: "💰",
                reservation: "📝",
            };
            const emoji = typeEmoji[args.type] || "📄";
            const lines = [
                `# Contract Prepared!`,
                "",
                `## ${emoji} ${args.type.charAt(0).toUpperCase() + args.type.slice(1).replace(/_/g, " ")} Contract`,
                "",
                `### Property`,
                `**${property.reference}**`,
                `${formatAddressShort(property.address)}`,
                `${formatPrice(property.price)}`,
                "",
                `### ${args.type === "mandate" ? "Owner" : "Client"}`,
                `**${contact.first_name} ${contact.last_name}**`,
                contact.phone ? `📞 ${contact.phone}` : "",
                contact.email ? `✉️ ${contact.email}` : "",
                "",
                `### Contract Details`,
                `- **Status**: Draft`,
                args.commission_rate !== undefined ? `- **Commission**: ${args.commission_rate}%` : "",
                args.exclusivity ? `- **Exclusive**: Yes` : "",
                args.duration_months ? `- **Duration**: ${args.duration_months} months` : "",
                "",
                "## Actions Taken",
            ];
            for (const action of actions_taken) {
                lines.push(`- ✅ ${action}`);
            }
            if (next_steps.length > 0) {
                lines.push("");
                lines.push("## Next Steps");
                for (const step of next_steps) {
                    lines.push(`- [ ] ${step}`);
                }
            }
            lines.push("");
            lines.push(`**Contract ID**: \`${contract.id}\``);
            return createSuccessResponse(lines.filter(Boolean).join("\n"));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Quick mandate
    server.tool("re_quick_mandate", `Quickly create a selling mandate for a property.

Examples:
- "Create a mandate for property APT-001 with owner Jean"
- "Quick mandate: HSE-XYZ, Marie Dupont, 3% commission, exclusive"`, {
        property_query: z.string().describe("Property ID or reference"),
        owner_query: z.string().describe("Owner contact ID or name"),
        commission_rate: z.number().min(0).max(100).default(3).describe("Commission rate (%)"),
        exclusivity: z.boolean().default(false).describe("Exclusive mandate?"),
        duration_months: z.number().int().positive().default(3).describe("Mandate duration in months"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            // Resolve property
            const propResult = await resolveProperty(args.property_query, args.agency_id);
            if (!propResult.property) {
                return createErrorResponse(getPropertyNotFoundMessage(args.property_query, propResult.suggestions));
            }
            // Resolve owner
            const ownerResult = await resolveContact(args.owner_query, args.agency_id);
            if (!ownerResult.contact) {
                return createErrorResponse(getContactNotFoundMessage(args.owner_query, ownerResult.suggestions));
            }
            // Create mandate
            const { data: contract, error } = await insertRecord("contracts", {
                type: "mandate",
                property_id: propResult.property.id,
                contact_id: ownerResult.contact.id,
                property_category: propResult.property.type,
                status: "draft",
                signature_method: "electronic",
                auto_filled: false,
                data: {
                    commission_rate: args.commission_rate,
                    duration_months: args.duration_months,
                    exclusivity: args.exclusivity,
                },
                agency_id: args.agency_id,
            });
            if (error || !contract) {
                return createErrorResponse(error || "Failed to create mandate");
            }
            return createSuccessResponse(`Mandate created!\n\n` +
                `**Property**: ${propResult.property.reference}\n` +
                `**Owner**: ${ownerResult.contact.first_name} ${ownerResult.contact.last_name}\n` +
                `**Commission**: ${args.commission_rate}%\n` +
                `**Duration**: ${args.duration_months} months\n` +
                `**Exclusive**: ${args.exclusivity ? "Yes" : "No"}\n\n` +
                `📋 Status: Draft\n\n` +
                `**ID**: \`${contract.id}\`\n\n` +
                `Use \`re_sign_contract\` when the mandate is signed.`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
//# sourceMappingURL=prepare-contract.js.map