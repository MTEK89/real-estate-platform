import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

dotenv.config({ path: ".env.local" });

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL and a key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY).");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const mcp = new McpServer({ name: "real-estate-supabase-admin", version: "0.1.0" });
const isAdmin = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

const REQUIRED_TABLES = ["agencies", "users", "agency_users", "contacts", "properties", "tasks", "audit_logs"];

async function readSchemaSql() {
  const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
  return await fs.readFile(schemaPath, "utf8");
}

function isMissingTableError(message) {
  return typeof message === "string" && message.includes("Could not find the table");
}

const AgencySchema = z.object({
  agencyId: z.string().min(1).default("a1"),
});

const ListSchema = AgencySchema.extend({
  limit: z.number().int().min(1).max(500).default(100),
});

const ContactCreateSchema = AgencySchema.extend({
  type: z.enum(["lead", "buyer", "seller", "investor"]).default("lead"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable().optional().default(null),
  phone: z.string().nullable().optional().default(null),
  source: z.string().min(1).optional().default("Manual"),
  status: z.enum(["new", "contacted", "qualified", "nurturing", "closed"]).default("new"),
  assignedTo: z.string().nullable().optional().default(null),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

const ContactPatchSchema = AgencySchema.extend({
  id: z.string().min(1),
  patch: z
    .object({
      type: z.enum(["lead", "buyer", "seller", "investor"]).optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      source: z.string().min(1).optional(),
      status: z.enum(["new", "contacted", "qualified", "nurturing", "closed"]).optional(),
      assignedTo: z.string().nullable().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .strict(),
});

const PropertyCreateSchema = AgencySchema.extend({
  reference: z.string().min(1),
  status: z.enum(["draft", "published", "under_offer", "sold", "rented", "archived"]).default("draft"),
  type: z.enum(["house", "apartment", "office", "retail", "land"]).default("apartment"),
  address: z.record(z.unknown()).default({}),
  characteristics: z.record(z.unknown()).default({}),
  price: z.number().nonnegative().default(0),
  ownerId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

const PropertyPatchSchema = AgencySchema.extend({
  id: z.string().min(1),
  patch: z
    .object({
      reference: z.string().min(1).optional(),
      status: z.enum(["draft", "published", "under_offer", "sold", "rented", "archived"]).optional(),
      type: z.enum(["house", "apartment", "office", "retail", "land"]).optional(),
      address: z.record(z.unknown()).optional(),
      characteristics: z.record(z.unknown()).optional(),
      price: z.number().nonnegative().optional(),
      ownerId: z.string().optional(),
      tags: z.array(z.string()).optional(),
      images: z.array(z.string()).optional(),
    })
    .strict(),
});

const TaskCreateSchema = AgencySchema.extend({
  title: z.string().min(1),
  description: z.string().default(""),
  assignedTo: z.string().min(1).default("u1"),
  relatedTo: z.record(z.unknown()).nullable().optional().default(null),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).default("todo"),
  dueDate: z.string().min(1),
});

const TaskPatchSchema = AgencySchema.extend({
  id: z.string().min(1),
  patch: z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      assignedTo: z.string().min(1).optional(),
      relatedTo: z.record(z.unknown()).nullable().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
      dueDate: z.string().min(1).optional(),
    })
    .strict(),
});

mcp.registerTool(
  "setup.check",
  {
    description: "Check whether required Supabase tables exist for this platform.",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const supabase = getSupabaseClient();
    const missing = [];

    for (const table of REQUIRED_TABLES) {
      // eslint-disable-next-line no-await-in-loop
      const { error } = await supabase.from(table).select("*").limit(1);
      if (error && isMissingTableError(error.message)) {
        missing.push(table);
      }
    }

    if (missing.length === 0) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, missing: [] }, null, 2) }] };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: false,
              missing,
              fix: "Run supabase/schema.sql in Supabase SQL Editor, then re-run setup.check.",
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  },
);

mcp.registerTool(
  "setup.schema_sql",
  {
    description: "Return the SQL schema you should run in Supabase (supabase/schema.sql).",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const sql = await readSchemaSql();
    return { content: [{ type: "text", text: sql }] };
  },
);

mcp.registerTool(
  "contacts.list",
  { description: "List contacts for an agency (Supabase admin).", inputSchema: ListSchema.shape },
  async ({ agencyId, limit }) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error.message)) {
        return {
          content: [
            {
              type: "text",
              text: `Missing tables. Run supabase/schema.sql in Supabase SQL Editor.\n\nThen re-run contacts.list.\n\nTip: call setup.check / setup.schema_sql from MCP.`,
            },
          ],
          isError: true,
        };
      }
      throw new Error(error.message);
    }
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  },
);

