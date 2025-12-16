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

const PatchSchema = z.object({
  propertyId: z.string().min(1).nullable().optional(),
  type: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  version: z.number().int().min(1).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
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
    .from("marketing_documents")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const { data: updated, error } = await supabase
    .from("marketing_documents")
    .update({
      property_id: patch.propertyId,
      type: patch.type,
      title: patch.title,
      description: patch.description,
      version: patch.version,
      status: patch.status,
      data: patch.data,
      file_path: patch.fileUrl,
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
    action: "marketing_document.update",
    entityType: "marketing_document",
    entityId: id,
    before,
    after: updated,
  })

  return applyCookies(NextResponse.json(toMarketingDocument(updated)))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params

  const { data: before } = await supabase
    .from("marketing_documents")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const { error } = await supabase.from("marketing_documents").delete().eq("agency_id", tenant.agencyId).eq("id", id)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "marketing_document.delete",
    entityType: "marketing_document",
    entityId: id,
    before,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}
