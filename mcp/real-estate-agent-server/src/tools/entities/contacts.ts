/**
 * Contact management tools
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ContactTypeSchema,
  ContactStatusSchema,
  AgencyIdSchema,
} from "../../schemas/common.js";
import {
  getSupabaseClient,
  queryList,
  getById,
  insertRecord,
  updateRecord,
  deleteRecord,
} from "../../services/supabase.js";
import { resolveContact } from "../../services/fuzzy-search.js";
import { createErrorResponse, createSuccessResponse } from "../../utils/errors.js";
import { formatContact, formatContactList } from "../../services/formatters.js";
import type { Contact } from "../../types.js";

/**
 * Register all contact-related tools
 */
export function registerContactTools(server: McpServer): void {
  // List contacts
  server.tool(
    "re_list_contacts",
    `List contacts with filtering and search.

Examples:
- "Show me all my buyer contacts"
- "List leads from this week"
- "Find contacts tagged with 'investor'"`,
    {
      type: ContactTypeSchema.optional().describe("Filter by contact type"),
      status: ContactStatusSchema.optional().describe("Filter by status"),
      search: z.string().optional().describe("Search in name, email, phone"),
      tags: z.array(z.string()).optional().describe("Filter by tags"),
      limit: z.number().min(1).max(100).default(20).describe("Max results"),
      offset: z.number().min(0).default(0).describe("Offset for pagination"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const { data, count, error } = await queryList<Contact>({
          table: "contacts",
          agencyId: args.agency_id,
          limit: args.limit,
          offset: args.offset,
          orderBy: "updated_at",
          orderDirection: "desc",
          filters: {
            type: args.type,
            status: args.status,
          },
          search: args.search
            ? { columns: ["first_name", "last_name", "email", "phone"], query: args.search }
            : undefined,
        });

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(
          formatContactList(data, {
            total: count,
            offset: args.offset,
            limit: args.limit,
          })
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Get single contact
  server.tool(
    "re_get_contact",
    `Get detailed information about a specific contact.

Examples:
- "Get contact details for John Smith"
- "Show me contact abc-123"`,
    {
      query: z.string().describe("Contact ID or name to search for"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const result = await resolveContact(args.query, args.agency_id);

        if (!result.contact) {
          const msg = result.suggestions
            ? `Contact not found. Did you mean: ${result.suggestions.map(s => `${s.first_name} ${s.last_name}`).join(", ")}?`
            : `Contact not found: ${args.query}`;
          return createErrorResponse(msg);
        }

        return createSuccessResponse(formatContact(result.contact, { detailed: true }));
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Create or update contact
  server.tool(
    "re_upsert_contact",
    `Create a new contact or update existing one.

Examples:
- "Create a new buyer contact named John Smith"
- "Add lead: Marie Dupont, marie@email.com, +352 621 123 456"
- "Update contact status to qualified"`,
    {
      id: z.string().optional().describe("Contact ID (for updates)"),
      type: ContactTypeSchema.describe("Contact type"),
      first_name: z.string().describe("First name"),
      last_name: z.string().describe("Last name"),
      email: z.string().email().optional().describe("Email address"),
      phone: z.string().optional().describe("Phone number"),
      source: z.string().default("mcp").describe("Lead source"),
      status: ContactStatusSchema.default("new").describe("Status"),
      tags: z.array(z.string()).optional().describe("Tags"),
      notes: z.string().optional().describe("Notes"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const contactData: Record<string, unknown> = {
          agency_id: args.agency_id,
          type: args.type,
          first_name: args.first_name,
          last_name: args.last_name,
          email: args.email || null,
          phone: args.phone || null,
          source: args.source,
          status: args.status,
          tags: args.tags || [],
          notes: args.notes || "",
        };

        let result: Contact;
        let isNew = true;

        if (args.id) {
          // Update existing
          const { data, error } = await updateRecord<Contact>(
            "contacts",
            args.id,
            args.agency_id,
            contactData
          );

          if (error) {
            return createErrorResponse(error);
          }

          if (!data) {
            return createErrorResponse(`Contact not found: ${args.id}`);
          }

          result = data;
          isNew = false;
        } else {
          // Create new
          const { data, error } = await insertRecord<Contact>("contacts", contactData);

          if (error) {
            return createErrorResponse(error);
          }

          if (!data) {
            return createErrorResponse("Failed to create contact");
          }

          result = data;
        }

        const action = isNew ? "created" : "updated";
        return createSuccessResponse(
          `# Contact ${action.charAt(0).toUpperCase() + action.slice(1)}!\n\n` +
            formatContact(result, { detailed: true })
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Delete contact
  server.tool(
    "re_delete_contact",
    `Delete a contact.

Examples:
- "Delete contact abc-123"
- "Remove this contact"`,
    {
      id: z.string().describe("Contact ID to delete"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        // Get contact first to show name
        const { data: contact } = await getById<Contact>("contacts", args.id, args.agency_id);

        const { success, error } = await deleteRecord("contacts", args.id, args.agency_id);

        if (error) {
          return createErrorResponse(error);
        }

        if (!success) {
          return createErrorResponse(`Failed to delete contact: ${args.id}`);
        }

        const name = contact ? `${contact.first_name} ${contact.last_name}` : args.id;
        return createSuccessResponse(`Contact **${name}** has been deleted.`);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Update contact status
  server.tool(
    "re_update_contact_status",
    `Update a contact's status in the pipeline.

Examples:
- "Mark John Smith as qualified"
- "Move contact to nurturing"
- "Close this lead as converted"`,
    {
      query: z.string().describe("Contact ID or name"),
      status: ContactStatusSchema.describe("New status"),
      notes: z.string().optional().describe("Optional notes about the change"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const result = await resolveContact(args.query, args.agency_id);

        if (!result.contact) {
          const msg = result.suggestions
            ? `Contact not found. Did you mean: ${result.suggestions.map(s => `${s.first_name} ${s.last_name}`).join(", ")}?`
            : `Contact not found: ${args.query}`;
          return createErrorResponse(msg);
        }

        const updates: Record<string, unknown> = {
          status: args.status,
          updated_at: new Date().toISOString(),
        };

        if (args.notes) {
          const timestamp = new Date().toISOString().split("T")[0];
          updates.notes = result.contact.notes
            ? `${result.contact.notes}\n\n[${timestamp}] Status → ${args.status}: ${args.notes}`
            : `[${timestamp}] Status → ${args.status}: ${args.notes}`;
        }

        const { data, error } = await updateRecord<Contact>(
          "contacts",
          result.contact.id,
          args.agency_id,
          updates
        );

        if (error) {
          return createErrorResponse(error);
        }

        if (!data) {
          return createErrorResponse(`Failed to update contact`);
        }

        return createSuccessResponse(
          `# Status Updated!\n\n` +
            `**${data.first_name} ${data.last_name}** is now **${args.status}**` +
            (args.notes ? `\n\nNote: ${args.notes}` : "")
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Tag contact
  server.tool(
    "re_tag_contact",
    `Add or remove tags from a contact.

Examples:
- "Tag John as 'investor'"
- "Add 'hot lead' tag to this contact"
- "Remove 'inactive' tag"`,
    {
      query: z.string().describe("Contact ID or name"),
      add_tags: z.array(z.string()).optional().describe("Tags to add"),
      remove_tags: z.array(z.string()).optional().describe("Tags to remove"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const result = await resolveContact(args.query, args.agency_id);

        if (!result.contact) {
          const msg = result.suggestions
            ? `Contact not found. Did you mean: ${result.suggestions.map(s => `${s.first_name} ${s.last_name}`).join(", ")}?`
            : `Contact not found: ${args.query}`;
          return createErrorResponse(msg);
        }

        let tags = [...(result.contact.tags || [])];

        // Add new tags
        if (args.add_tags) {
          for (const tag of args.add_tags) {
            if (!tags.includes(tag)) {
              tags.push(tag);
            }
          }
        }

        // Remove tags
        if (args.remove_tags) {
          tags = tags.filter((t) => !args.remove_tags!.includes(t));
        }

        const { data, error } = await updateRecord<Contact>(
          "contacts",
          result.contact.id,
          args.agency_id,
          { tags }
        );

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(
          `# Tags Updated!\n\n` +
            `**${result.contact.first_name} ${result.contact.last_name}**\n\n` +
            `Tags: ${tags.length > 0 ? tags.map((t) => `\`${t}\``).join(", ") : "_(none)_"}`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}