if (isAdmin) {
  mcp.registerTool(
    "contacts.create",
    { description: "Create a contact (Supabase admin).", inputSchema: ContactCreateSchema.shape },
    async (args) => {
      const supabase = getSupabaseClient();
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          id,
          agency_id: args.agencyId,
          type: args.type,
          first_name: args.firstName,
          last_name: args.lastName,
          email: args.email ?? null,
          phone: args.phone ?? null,
          source: args.source,
          status: args.status,
          assigned_to: args.assignedTo ?? null,
          tags: args.tags,
          notes: args.notes,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  mcp.registerTool(
    "contacts.update",
    { description: "Update a contact by id (Supabase admin).", inputSchema: ContactPatchSchema.shape },
    async ({ agencyId, id, patch }) => {
      const supabase = getSupabaseClient();
      const dbPatch = {};
      if (patch.type !== undefined) dbPatch.type = patch.type;
      if (patch.firstName !== undefined) dbPatch.first_name = patch.firstName;
      if (patch.lastName !== undefined) dbPatch.last_name = patch.lastName;
      if (patch.email !== undefined) dbPatch.email = patch.email;
      if (patch.phone !== undefined) dbPatch.phone = patch.phone;
      if (patch.source !== undefined) dbPatch.source = patch.source;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.assignedTo !== undefined) dbPatch.assigned_to = patch.assignedTo;
      if (patch.tags !== undefined) dbPatch.tags = patch.tags;
      if (patch.notes !== undefined) dbPatch.notes = patch.notes;

      const { data, error } = await supabase
        .from("contacts")
        .update(dbPatch)
        .eq("id", id)
        .eq("agency_id", agencyId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  mcp.registerTool(
    "contacts.delete",
    {
      description: "Delete a contact by id (Supabase admin).",
      inputSchema: AgencySchema.extend({ id: z.string().min(1) }).shape,
    },
    async ({ agencyId, id }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("contacts").delete().eq("id", id).eq("agency_id", agencyId);
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify({ ok: true }, null, 2) }] };
    },
  );
}

mcp.registerTool(
  "properties.list",
  { description: "List properties for an agency (Supabase admin).", inputSchema: ListSchema.shape },
  async ({ agencyId, limit }) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error.message)) {
        return {
          content: [
            {
              type: "text",
              text: `Missing tables. Run supabase/schema.sql in Supabase SQL Editor.\n\nTip: call setup.check / setup.schema_sql from MCP.`,
            },
          ],
          isError: true,
        };
      }
      throw new Error(error.message);
    }
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  },
);

if (isAdmin) {
  mcp.registerTool(
    "properties.create",
    { description: "Create a property (Supabase admin).", inputSchema: PropertyCreateSchema.shape },
    async (args) => {
      const supabase = getSupabaseClient();
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from("properties")
        .insert({
          id,
          agency_id: args.agencyId,
          reference: args.reference,
          status: args.status,
          type: args.type,
          address: args.address,
          characteristics: args.characteristics,
          price: args.price,
          owner_id: args.ownerId,
          tags: args.tags,
          images: args.images,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  mcp.registerTool(
    "properties.update",
    { description: "Update a property by id (Supabase admin).", inputSchema: PropertyPatchSchema.shape },
    async ({ agencyId, id, patch }) => {
      const supabase = getSupabaseClient();
      const dbPatch = {};
      if (patch.reference !== undefined) dbPatch.reference = patch.reference;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.type !== undefined) dbPatch.type = patch.type;
      if (patch.address !== undefined) dbPatch.address = patch.address;
      if (patch.characteristics !== undefined) dbPatch.characteristics = patch.characteristics;
      if (patch.price !== undefined) dbPatch.price = patch.price;
      if (patch.ownerId !== undefined) dbPatch.owner_id = patch.ownerId;
      if (patch.tags !== undefined) dbPatch.tags = patch.tags;
      if (patch.images !== undefined) dbPatch.images = patch.images;

      const { data, error } = await supabase
        .from("properties")
        .update(dbPatch)
        .eq("id", id)
        .eq("agency_id", agencyId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  mcp.registerTool(
    "properties.delete",
    {
      description: "Delete a property by id (Supabase admin).",
      inputSchema: AgencySchema.extend({ id: z.string().min(1) }).shape,
    },
    async ({ agencyId, id }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("properties").delete().eq("id", id).eq("agency_id", agencyId);
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify({ ok: true }, null, 2) }] };
    },
  );
}

mcp.registerTool(
  "tasks.list",
  { description: "List tasks for an agency (Supabase admin).", inputSchema: ListSchema.shape },
  async ({ agencyId, limit }) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error.message)) {
        return {
          content: [
            {
              type: "text",
              text: `Missing tables. Run supabase/schema.sql in Supabase SQL Editor.\n\nTip: call setup.check / setup.schema_sql from MCP.`,
            },
          ],
          isError: true,
        };
      }
      throw new Error(error.message);
    }
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  },
);

if (isAdmin) {
  mcp.registerTool(
    "tasks.create",
    { description: "Create a task (Supabase admin).", inputSchema: TaskCreateSchema.shape },
    async (args) => {
      const supabase = getSupabaseClient();
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          id,
          agency_id: args.agencyId,
          title: args.title,
          description: args.description,
          assigned_to: args.assignedTo,
          related_to: args.relatedTo ?? null,
          priority: args.priority,
          status: args.status,
          due_date: args.dueDate,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  mcp.registerTool(
    "tasks.update",
    { description: "Update a task by id (Supabase admin).", inputSchema: TaskPatchSchema.shape },
    async ({ agencyId, id, patch }) => {
      const supabase = getSupabaseClient();
      const dbPatch = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.assignedTo !== undefined) dbPatch.assigned_to = patch.assignedTo;
      if (patch.relatedTo !== undefined) dbPatch.related_to = patch.relatedTo;
      if (patch.priority !== undefined) dbPatch.priority = patch.priority;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate;

      const { data, error } = await supabase
        .from("tasks")
        .update(dbPatch)
        .eq("id", id)
        .eq("agency_id", agencyId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  mcp.registerTool(
    "tasks.delete",
    {
      description: "Delete a task by id (Supabase admin).",
      inputSchema: AgencySchema.extend({ id: z.string().min(1) }).shape,
    },
    async ({ agencyId, id }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("tasks").delete().eq("id", id).eq("agency_id", agencyId);
      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify({ ok: true }, null, 2) }] };
    },
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await mcp.connect(transport);
  console.error(
    `MCP server running: real-estate-supabase-admin (mode=${isAdmin ? "admin" : "anon-readonly"})`,
  );
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
