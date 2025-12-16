/**
 * Visit/viewing management tools
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  VisitStatusSchema,
  AgencyIdSchema,
} from "../../schemas/common.js";
import {
  getSupabaseClient,
  getById,
  insertRecord,
  updateRecord,
} from "../../services/supabase.js";
import { resolveContact, resolveProperty } from "../../services/fuzzy-search.js";
import { formatVisit, formatVisitList } from "../../services/formatters.js";
import { createErrorResponse, createSuccessResponse } from "../../utils/errors.js";
import { parseDate, formatTime, addMinutes } from "../../services/date-parser.js";
import type { Visit, Property, Contact } from "../../types.js";

/**
 * Register all visit-related tools
 */
export function registerVisitTools(server: McpServer): void {
  // List visits
  server.tool(
    "re_list_visits",
    `List scheduled visits with optional filters.

Examples:
- "Show today's visits" → date: "today"
- "What visits do I have this week?" → date_from: today, date_to: end of week
- "All visits for property APT-001" → property_query: "APT-001"`,
    {
      date: z.string().optional().describe("Natural language date (e.g., 'today', 'tomorrow', 'this week')"),
      date_from: z.string().optional().describe("Start date (YYYY-MM-DD or natural language)"),
      date_to: z.string().optional().describe("End date (YYYY-MM-DD or natural language)"),
      status: VisitStatusSchema.optional().describe("Filter by visit status"),
      property_query: z.string().optional().describe("Property ID or reference to filter by"),
      contact_query: z.string().optional().describe("Contact ID or name to filter by"),
      limit: z.number().min(1).max(100).default(20).describe("Max results"),
      offset: z.number().min(0).default(0).describe("Offset for pagination"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const supabase = getSupabaseClient();

        let query = supabase
          .from("visits")
          .select("*, properties(*), contacts(*)", { count: "exact" })
          .eq("agency_id", args.agency_id)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true });

        // Handle date filtering
        if (args.date) {
          const parsed = parseDate(args.date);
          if (parsed) {
            query = query.eq("date", parsed);
          }
        } else {
          if (args.date_from) {
            const parsed = parseDate(args.date_from);
            if (parsed) {
              query = query.gte("date", parsed);
            }
          }
          if (args.date_to) {
            const parsed = parseDate(args.date_to);
            if (parsed) {
              query = query.lte("date", parsed);
            }
          }
        }

        if (args.status) query = query.eq("status", args.status);

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

        const visits = (data || []).map((row: Record<string, unknown>) => ({
          visit: row as unknown as Visit,
          property: (row as Record<string, unknown>).properties as Property | undefined,
          contact: (row as Record<string, unknown>).contacts as Contact | undefined,
        }));

        return createSuccessResponse(
          formatVisitList(visits, {
            total: count || 0,
            offset: args.offset,
            limit: args.limit,
          })
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Get visit details
  server.tool(
    "re_get_visit",
    `Get details of a specific visit.`,
    {
      id: z.string().describe("Visit ID"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
          .from("visits")
          .select("*, properties(*), contacts(*)")
          .eq("id", args.id)
          .eq("agency_id", args.agency_id)
          .single();

        if (error) {
          return createErrorResponse(error.message);
        }

        if (!data) {
          return createErrorResponse(`Visit not found: ${args.id}`);
        }

        const visit = data as unknown as Visit;
        const property = (data as Record<string, unknown>).properties as Property | undefined;
        const contact = (data as Record<string, unknown>).contacts as Contact | undefined;

        return createSuccessResponse(formatVisit(visit, { property, contact, detailed: true }));
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Create visit
  server.tool(
    "re_create_visit",
    `Schedule a new property visit/viewing.

Examples:
- "Schedule a visit for John at property APT-001 tomorrow at 2pm"
- "Book a viewing with Marie Dupont for the house on Grand Rue next Monday at 10am"`,
    {
      property_query: z.string().describe("Property ID or reference"),
      contact_query: z.string().describe("Contact ID or name"),
      date: z.string().describe("Visit date (e.g., 'tomorrow', 'next Monday', '2024-12-20')"),
      time: z.string().optional().describe("Visit time (e.g., '2pm', '14:00'). Defaults to 10:00"),
      duration_minutes: z.number().int().min(15).max(180).default(60).describe("Duration in minutes"),
      notes: z.string().optional().describe("Additional notes for the visit"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
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

        // Parse date
        const dateStr = parseDate(args.date);
        if (!dateStr) {
          return createErrorResponse(`Could not parse date: ${args.date}`);
        }

        const startTime = args.time ? formatTime(args.time) : "10:00";
        const endTime = addMinutes(startTime, args.duration_minutes);

        const visitData: Record<string, unknown> = {
          property_id: propResult.property.id,
          contact_id: contactResult.contact.id,
          agent_id: args.agency_id, // Would be actual agent ID in real implementation
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          status: "scheduled",
          confirmation_status: "pending",
          notes: args.notes || "",
          agency_id: args.agency_id,
        };

        const { data, error } = await insertRecord<Visit>("visits", visitData);

        if (error) {
          return createErrorResponse(error);
        }

        if (!data) {
          return createErrorResponse("Failed to create visit");
        }

        return createSuccessResponse(
          `# Visit Scheduled!\n\n` +
            `**Date**: ${dateStr}\n` +
            `**Time**: ${startTime} - ${endTime}\n` +
            `**Property**: ${propResult.property.reference}\n` +
            `**Client**: ${contactResult.contact.first_name} ${contactResult.contact.last_name}\n` +
            (args.notes ? `**Notes**: ${args.notes}\n` : "") +
            `\n**ID**: \`${data.id}\``
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Update visit status
  server.tool(
    "re_update_visit_status",
    `Update a visit's status.

Examples:
- "Confirm visit [id]"
- "Mark visit as completed"
- "Cancel tomorrow's visit"`,
    {
      id: z.string().describe("Visit ID"),
      status: VisitStatusSchema.describe("New status: scheduled, confirmed, completed, cancelled"),
      confirmation_status: z.enum(["pending", "confirmed", "declined"]).optional().describe("Client confirmation status"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const updates: Record<string, unknown> = {
          status: args.status,
        };
        if (args.confirmation_status) {
          updates.confirmation_status = args.confirmation_status;
        }

        const { data, error } = await updateRecord<Visit>("visits", args.id, args.agency_id, updates);

        if (error) {
          return createErrorResponse(error);
        }

        if (!data) {
          return createErrorResponse(`Visit not found: ${args.id}`);
        }

        return createSuccessResponse(
          `# Visit Updated!\n\n` +
            `**Status**: ${data.status}\n` +
            `**Confirmation**: ${data.confirmation_status}\n` +
            `**Date**: ${data.date} ${data.start_time}`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Add visit feedback
  server.tool(
    "re_add_visit_feedback",
    `Record feedback after a property visit.

Examples:
- "Client loved the property, interest level 5/5"
- "John wasn't interested, too far from work"`,
    {
      id: z.string().describe("Visit ID"),
      interest_level: z.number().int().min(1).max(5).describe("Interest level 1-5 (5 = very interested)"),
      comments: z.string().optional().describe("Feedback comments"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const feedback = {
          interest_level: args.interest_level,
          comments: args.comments || "",
        };

        const { data, error } = await updateRecord<Visit>("visits", args.id, args.agency_id, {
          feedback,
          status: "completed",
        });

        if (error) {
          return createErrorResponse(error);
        }

        if (!data) {
          return createErrorResponse(`Visit not found: ${args.id}`);
        }

        const stars = "⭐".repeat(args.interest_level);

        return createSuccessResponse(
          `# Feedback Recorded!\n\n` +
            `**Interest**: ${stars} (${args.interest_level}/5)\n` +
            (args.comments ? `**Comments**: ${args.comments}` : "")
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Reschedule visit
  server.tool(
    "re_reschedule_visit",
    `Reschedule an existing visit to a new date/time.

Examples:
- "Move visit to next Tuesday at 3pm"
- "Reschedule to December 20th"`,
    {
      id: z.string().describe("Visit ID"),
      date: z.string().describe("New date"),
      time: z.string().optional().describe("New time"),
      duration_minutes: z.number().int().min(15).max(180).optional().describe("New duration in minutes"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        // Get existing visit for duration
        const { data: existing, error: fetchError } = await getById<Visit>("visits", args.id, args.agency_id);

        if (fetchError || !existing) {
          return createErrorResponse(fetchError || `Visit not found: ${args.id}`);
        }

        const dateStr = parseDate(args.date);
        if (!dateStr) {
          return createErrorResponse(`Could not parse date: ${args.date}`);
        }

        // Calculate duration from existing times if not provided
        let durationMinutes = args.duration_minutes;
        if (!durationMinutes && existing.start_time && existing.end_time) {
          const [startH, startM] = existing.start_time.split(":").map(Number);
          const [endH, endM] = existing.end_time.split(":").map(Number);
          durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        }
        durationMinutes = durationMinutes || 60;

        const startTime = args.time ? formatTime(args.time) : existing.start_time;
        const endTime = addMinutes(startTime, durationMinutes);

        const { data, error } = await updateRecord<Visit>("visits", args.id, args.agency_id, {
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          confirmation_status: "pending", // Reset confirmation
        });

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(
          `# Visit Rescheduled!\n\n` +
            `**New Date**: ${dateStr}\n` +
            `**New Time**: ${startTime} - ${endTime}\n\n` +
            `⚠️ Confirmation status reset to pending`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Cancel visit
  server.tool(
    "re_cancel_visit",
    `Cancel a scheduled visit.`,
    {
      id: z.string().describe("Visit ID"),
      reason: z.string().optional().describe("Cancellation reason"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const { data: existing, error: fetchError } = await getById<Visit>("visits", args.id, args.agency_id);

        if (fetchError || !existing) {
          return createErrorResponse(fetchError || `Visit not found: ${args.id}`);
        }

        const notes = args.reason
          ? `${existing.notes || ""}\n[Cancelled] ${args.reason}`.trim()
          : existing.notes;

        const { data, error } = await updateRecord<Visit>("visits", args.id, args.agency_id, {
          status: "cancelled",
          notes,
        });

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(
          `# Visit Cancelled\n\n` +
            `**Date**: ${existing.date} ${existing.start_time}\n` +
            (args.reason ? `**Reason**: ${args.reason}` : "")
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}
