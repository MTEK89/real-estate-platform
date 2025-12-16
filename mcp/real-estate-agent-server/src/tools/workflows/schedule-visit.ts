/**
 * Schedule visit workflow tool - The "schedule a visit with X for property Y" workflow
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AgencyIdSchema } from "../../schemas/common.js";
import { getSupabaseClient, insertRecord, updateRecord } from "../../services/supabase.js";
import { resolveContact, resolveProperty } from "../../services/fuzzy-search.js";
import { formatAddressShort, formatPrice } from "../../services/formatters.js";
import { createErrorResponse, createSuccessResponse, getContactNotFoundMessage, getPropertyNotFoundMessage } from "../../utils/errors.js";
import { parseDateAndTime, calculateEndTime, formatDisplayDate, formatDateString } from "../../services/date-parser.js";
import type { Visit, Contact, Property, Task } from "../../types.js";

/**
 * Register schedule visit workflow tool
 */
export function registerScheduleVisitTools(server: McpServer): void {
  server.tool(
    "re_schedule_visit",
    `Schedule a property viewing with automatic contact and property resolution.

This workflow:
1. Finds the contact (or creates if needed)
2. Finds the property
3. Schedules the visit
4. Creates a reminder task

Examples:
- "Schedule a visit with John for property APT-001 tomorrow at 2pm"
- "Book a viewing for Marie Dupont at the house on Grand Rue next Monday"
- "Set up a visit: new contact Pierre Martin, 621 123 456, property HSE-ABC, Friday 10am"`,
    {
      contact_query: z.string().describe("Contact ID or name"),
      property_query: z.string().describe("Property ID or reference"),
      date: z.string().describe("Visit date (e.g., 'tomorrow', 'next Monday', '2024-12-20')"),
      time: z.string().optional().describe("Visit time (e.g., '2pm', '14:00'). Defaults to 10:00"),
      duration_minutes: z.number().int().min(15).max(180).default(60).describe("Duration in minutes"),
      notes: z.string().optional().describe("Notes for the visit"),
      // For creating new contact
      contact_first_name: z.string().optional().describe("First name (if creating new contact)"),
      contact_last_name: z.string().optional().describe("Last name (if creating new contact)"),
      contact_phone: z.string().optional().describe("Phone (if creating new contact)"),
      contact_email: z.string().email().optional().describe("Email (if creating new contact)"),
      contact_type: z.enum(["lead", "buyer", "investor"]).default("lead").describe("Contact type (if creating new)"),
      // Options
      create_reminder: z.boolean().default(true).describe("Create a reminder task for the visit"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const actions_taken: string[] = [];
        let contact: Contact | null = null;
        let property: Property | null = null;

        // Step 1: Resolve property
        const propResult = await resolveProperty(args.property_query, args.agency_id);
        if (!propResult.property) {
          return createErrorResponse(
            getPropertyNotFoundMessage(args.property_query, propResult.suggestions)
          );
        }
        property = propResult.property;
        actions_taken.push(`Found property: ${propResult.property.reference}`);

        // Step 2: Resolve or create contact
        const contactResult = await resolveContact(args.contact_query, args.agency_id);

        if (contactResult.contact) {
          contact = contactResult.contact;
          actions_taken.push(`Found contact: ${contactResult.contact.first_name} ${contactResult.contact.last_name}`);
        } else if (args.contact_first_name && args.contact_last_name) {
          // Create new contact
          const { data: newContact, error: contactError } = await insertRecord<Contact>("contacts", {
            first_name: args.contact_first_name,
            last_name: args.contact_last_name,
            type: args.contact_type,
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
          actions_taken.push(`Created new contact: ${newContact.first_name} ${newContact.last_name}`);
        } else {
          return createErrorResponse(
            getContactNotFoundMessage(args.contact_query, contactResult.suggestions) +
              "\n\nTo create a new contact, also provide: contact_first_name, contact_last_name"
          );
        }

        // Step 3: Parse date and time
        const parsed = parseDateAndTime(args.date, args.time);
        if (parsed.error || !parsed.dateString) {
          return createErrorResponse(parsed.error || `Could not parse date: ${args.date}`);
        }

        const startTime = parsed.timeString || "10:00";
        const endTime = calculateEndTime(startTime, args.duration_minutes);

        // Step 4: Check for conflicts
        const supabase = getSupabaseClient();
        const { data: conflicts } = await supabase
          .from("visits")
          .select("*")
          .eq("agency_id", args.agency_id)
          .eq("date", parsed.dateString)
          .neq("status", "cancelled")
          .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

        if (conflicts && conflicts.length > 0) {
          const conflictTimes = conflicts.map((c: Record<string, unknown>) => `${c.start_time}-${c.end_time}`).join(", ");
          actions_taken.push(`⚠️ Warning: Potential conflicts at ${conflictTimes}`);
        }

        // Step 5: Create visit
        const { data: visit, error: visitError } = await insertRecord<Visit>("visits", {
          property_id: property.id,
          contact_id: contact.id,
          agent_id: args.agency_id, // Would be actual agent ID
          date: parsed.dateString,
          start_time: startTime,
          end_time: endTime,
          status: "scheduled",
          confirmation_status: "pending",
          notes: args.notes || "",
          agency_id: args.agency_id,
        });

        if (visitError || !visit) {
          return createErrorResponse(visitError || "Failed to create visit");
        }

        actions_taken.push(`Scheduled visit for ${formatDisplayDate(visit.date)} at ${visit.start_time}`);

        // Step 6: Create reminder task
        if (args.create_reminder) {
          const reminderDate = new Date(visit.date);
          reminderDate.setDate(reminderDate.getDate() - 1);

          await insertRecord<Task>("tasks", {
            title: `Confirm visit with ${contact.first_name} ${contact.last_name}`,
            description: `Visit at ${property.reference} on ${visit.date} at ${visit.start_time}`,
            due_date: formatDateString(reminderDate),
            priority: "high",
            status: "todo",
            assigned_to: args.agency_id,
            related_to: { type: "visit", id: visit.id },
            agency_id: args.agency_id,
          });
          actions_taken.push("Created reminder task for day before");
        }

        // Format response
        const lines = [
          `# Visit Scheduled!`,
          "",
          `**Date**: ${formatDisplayDate(visit.date)}`,
          `**Time**: ${visit.start_time} - ${visit.end_time}`,
          "",
          `## Property`,
          `**${property.reference}**`,
          `${formatAddressShort(property.address)}`,
          `${formatPrice(property.price)}`,
          "",
          `## Client`,
          `**${contact.first_name} ${contact.last_name}**`,
          contact.phone ? `📞 ${contact.phone}` : "",
          contact.email ? `✉️ ${contact.email}` : "",
          "",
          "## Actions Taken",
        ];

        for (const action of actions_taken) {
          const emoji = action.startsWith("⚠️") ? "" : "✅ ";
          lines.push(`- ${emoji}${action}`);
        }

        lines.push("");
        lines.push(`**Visit ID**: \`${visit.id}\``);
        lines.push("");
        lines.push("💡 **Next**: Confirm with client, then use `re_update_visit_status` to mark as confirmed.");

        return createSuccessResponse(lines.filter(Boolean).join("\n"));
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Quick reschedule
  server.tool(
    "re_quick_reschedule",
    `Quickly reschedule a visit to a new date/time.

Examples:
- "Move the visit to tomorrow at 3pm"
- "Reschedule to next Tuesday"`,
    {
      visit_id: z.string().describe("Visit ID"),
      new_date: z.string().describe("New date"),
      new_time: z.string().optional().describe("New time (keeps original if not specified)"),
      notify: z.boolean().default(true).describe("Create a task to notify the client"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const supabase = getSupabaseClient();

        // Get existing visit
        const { data: existing, error: fetchError } = await supabase
          .from("visits")
          .select("*, properties(*), contacts(*)")
          .eq("id", args.visit_id)
          .eq("agency_id", args.agency_id)
          .single();

        if (fetchError || !existing) {
          return createErrorResponse(`Visit not found: ${args.visit_id}`);
        }

        const parsed = parseDateAndTime(args.new_date, args.new_time);
        if (!parsed.dateString) {
          return createErrorResponse(parsed.error || `Could not parse date: ${args.new_date}`);
        }

        // Calculate new times
        const [oldStartH, oldStartM] = existing.start_time.split(":").map(Number);
        const [oldEndH, oldEndM] = existing.end_time.split(":").map(Number);
        const durationMinutes = (oldEndH * 60 + oldEndM) - (oldStartH * 60 + oldStartM);

        const newStartTime = parsed.timeString || existing.start_time;
        const newEndTime = calculateEndTime(newStartTime, durationMinutes);

        // Update visit
        const { data: updated, error: updateError } = await updateRecord<Visit>(
          "visits",
          args.visit_id,
          args.agency_id,
          {
            date: parsed.dateString,
            start_time: newStartTime,
            end_time: newEndTime,
            confirmation_status: "pending",
          }
        );

        if (updateError || !updated) {
          return createErrorResponse(updateError || "Failed to update visit");
        }

        const property = existing.properties as Property;
        const contact = existing.contacts as Contact;

        // Create notification task
        if (args.notify) {
          await insertRecord<Task>("tasks", {
            title: `Notify ${contact.first_name} of rescheduled visit`,
            description: `Visit rescheduled from ${existing.date} ${existing.start_time} to ${updated.date} ${updated.start_time}`,
            due_date: formatDateString(new Date()),
            priority: "high",
            status: "todo",
            assigned_to: args.agency_id,
            related_to: { type: "visit", id: args.visit_id },
            agency_id: args.agency_id,
          });
        }

        return createSuccessResponse(
          `Visit rescheduled!\n\n` +
            `**Property**: ${property.reference}\n` +
            `**Client**: ${contact.first_name} ${contact.last_name}\n\n` +
            `**Old**: ${existing.date} ${existing.start_time}\n` +
            `**New**: ${updated.date} ${updated.start_time}\n\n` +
            (args.notify ? "📋 Task created to notify client" : "⚠️ Remember to notify the client")
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}
