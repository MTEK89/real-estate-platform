import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Task } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toTask(t: {
  id: string
  title: string
  description: string
  assignedTo: string
  relatedTo: unknown
  priority: string
  status: string
  dueDate: string
  completedAt: Date | null
  createdAt: Date
}): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    assignedTo: t.assignedTo,
    relatedTo: (t.relatedTo ?? null) as Task["relatedTo"],
    priority: t.priority as Task["priority"],
    status: t.status as Task["status"],
    dueDate: t.dueDate,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  const rows = (data ?? []).map((r: any) =>
    toTask({
      id: r.id,
      title: r.title,
      description: r.description,
      assignedTo: r.assigned_to,
      relatedTo: r.related_to,
      priority: r.priority,
      status: r.status,
      dueDate: r.due_date,
      completedAt: r.completed_at ? new Date(r.completed_at) : null,
      createdAt: new Date(r.created_at),
    }),
  )

  return applyCookies(NextResponse.json(rows))
}

const RelatedToSchema = z
  .object({
    type: z.enum(["contact", "property", "deal", "visit", "contract"]),
    id: z.string().min(1),
  })
  .strict()

const CreateTaskSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  assignedTo: z.string().min(1).optional(),
  relatedTo: RelatedToSchema.nullable().optional().default(null),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).default("todo"),
  dueDate: z.string().min(1),
  completedAt: z.string().datetime().nullable().optional().default(null),
  createdAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = CreateTaskSchema.parse(await req.json())

  const id = payload.id ?? crypto.randomUUID()
  const { data: created, error } = await supabase
    .from("tasks")
    .insert({
      id,
      agency_id: tenant.agencyId,
      title: payload.title,
      description: payload.description,
      assigned_to: payload.assignedTo ?? tenant.userId,
      related_to: payload.relatedTo ?? null,
      priority: payload.priority,
      status: payload.status,
      due_date: payload.dueDate,
      completed_at: payload.completedAt ? new Date(payload.completedAt).toISOString() : null,
      created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) {
    return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))
  }

  await writeAuditLog({
    req,
    tenant,
    action: "task.create",
    entityType: "task",
    entityId: id,
    after: created,
  })

  return applyCookies(
    NextResponse.json(
    toTask({
      id: created.id,
      title: created.title,
      description: created.description,
      assignedTo: created.assigned_to,
      relatedTo: created.related_to,
      priority: created.priority,
      status: created.status,
      dueDate: created.due_date,
      completedAt: created.completed_at ? new Date(created.completed_at) : null,
      createdAt: new Date(created.created_at),
    }),
    ),
  )
}
