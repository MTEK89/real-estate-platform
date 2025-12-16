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

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("operational_documents")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  return applyCookies(NextResponse.json((data ?? []).map(toOperationalDocument)))
}

const CreateSchema = z.object({
  id: z.string().min(1).optional(),
  propertyId: z.string().min(1),
  contactId: z.string().min(1).nullable().optional().default(null),
  contractId: z.string().min(1).nullable().optional().default(null),
  type: z.enum(["etat_des_lieux", "remise_des_cles", "photo_session", "surface_calculation", "evaluation"]),
  subType: z.enum(["move_in", "move_out"]).optional(),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "signed"]).default("draft"),
  scheduledDate: z.string().datetime().nullable().optional().default(null),
  completedAt: z.string().datetime().nullable().optional().default(null),
  data: z.record(z.any()).default({}),
  attachments: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = CreateSchema.parse(await req.json())
  const id = payload.id ?? crypto.randomUUID()

  const { data: created, error } = await supabase
    .from("operational_documents")
    .insert({
      id,
      agency_id: tenant.agencyId,
      property_id: payload.propertyId,
      contact_id: payload.contactId ?? null,
      contract_id: payload.contractId ?? null,
      type: payload.type,
      sub_type: payload.subType ?? null,
      status: payload.status,
      scheduled_at: payload.scheduledDate ? new Date(payload.scheduledDate).toISOString() : null,
      completed_at: payload.completedAt ? new Date(payload.completedAt).toISOString() : null,
      data: payload.data,
      attachments: payload.attachments,
      created_by: tenant.userId,
      created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "operational_document.create",
    entityType: "operational_document",
    entityId: id,
    after: created,
  })

  return applyCookies(NextResponse.json(toOperationalDocument(created)))
}
