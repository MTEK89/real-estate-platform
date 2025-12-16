import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Contact } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toContact(c: {
  id: string
  type: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  source: string
  status: string
  assignedTo: string | null
  tags: unknown
  notes: string
  lastContactAt: Date | null
  createdAt: Date
}): Contact {
  return {
    id: c.id,
    type: c.type as Contact["type"],
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    source: c.source,
    status: c.status as Contact["status"],
    assignedTo: c.assignedTo,
    tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
    notes: c.notes ?? "",
    lastContactAt: c.lastContactAt ? c.lastContactAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req)
  if ("response" in auth) return auth.response
  const { supabase, tenant, applyCookies } = auth
  const { id } = await ctx.params

  const { data: row, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .maybeSingle()

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
  if (!row) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  return applyCookies(
    NextResponse.json(
    toContact({
      id: row.id,
      type: row.type,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      source: row.source,
      status: row.status,
      assignedTo: row.assigned_to,
      tags: row.tags,
      notes: row.notes,
      lastContactAt: row.last_contact_at ? new Date(row.last_contact_at) : null,
      createdAt: new Date(row.created_at),
    }),
    ),
  )
}

const PatchContactSchema = z
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
    lastContactAt: z.string().datetime().nullable().optional(),
  })
  .strict()

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req)
  if ("response" in auth) return auth.response
  const { supabase, tenant, applyCookies } = auth
  const { id } = await ctx.params

  const payload = PatchContactSchema.parse(await req.json())

  const { data: existing, error: existingError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .maybeSingle()
  if (existingError) return applyCookies(NextResponse.json({ error: existingError.message }, { status: 500 }))
  if (!existing) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  const patch: Record<string, unknown> = {}
  if (payload.type !== undefined) patch.type = payload.type
  if (payload.firstName !== undefined) patch.first_name = payload.firstName
  if (payload.lastName !== undefined) patch.last_name = payload.lastName
  if (payload.email !== undefined) patch.email = payload.email
  if (payload.phone !== undefined) patch.phone = payload.phone
  if (payload.source !== undefined) patch.source = payload.source
  if (payload.status !== undefined) patch.status = payload.status
  if (payload.assignedTo !== undefined) patch.assigned_to = payload.assignedTo
  if (payload.tags !== undefined) patch.tags = payload.tags
  if (payload.notes !== undefined) patch.notes = payload.notes
  if (payload.lastContactAt !== undefined) {
    patch.last_contact_at = payload.lastContactAt ? new Date(payload.lastContactAt).toISOString() : null
  }

  const { data: updated, error: updateError } = await supabase
    .from("contacts")
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
    action: "contact.update",
    entityType: "contact",
    entityId: id,
    before: existing,
    after: updated,
  })

  return applyCookies(
    NextResponse.json(
    toContact({
      id: updated.id,
      type: updated.type,
      firstName: updated.first_name,
      lastName: updated.last_name,
      email: updated.email,
      phone: updated.phone,
      source: updated.source,
      status: updated.status,
      assignedTo: updated.assigned_to,
      tags: updated.tags,
      notes: updated.notes,
      lastContactAt: updated.last_contact_at ? new Date(updated.last_contact_at) : null,
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
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .maybeSingle()
  if (existingError) return applyCookies(NextResponse.json({ error: existingError.message }, { status: 500 }))
  if (!existing) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  const { error: deleteError } = await supabase.from("contacts").delete().eq("id", id).eq("agency_id", tenant.agencyId)
  if (deleteError) return applyCookies(NextResponse.json({ error: deleteError.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "contact.delete",
    entityType: "contact",
    entityId: id,
    before: existing,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}
