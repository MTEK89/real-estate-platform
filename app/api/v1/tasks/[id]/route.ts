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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req)
  if ("response" in auth) return auth.response
  const { supabase, tenant, applyCookies } = auth
  const { id } = await ctx.params

  const { data: row, error } = await supabase.from("tasks").select("*").eq("id", id).eq("agency_id", tenant.agencyId).maybeSingle()
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
  if (!row) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  return applyCookies(
    NextResponse.json(
    toTask({
      id: row.id,
      title: row.title,
      description: row.description,
      assignedTo: row.assigned_to,
      relatedTo: row.related_to,
      priority: row.priority,
      status: row.status,
      dueDate: row.due_date,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      createdAt: new Date(row.created_at),
    }),
    ),
  )
}

const RelatedToSchema = z
  .object({
    type: z.enum(["contact", "property", "deal", "visit", "contract"]),
    id: z.string().min(1),
  })
  .strict()

const PatchTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    assignedTo: z.string().min(1).optional(),
    relatedTo: RelatedToSchema.nullable().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
    dueDate: z.string().min(1).optional(),
    completedAt: z.string().datetime().nullable().optional(),
  })
  .strict()

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req)
  if ("response" in auth) return auth.response
  const { supabase, tenant, applyCookies } = auth
  const { id } = await ctx.params

  const payload = PatchTaskSchema.parse(await req.json())

  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .maybeSingle()
  if (existingError) return applyCookies(NextResponse.json({ error: existingError.message }, { status: 500 }))
  if (!existing) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  const patch: Record<string, unknown> = {}
  if (payload.title !== undefined) patch.title = payload.title
  if (payload.description !== undefined) patch.description = payload.description
  if (payload.assignedTo !== undefined) patch.assigned_to = payload.assignedTo
  if (payload.relatedTo !== undefined) patch.related_to = payload.relatedTo
  if (payload.priority !== undefined) patch.priority = payload.priority
  if (payload.status !== undefined) patch.status = payload.status
  if (payload.dueDate !== undefined) patch.due_date = payload.dueDate
  if (payload.completedAt !== undefined) {
    patch.completed_at = payload.completedAt ? new Date(payload.completedAt).toISOString() : null
  }

  const { data: updated, error: updateError } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .select("*")
    .single()

  if (updateError || !updated) {
    return applyCookies(NextResponse.json({ error: updateError?.message || "Update failed" }, { status: 500 }))
  }

  await writeAuditLog({
    req,
    tenant,
    action: "task.update",
    entityType: "task",
    entityId: id,
    before: existing,
    after: updated,
  })

  return applyCookies(
    NextResponse.json(
    toTask({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      assignedTo: updated.assigned_to,
      relatedTo: updated.related_to,
      priority: updated.priority,
      status: updated.status,
      dueDate: updated.due_date,
      completedAt: updated.completed_at ? new Date(updated.completed_at) : null,
      createdAt: new Date(updated.created_at),
    }),
    ),
  )
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req)
  if ("response" in auth) return auth.response
  const { supabase, tenant, applyCookies } = auth
  const { id } = await ctx.params

  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .maybeSingle()
  if (existingError) return applyCookies(NextResponse.json({ error: existingError.message }, { status: 500 }))
  if (!existing) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id).eq("agency_id", tenant.agencyId)
  if (deleteError) return applyCookies(NextResponse.json({ error: deleteError.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "task.delete",
    entityType: "task",
    entityId: id,
    before: existing,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}
