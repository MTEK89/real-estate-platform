/**
 * Dashboard workflow tool - Agent's daily overview
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResponseFormatSchema, AgencyIdSchema } from "../../schemas/common.js";
import { getSupabaseClient } from "../../services/supabase.js";
import { formatDashboard, formatPrice, formatAddressShort } from "../../services/formatters.js";
import { createErrorResponse, createSuccessResponse } from "../../utils/errors.js";
import { formatDateString, isToday, isPast } from "../../services/date-parser.js";
import type { DashboardData, ResponseFormat, Visit, Task, Contact, Property } from "../../types.js";

/**
 * Register dashboard workflow tool
 */
export function registerDashboardTools(server: McpServer): void {
  server.tool(
    "re_dashboard",
    `Get the agent's daily dashboard with today's schedule, urgent tasks, and pipeline summary.

This is the perfect tool to start the day or get a quick overview.

Examples:
- "What's on my schedule today?"
- "Show me my dashboard"
- "What do I need to focus on?"`,
    {
      date: z.string().optional().describe("Date to show dashboard for (defaults to today)"),
      format: ResponseFormatSchema,
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const supabase = getSupabaseClient();
        const targetDate = args.date || formatDateString(new Date());
        const today = formatDateString(new Date());

        // Parallel queries for dashboard data
        const [visitsResult, tasksResult, pipelineResult, recentContactsResult] = await Promise.all([
          // Today's visits with property and contact info
          supabase
            .from("visits")
            .select("*, properties(*), contacts(*)")
            .eq("agency_id", args.agency_id)
            .eq("date", targetDate)
            .order("start_time", { ascending: true }),

          // All non-completed tasks for filtering
          supabase
            .from("tasks")
            .select("*")
            .eq("agency_id", args.agency_id)
            .neq("status", "completed")
            .order("due_date", { ascending: true })
            .order("priority", { ascending: false }),

          // Pipeline summary - contacts by status
          supabase
            .from("contacts")
            .select("status")
            .eq("agency_id", args.agency_id),

          // Recent contacts (last 5)
          supabase
            .from("contacts")
            .select("*")
            .eq("agency_id", args.agency_id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (visitsResult.error) throw visitsResult.error;
        if (tasksResult.error) throw tasksResult.error;
        if (pipelineResult.error) throw pipelineResult.error;
        if (recentContactsResult.error) throw recentContactsResult.error;

        // Format visits
        const visits = (visitsResult.data || []).map((row: any) => {
          const property = row.properties as Property | undefined;
          const contact = row.contacts as Contact | undefined;
          return {
            id: row.id,
            time: row.start_time,
            property_reference: property?.reference || row.property_id,
            property_address: property ? formatAddressShort(property.address) : "",
            contact_name: contact ? `${contact.first_name} ${contact.last_name}` : row.contact_id,
            status: row.status,
            confirmation_status: row.confirmation_status,
          };
        });

        // Filter tasks
        const allTasks = (tasksResult.data || []) as Task[];
        const overdueTasks = allTasks.filter(
          (t) => isPast(t.due_date) && !isToday(new Date(t.due_date))
        );
        const urgentTasks = allTasks.filter(
          (t) =>
            (t.priority === "urgent" || t.priority === "high") &&
            !overdueTasks.includes(t)
        );

        // Calculate pipeline
        const pipeline = (pipelineResult.data || []) as { status: string }[];
        const pipelineSummary = {
          new_leads: pipeline.filter((c) => c.status === "new").length,
          contacted: pipeline.filter((c) => c.status === "contacted").length,
          qualified: pipeline.filter((c) => c.status === "qualified").length,
          nurturing: pipeline.filter((c) => c.status === "nurturing").length,
          closed: pipeline.filter((c) => c.status === "closed").length,
        };

        const dashboardData: DashboardData = {
          date: targetDate,
          visits,
          urgent_tasks: urgentTasks.slice(0, 5).map((t) => ({
            id: t.id,
            title: t.title,
            due_date: t.due_date,
            priority: t.priority,
            is_overdue: false,
          })),
          overdue_tasks: overdueTasks.slice(0, 5).map((t) => ({
            id: t.id,
            title: t.title,
            due_date: t.due_date,
            priority: t.priority,
            is_overdue: true,
          })),
          pipeline_summary: pipelineSummary,
          recent_contacts: (recentContactsResult.data || []) as Contact[],
        };

        const format = args.format as ResponseFormat;

        if (format === "json") {
          return createSuccessResponse(JSON.stringify(dashboardData, null, 2));
        }

        return createSuccessResponse(formatDashboard(dashboardData));
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Quick stats tool
  server.tool(
    "re_quick_stats",
    `Get quick statistics about your real estate business.

Examples:
- "How many properties do I have listed?"
- "What's my pipeline looking like?"
- "Give me the numbers"`,
    {
      format: ResponseFormatSchema,
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const supabase = getSupabaseClient();
        const [propertiesResult, contactsResult, visitsResult, tasksResult, contractsResult] =
          await Promise.all([
            // Properties by status
            supabase
              .from("properties")
              .select("status")
              .eq("agency_id", args.agency_id),

            // Contacts by type
            supabase
              .from("contacts")
              .select("type, status")
              .eq("agency_id", args.agency_id),

            // This month's visits
            supabase
              .from("visits")
              .select("status")
              .eq("agency_id", args.agency_id)
              .gte("date", getMonthStart()),

            // Open tasks
            supabase
              .from("tasks")
              .select("status, priority")
              .eq("agency_id", args.agency_id)
              .neq("status", "completed"),

            // Active contracts
            supabase
              .from("contracts")
              .select("type, status")
              .eq("agency_id", args.agency_id)
              .in("status", ["active", "signed", "pending"]),
          ]);

        const properties = propertiesResult.data || [];
        const contacts = contactsResult.data || [];
        const visits = visitsResult.data || [];
        const tasks = tasksResult.data || [];
        const contracts = contractsResult.data || [];

        const stats = {
          properties: {
            total: properties.length,
            published: properties.filter((p: any) => p.status === "published").length,
            under_offer: properties.filter((p: any) => p.status === "under_offer").length,
            sold: properties.filter((p: any) => p.status === "sold").length,
          },
          contacts: {
            total: contacts.length,
            leads: contacts.filter((c: any) => c.type === "lead").length,
            buyers: contacts.filter((c: any) => c.type === "buyer").length,
            sellers: contacts.filter((c: any) => c.type === "seller").length,
            qualified: contacts.filter((c: any) => c.status === "qualified").length,
          },
          visits_this_month: {
            total: visits.length,
            completed: visits.filter((v: any) => v.status === "completed").length,
            scheduled: visits.filter((v: any) => v.status === "scheduled").length,
          },
          tasks: {
            total: tasks.length,
            urgent: tasks.filter((t: any) => t.priority === "urgent").length,
            high: tasks.filter((t: any) => t.priority === "high").length,
          },
          active_contracts: {
            total: contracts.length,
            mandates: contracts.filter((c: any) => c.type === "mandate").length,
            sales: contracts.filter((c: any) => c.type === "sale").length,
          },
        };

        const format = args.format as ResponseFormat;

        if (format === "json") {
          return createSuccessResponse(JSON.stringify(stats, null, 2));
        }

        const lines = [
          "# Quick Stats",
          "",
          "## Properties",
          `- 📋 Total: ${stats.properties.total}`,
          `- 🟢 Published: ${stats.properties.published}`,
          `- 🟡 Under Offer: ${stats.properties.under_offer}`,
          `- ✅ Sold: ${stats.properties.sold}`,
          "",
          "## Contacts",
          `- 👥 Total: ${stats.contacts.total}`,
          `- 🔵 Leads: ${stats.contacts.leads}`,
          `- 🟢 Buyers: ${stats.contacts.buyers}`,
          `- 🟡 Sellers: ${stats.contacts.sellers}`,
          `- ✅ Qualified: ${stats.contacts.qualified}`,
          "",
          "## This Month",
          `- 🗓️ Total Visits: ${stats.visits_this_month.total}`,
          `- 📅 Scheduled: ${stats.visits_this_month.scheduled}`,
          `- ✅ Completed: ${stats.visits_this_month.completed}`,
          "",
          "## Tasks",
          `- 📋 Open Tasks: ${stats.tasks.total}`,
          `- 🔴 Urgent: ${stats.tasks.urgent}`,
          `- 🟠 High Priority: ${stats.tasks.high}`,
          "",
          "## Active Contracts",
          `- 📄 Total: ${stats.active_contracts.total}`,
          `- 📋 Mandates: ${stats.active_contracts.mandates}`,
          `- 🏷️ Sales: ${stats.active_contracts.sales}`,
        ];

        return createSuccessResponse(lines.join("\n"));
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}

function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
