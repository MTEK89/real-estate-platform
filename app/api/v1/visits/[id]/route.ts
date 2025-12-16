import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Visit } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toVisit(row: any): Visit {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    contactId: String(row.contact_id),
    agentId: String(row.agent_id),
    date: String(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    status: row.status as Visit["status"],
    confirmationStatus: row.confirmation_status as Visit["confirmationStatus"],
    notes: row.notes ?? "",
    feedback: row.feedback ?? undefined,
  }
}

const PatchSchema = z.object({
  propertyId: z.string().min(1).optional(),
  contactId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).optional(),
  confirmationStatus: z.enum(["pending", "confirmed", "declined"]).optional(),
  notes: z.string().optional(),
  feedback: z
    .object({
      interestLevel: z.number().int().min(1).max(5),
      comments: z.string(),
    })
    .nullable()
    .optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params
  const patch = PatchSchema.parse(await req.json())

  const { data: before } = await supabase.from("visits").select("*").eq("agency_id", tenant.agencyId).eq("id", id).single()

  const { data: updated, error } = await supabase
    .from("visits")
    .update({
      property_id: patch.propertyId,
      contact_id: patch.contactId,
      agent_id: patch.agentId,
      date: patch.date,
      start_time: patch.startTime,
      end_time: patch.endTime,
      status: patch.status,
      confirmation_status: patch.confirmationStatus,
      notes: patch.notes,
      feedback: patch.feedback === undefined ? undefined : patch.feedback,
    })
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !updated) return applyCookies(NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "visit.update",
    entityType: "visit",
    entityId: id,
    before,
    after: updated,
  })

  return applyCookies(NextResponse.json(toVisit(updated)))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params

  const { data: before } = await supabase.from("visits").select("*").eq("agency_id", tenant.agencyId).eq("id", id).single()

  const { error } = await supabase.from("visits").delete().eq("agency_id", tenant.agencyId).eq("id", id)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "visit.delete",
    entityType: "visit",
    entityId: id,
    before,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}
