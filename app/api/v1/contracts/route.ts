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

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  return applyCookies(NextResponse.json((data ?? []).map(toContract)))
}

const ContractSchema = z.object({
  id: z.string().min(1).optional(),
  propertyId: z.string().min(1),
  contactId: z.string().min(1).nullable().optional().default(null),
  dealId: z.string().min(1).nullable().optional().default(null),
  type: z.enum(["mandate", "sale_existing", "sale_vefa", "rental", "offer", "reservation"]),
  propertyCategory: z.enum(["house", "apartment", "office", "professional", "retail"]),
  status: z.enum(["draft", "pending_signature", "signed", "declined", "expired"]).default("draft"),
  signatureMethod: z.enum(["electronic", "scanned", "manual"]).nullable().optional().default(null),
  autoFilled: z.boolean().optional().default(false),
  signedAt: z.string().datetime().nullable().optional().default(null),
  expiresAt: z.string().datetime().nullable().optional().default(null),
  createdAt: z.string().datetime().optional(),
  data: z.record(z.any()).optional().default({}),
  fileUrl: z.string().nullable().optional().default(null),
  generatedAt: z.string().datetime().nullable().optional().default(null),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = ContractSchema.parse(await req.json())
  const id = payload.id ?? crypto.randomUUID()

  const { data: created, error } = await supabase
    .from("contracts")
    .insert({
      id,
      agency_id: tenant.agencyId,
      property_id: payload.propertyId,
      contact_id: payload.contactId ?? null,
      deal_id: payload.dealId ?? null,
      type: payload.type,
      property_category: payload.propertyCategory,
      status: payload.status,
      signature_method: payload.signatureMethod ?? null,
      auto_filled: payload.autoFilled,
      signed_at: payload.signedAt ? new Date(payload.signedAt).toISOString() : null,
      expires_at: payload.expiresAt ? new Date(payload.expiresAt).toISOString() : null,
      data: payload.data ?? {},
      file_path: payload.fileUrl ?? null,
      generated_at: payload.generatedAt ? new Date(payload.generatedAt).toISOString() : null,
      created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "contract.create",
    entityType: "contract",
    entityId: id,
    after: created,
  })

  return applyCookies(NextResponse.json(toContract(created)))
}
