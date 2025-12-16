import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Property } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toProperty(p: {
  id: string
  reference: string
  status: string
  type: string
  address: unknown
  characteristics: unknown
  price: number
  ownerId: string
  tags: unknown
  images: unknown
  createdAt: Date
}): Property {
  return {
    id: p.id,
    reference: p.reference,
    status: p.status as Property["status"],
    type: p.type as Property["type"],
    address: (p.address ?? {}) as Property["address"],
    characteristics: (p.characteristics ?? {}) as Property["characteristics"],
    price: p.price,
    ownerId: p.ownerId,
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    createdAt: p.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req)
  if ("response" in auth) return auth.response
  const { supabase, tenant, applyCookies } = auth
  const { id } = await ctx.params

  const { data: row, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .maybeSingle()

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
  if (!row) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  return applyCookies(
    NextResponse.json(
    toProperty({
      id: row.id,
      reference: row.reference,
      status: row.status,
      type: row.type,
      address: row.address,
      characteristics: row.characteristics,
      price: row.price,
      ownerId: row.owner_id,
      tags: row.tags,
      images: row.images,
      createdAt: new Date(row.created_at),
    }),
    ),
  )
}

const PatchPropertySchema = z
  .object({
    reference: z.string().min(1).optional(),
    status: z.enum(["draft", "published", "under_offer", "sold", "rented", "archived"]).optional(),
    type: z.enum(["house", "apartment", "office", "retail", "land"]).optional(),
    address: z
      .object({
        street: z.string().min(1),
        city: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().min(1),
      })
      .partial()
      .optional(),
    characteristics: z
      .object({
        surface: z.number().nonnegative(),
        rooms: z.number().int().nonnegative(),
        bedrooms: z.number().int().nonnegative(),
        bathrooms: z.number().int().nonnegative(),
        yearBuilt: z.number().int().nonnegative().optional(),
        condition: z.string().min(1),
      })
      .partial()
      .optional(),
    price: z.number().nonnegative().optional(),
    ownerId: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
  })
  .strict()

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req)
  if ("response" in auth) return auth.response
  const { supabase, tenant, applyCookies } = auth
  const { id } = await ctx.params

  const payload = PatchPropertySchema.parse(await req.json())

  const { data: existing, error: existingError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .maybeSingle()
  if (existingError) return applyCookies(NextResponse.json({ error: existingError.message }, { status: 500 }))
  if (!existing) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  const patch: Record<string, unknown> = {}
  if (payload.reference !== undefined) patch.reference = payload.reference
  if (payload.status !== undefined) patch.status = payload.status
  if (payload.type !== undefined) patch.type = payload.type
  if (payload.price !== undefined) patch.price = payload.price
  if (payload.ownerId !== undefined) patch.owner_id = payload.ownerId
  if (payload.tags !== undefined) patch.tags = payload.tags
  if (payload.images !== undefined) patch.images = payload.images
  if (payload.address !== undefined) patch.address = { ...(existing.address ?? {}), ...payload.address }
  if (payload.characteristics !== undefined) {
    patch.characteristics = { ...(existing.characteristics ?? {}), ...payload.characteristics }
  }

  const { data: updated, error: updateError } = await supabase
    .from("properties")
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
    action: "property.update",
    entityType: "property",
    entityId: id,
    before: existing,
    after: updated,
  })

  return applyCookies(
    NextResponse.json(
    toProperty({
      id: updated.id,
      reference: updated.reference,
      status: updated.status,
      type: updated.type,
      address: updated.address,
      characteristics: updated.characteristics,
      price: updated.price,
      ownerId: updated.owner_id,
      tags: updated.tags,
      images: updated.images,
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
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agency_id", tenant.agencyId)
    .maybeSingle()
  if (existingError) return applyCookies(NextResponse.json({ error: existingError.message }, { status: 500 }))
  if (!existing) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  const { error: deleteError } = await supabase.from("properties").delete().eq("id", id).eq("agency_id", tenant.agencyId)
  if (deleteError) return applyCookies(NextResponse.json({ error: deleteError.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "property.delete",
    entityType: "property",
    entityId: id,
    before: existing,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}
