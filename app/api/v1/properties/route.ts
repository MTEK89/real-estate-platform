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

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  const rows = (data ?? []).map((r: any) =>
    toProperty({
      id: r.id,
      reference: r.reference,
      status: r.status,
      type: r.type,
      address: r.address,
      characteristics: r.characteristics,
      price: r.price,
      ownerId: r.owner_id,
      tags: r.tags,
      images: r.images,
      createdAt: new Date(r.created_at),
    }),
  )

  return applyCookies(NextResponse.json(rows))
}

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
})

const CharacteristicsSchema = z.object({
  surface: z.number().nonnegative(),
  rooms: z.number().int().nonnegative(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  yearBuilt: z.number().int().nonnegative().optional(),
  condition: z.string().min(1),
})

const CreatePropertySchema = z.object({
  id: z.string().min(1).optional(),
  reference: z.string().min(1),
  status: z.enum(["draft", "published", "under_offer", "sold", "rented", "archived"]).default("draft"),
  type: z.enum(["house", "apartment", "office", "retail", "land"]).default("apartment"),
  address: AddressSchema,
  characteristics: CharacteristicsSchema,
  price: z.number().nonnegative(),
  ownerId: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  createdAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = CreatePropertySchema.parse(await req.json())

  const id = payload.id ?? crypto.randomUUID()
  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      id,
      agency_id: tenant.agencyId,
      reference: payload.reference,
      status: payload.status,
      type: payload.type,
      address: payload.address,
      characteristics: payload.characteristics,
      price: payload.price,
      owner_id: payload.ownerId,
      tags: payload.tags,
      images: payload.images,
      created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) {
    return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))
  }

  await writeAuditLog({
    req,
    tenant,
    action: "property.create",
    entityType: "property",
    entityId: id,
    after: created,
  })

  return applyCookies(
    NextResponse.json(
    toProperty({
      id: created.id,
      reference: created.reference,
      status: created.status,
      type: created.type,
      address: created.address,
      characteristics: created.characteristics,
      price: created.price,
      ownerId: created.owner_id,
      tags: created.tags,
      images: created.images,
      createdAt: new Date(created.created_at),
    }),
    ),
  )
}
