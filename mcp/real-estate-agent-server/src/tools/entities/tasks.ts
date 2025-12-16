/**
 * Task management tools
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  TaskPrioritySchema,
  TaskStatusSchema,
  AgencyIdSchema,
} from "../../schemas/common.js";
import {
  getSupabaseClient,
  getById,
  insertRecord,
  updateRecord,
  deleteRecord,
} from "../../services/supabase.js";
import { formatTask, formatTaskList } from "../../services/formatters.js";
import { createErrorResponse, createSuccessResponse } from "../../utils/errors.js";
import { parseDate, formatDateDisplay, isPastDate } from "../../services/date-parser.js";
import type { Task } from "../../types.js";

/**
 * Register all task-related tools
 */
export function registerTaskTools(server: McpServer): void {
  // List tasks
  server.tool(
    "re_list_tasks",
    `List tasks with optional filters.

Examples:
- "Show my urgent tasks" → priority: "urgent"
- "What tasks are due today?" → due_date: "today"
- "Show overdue tasks" → overdue: true
- "Tasks for property APT-001" → related_type: "property", related_id: "[property_id]"`,
    {
      status: TaskStatusSchema.optional().describe("Filter by status"),
      priority: TaskPrioritySchema.optional().describe("Filter by priority"),
      due_date: z.string().optional().describe("Filter by due date (natural language)"),
      due_before: z.string().optional().describe("Tasks due before this date"),
      due_after: z.string().optional().describe("Tasks due after this date"),
      overdue: z.boolean().optional().describe("Show only overdue tasks"),
      related_type: z.enum(["contact", "property", "deal", "visit", "contract"]).optional().describe("Filter by related entity type"),
      related_id: z.string().optional().describe("Filter by related entity ID"),
      limit: z.number().min(1).max(100).default(20).describe("Max results"),
      offset: z.number().min(0).default(0).describe("Offset for pagination"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const supabase = getSupabaseClient();

        let query = supabase
          .from("tasks")
          .select("*", { count: "exact" })
          .eq("agency_id", args.agency_id)
          .order("due_date", { ascending: true })
          .order("priority", { ascending: false });

        if (args.status) query = query.eq("status", args.status);
        if (args.priority) query = query.eq("priority", args.priority);

        // Date filtering
        if (args.due_date) {
          const parsed = parseDate(args.due_date);
          if (parsed) {
            query = query.eq("due_date", parsed);
          }
        } else {
          if (args.due_before) {
            const parsed = parseDate(args.due_before);
            if (parsed) {
              query = query.lte("due_date", parsed);
            }
          }
          if (args.due_after) {
            const parsed = parseDate(args.due_after);
            if (parsed) {
              query = query.gte("due_date", parsed);
            }
          }
        }

        // Overdue filter
        if (args.overdue) {
          const today = new Date().toISOString().split("T")[0];
          query = query.lt("due_date", today).neq("status", "completed");
        }

        // Related entity filter
        if (args.related_type) {
          query = query.eq("related_to->>type", args.related_type);
        }
        if (args.related_id) {
          query = query.eq("related_to->>id", args.related_id);
        }

        query = query.range(args.offset, args.offset + args.limit - 1);

        const { data, error, count } = await query;

        if (error) {
          return createErrorResponse(error.message);
        }

        const tasks = data as Task[];

        return createSuccessResponse(
          formatTaskList(tasks, {
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

  // Get task details
  server.tool(
    "re_get_task",
    `Get details of a specific task.`,
    {
      id: z.string().describe("Task ID"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const { data, error } = await getById<Task>("tasks", args.id, args.agency_id);

        if (error || !data) {
          return createErrorResponse(error || `Task not found: ${args.id}`);
        }

        return createSuccessResponse(formatTask(data, { detailed: true }));
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Create task
  server.tool(
    "re_create_task",
    `Create a new task.

Examples:
- "Remind me to call John tomorrow" → title: "Call John", due_date: "tomorrow"
- "Urgent: Send contract to Marie by Friday" → title: "Send contract to Marie", due_date: "Friday", priority: "urgent"
- "Follow up with property owner next week" → title: "Follow up with property owner", due_date: "next week"`,
    {
      title: z.string().min(1).describe("Task title"),
      description: z.string().optional().describe("Task description"),
      due_date: z.string().describe("Due date (natural language or YYYY-MM-DD)"),
      priority: TaskPrioritySchema.default("medium").describe("Priority: low, medium, high, urgent"),
      related_type: z.enum(["contact", "property", "deal", "visit", "contract"]).optional().describe("Related entity type"),
      related_id: z.string().optional().describe("Related entity ID"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const dateStr = parseDate(args.due_date);
        if (!dateStr) {
          return createErrorResponse(`Could not parse date: ${args.due_date}`);
        }

        const taskData: Record<string, unknown> = {
          title: args.title,
          description: args.description || "",
          due_date: dateStr,
          priority: args.priority,
          status: "todo",
          assigned_to: args.agency_id, // Would be actual user ID
          agency_id: args.agency_id,
        };

        if (args.related_type && args.related_id) {
          taskData.related_to = {
            type: args.related_type,
            id: args.related_id,
          };
        }

        const { data, error } = await insertRecord<Task>("tasks", taskData);

        if (error) {
          return createErrorResponse(error);
        }

        if (!data) {
          return createErrorResponse("Failed to create task");
        }

        const priorityEmoji = getPriorityEmoji(data.priority);

        return createSuccessResponse(
          `# Task Created!\n\n` +
            `${priorityEmoji} **${data.title}**\n` +
            `**Due**: ${formatDateDisplay(data.due_date)}\n` +
            `**Priority**: ${data.priority}\n` +
            (data.description ? `**Description**: ${data.description}\n` : "") +
            `\n**ID**: \`${data.id}\``
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Update task
  server.tool(
    "re_update_task",
    `Update an existing task.`,
    {
      id: z.string().describe("Task ID"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      due_date: z.string().optional().describe("New due date"),
      priority: TaskPrioritySchema.optional().describe("New priority"),
      status: TaskStatusSchema.optional().describe("New status"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const { data: existing, error: fetchError } = await getById<Task>("tasks", args.id, args.agency_id);

        if (fetchError || !existing) {
          return createErrorResponse(fetchError || `Task not found: ${args.id}`);
        }

        const updateData: Record<string, unknown> = {};

        if (args.title) updateData.title = args.title;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.priority) updateData.priority = args.priority;
        if (args.status) updateData.status = args.status;

        if (args.due_date) {
          const parsed = parseDate(args.due_date);
          if (!parsed) {
            return createErrorResponse(`Could not parse date: ${args.due_date}`);
          }
          updateData.due_date = parsed;
        }

        const { data, error } = await updateRecord<Task>("tasks", args.id, args.agency_id, updateData);

        if (error) {
          return createErrorResponse(error);
        }

        if (!data) {
          return createErrorResponse(`Failed to update task`);
        }

        return createSuccessResponse(
          `# Task Updated!\n\n` + formatTask(data, { detailed: true })
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Complete task
  server.tool(
    "re_complete_task",
    `Mark a task as completed.

Examples:
- "Done with the call to John"
- "Complete task [id]"`,
    {
      id: z.string().describe("Task ID"),
      notes: z.string().optional().describe("Completion notes"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const { data: existing, error: fetchError } = await getById<Task>("tasks", args.id, args.agency_id);

        if (fetchError || !existing) {
          return createErrorResponse(fetchError || `Task not found: ${args.id}`);
        }

        const description = args.notes
          ? `${existing.description || ""}\n[Completed] ${args.notes}`.trim()
          : existing.description;

        const { data, error } = await updateRecord<Task>("tasks", args.id, args.agency_id, {
          status: "completed",
          description,
          completed_at: new Date().toISOString(),
        });

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(
          `# Task Completed! ✅\n\n**${existing.title}**\n` +
            (args.notes ? `**Notes**: ${args.notes}` : "")
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Delete task
  server.tool(
    "re_delete_task",
    `Delete a task.`,
    {
      id: z.string().describe("Task ID"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const { data: existing, error: fetchError } = await getById<Task>("tasks", args.id, args.agency_id);

        if (fetchError || !existing) {
          return createErrorResponse(fetchError || `Task not found: ${args.id}`);
        }

        const { success, error } = await deleteRecord("tasks", args.id, args.agency_id);

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(`Task deleted: **${existing.title}**`);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  // Batch update task statuses
  server.tool(
    "re_batch_update_tasks",
    `Update multiple tasks at once.

Examples:
- "Mark all urgent tasks as in progress"
- "Complete all overdue follow-up tasks"`,
    {
      task_ids: z.array(z.string()).min(1).describe("Task IDs to update"),
      status: TaskStatusSchema.optional().describe("New status for all tasks"),
      priority: TaskPrioritySchema.optional().describe("New priority for all tasks"),
      agency_id: AgencyIdSchema,
    },
    async (args) => {
      try {
        const updateData: Record<string, unknown> = {};
        if (args.status) updateData.status = args.status;
        if (args.priority) updateData.priority = args.priority;

        if (Object.keys(updateData).length === 0) {
          return createErrorResponse("No updates specified. Provide status or priority.");
        }

        const supabase = getSupabaseClient();

        const { data, error } = await supabase
          .from("tasks")
          .update(updateData)
          .in("id", args.task_ids)
          .eq("agency_id", args.agency_id)
          .select();

        if (error) {
          return createErrorResponse(error.message);
        }

        const updated = data as Task[];

        return createSuccessResponse(
          `# Updated ${updated.length} Task(s)!\n\n` +
            `**Changes**: ${[
              args.status && `status → ${args.status}`,
              args.priority && `priority → ${args.priority}`,
            ]
              .filter(Boolean)
              .join(", ")}`
        );
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}

function getPriorityEmoji(priority: string): string {
  const emojis: Record<string, string> = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    urgent: "🔴",
  };
  return emojis[priority] || "⚪";
}
