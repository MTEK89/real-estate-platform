import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { CommercialDocument } from "@/lib/mock-data"
import { requireTenant } from "@/lib/server/require-tenant"
import { writeAuditLog } from "@/lib/server/audit"

export const runtime = "nodejs"

function toMarketingDocument(row: any): CommercialDocument {
  return {
    id: String(row.id),
    propertyId: row.property_id ? String(row.property_id) : "",
    type: row.type as CommercialDocument["type"],
    title: String(row.title),
    description: row.description ?? "",
    version: Number(row.version ?? 1),
    status: row.status as CommercialDocument["status"],
    fileUrl: row.file_path ?? null,
    generatedAt: row.generated_at ? new Date(row.generated_at).toISOString() : null,
    data: (row.data ?? {}) as Record<string, unknown>,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("marketing_documents")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  return applyCookies(NextResponse.json((data ?? []).map(toMarketingDocument)))
}

const CreateSchema = z.object({
  id: z.string().min(1).optional(),
  propertyId: z.string().min(1).nullable().optional().default(null),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  version: z.number().int().min(1).optional().default(1),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  data: z.record(z.any()).default({}),
  fileUrl: z.string().nullable().optional().default(null),
  generatedAt: z.string().datetime().nullable().optional().default(null),
  createdAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = CreateSchema.parse(await req.json())
  const id = payload.id ?? crypto.randomUUID()

  const { data: created, error } = await supabase
    .from("marketing_documents")
    .insert({
      id,
      agency_id: tenant.agencyId,
      property_id: payload.propertyId ?? null,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      version: payload.version,
      status: payload.status,
      data: payload.data,
      file_path: payload.fileUrl ?? null,
      generated_at: payload.generatedAt ? new Date(payload.generatedAt).toISOString() : null,
      created_by: tenant.userId,
      created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "marketing_document.create",
    entityType: "marketing_document",
    entityId: id,
    after: created,
  })

  return applyCookies(NextResponse.json(toMarketingDocument(created)))
}
