import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Contract } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toContract(row: any): Contract {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    contactId: row.contact_id ? String(row.contact_id) : null,
    dealId: row.deal_id ? String(row.deal_id) : null,
    type: row.type as Contract["type"],
    propertyCategory: row.property_category as Contract["propertyCategory"],
    status: row.status as Contract["status"],
    signatureMethod: (row.signature_method ?? null) as Contract["signatureMethod"],
    autoFilled: Boolean(row.auto_filled),
    signedAt: row.signed_at ? new Date(row.signed_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    data: (row.data ?? {}) as Record<string, unknown>,
    fileUrl: row.file_path ?? null,
    generatedAt: row.generated_at ? new Date(row.generated_at).toISOString() : null,
  }
}

const PatchSchema = z.object({
  propertyId: z.string().min(1).optional(),
  contactId: z.string().min(1).nullable().optional(),
  dealId: z.string().min(1).nullable().optional(),
  type: z.enum(["mandate", "sale_existing", "sale_vefa", "rental", "offer", "reservation"]).optional(),
  propertyCategory: z.enum(["house", "apartment", "office", "professional", "retail"]).optional(),
  status: z.enum(["draft", "pending_signature", "signed", "declined", "expired"]).optional(),
  signatureMethod: z.enum(["electronic", "scanned", "manual"]).nullable().optional(),
  autoFilled: z.boolean().optional(),
  signedAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  data: z.record(z.any()).optional(),
  fileUrl: z.string().nullable().optional(),
  generatedAt: z.string().datetime().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params
  const patch = PatchSchema.parse(await req.json())

  const { data: before } = await supabase
    .from("contracts")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const { data: updated, error } = await supabase
    .from("contracts")
    .update({
      property_id: patch.propertyId,
      contact_id: patch.contactId,
      deal_id: patch.dealId,
      type: patch.type,
      property_category: patch.propertyCategory,
      status: patch.status,
      signature_method: patch.signatureMethod,
      auto_filled: patch.autoFilled,
      signed_at: patch.signedAt === undefined ? undefined : patch.signedAt ? new Date(patch.signedAt).toISOString() : null,
      expires_at: patch.expiresAt === undefined ? undefined : patch.expiresAt ? new Date(patch.expiresAt).toISOString() : null,
      data: patch.data,
      file_path: patch.fileUrl === undefined ? undefined : patch.fileUrl,
      generated_at:
        patch.generatedAt === undefined ? undefined : patch.generatedAt ? new Date(patch.generatedAt).toISOString() : null,
    })
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !updated) return applyCookies(NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "contract.update",
    entityType: "contract",
    entityId: id,
    before,
    after: updated,
  })

  return applyCookies(NextResponse.json(toContract(updated)))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params

  const { data: before } = await supabase
    .from("contracts")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const { error } = await supabase.from("contracts").delete().eq("agency_id", tenant.agencyId).eq("id", id)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "contract.delete",
    entityType: "contract",
    entityId: id,
    before,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}
