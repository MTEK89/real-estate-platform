import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { OperationalDocument } from "@/lib/mock-data"
import { requireTenant } from "@/lib/server/require-tenant"
import { writeAuditLog } from "@/lib/server/audit"

export const runtime = "nodejs"

function toOperationalDocument(row: any): OperationalDocument {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    contactId: row.contact_id ? String(row.contact_id) : null,
    contractId: row.contract_id ? String(row.contract_id) : null,
    type: row.type as OperationalDocument["type"],
    subType: (row.sub_type ?? undefined) as OperationalDocument["subType"],
    status: row.status as OperationalDocument["status"],
    scheduledDate: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    data: (row.data ?? {}) as Record<string, unknown>,
    attachments: Array.isArray(row.attachments) ? (row.attachments as string[]) : [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  }
}

const PatchSchema = z.object({
  propertyId: z.string().min(1).optional(),
  contactId: z.string().min(1).nullable().optional(),
  contractId: z.string().min(1).nullable().optional(),
  type: z.enum(["etat_des_lieux", "remise_des_cles", "photo_session", "surface_calculation", "evaluation"]).optional(),
  subType: z.enum(["move_in", "move_out"]).nullable().optional(),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "signed"]).optional(),
  scheduledDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  data: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params
  const patch = PatchSchema.parse(await req.json())

  const { data: before } = await supabase
    .from("operational_documents")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const { data: updated, error } = await supabase
    .from("operational_documents")
    .update({
      property_id: patch.propertyId,
      contact_id: patch.contactId,
      contract_id: patch.contractId,
      type: patch.type,
      sub_type: patch.subType === undefined ? undefined : patch.subType,
      status: patch.status,
      scheduled_at: patch.scheduledDate === undefined ? undefined : patch.scheduledDate ? new Date(patch.scheduledDate).toISOString() : null,
      completed_at: patch.completedAt === undefined ? undefined : patch.completedAt ? new Date(patch.completedAt).toISOString() : null,
      data: patch.data,
      attachments: patch.attachments,
    })
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !updated) return applyCookies(NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "operational_document.update",
    entityType: "operational_document",
    entityId: id,
    before,
    after: updated,
  })

  return applyCookies(NextResponse.json(toOperationalDocument(updated)))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params

  const { data: before } = await supabase
    .from("operational_documents")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const { error } = await supabase.from("operational_documents").delete().eq("agency_id", tenant.agencyId).eq("id", id)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "operational_document.delete",
    entityType: "operational_document",
    entityId: id,
    before,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}
