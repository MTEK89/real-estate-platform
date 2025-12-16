import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Inspection } from "@/lib/inspections"
import { requireTenant } from "@/lib/server/require-tenant"
import { writeAuditLog } from "@/lib/server/audit"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "inspection-photos"
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7

type AnyInspection = Inspection & {
  rooms?: any
  meters?: any
  keys?: any
}

type AnyPhoto = {
  id?: string
  name?: string
  mimeType?: string
  dataUrl?: string
  storagePath?: string
  createdAt?: string
}

function collectPhotos(inspection: any): AnyPhoto[] {
  const photos: AnyPhoto[] = []

  const push = (p: any) => {
    if (!p || typeof p !== "object") return
    photos.push(p as AnyPhoto)
  }

  for (const room of inspection?.rooms ?? []) {
    for (const item of room?.items ?? []) {
      for (const p of item?.photos ?? []) push(p)
    }
  }

  for (const key of inspection?.keys ?? []) {
    for (const p of key?.photos ?? []) push(p)
  }

  for (const meter of Object.values(inspection?.meters ?? {})) {
    for (const p of (meter as any)?.photos ?? []) push(p)
  }

  return photos
}

function stripSignedUrlsAndRequireStoragePaths(inspection: AnyInspection): AnyInspection {
  const photos = collectPhotos(inspection)
  for (const p of photos) {
    if (p.storagePath) {
      delete p.dataUrl
      continue
    }
    // For go-live: avoid storing base64 in Postgres
    throw new Error("PHOTO_STORAGE_PATH_REQUIRED")
  }
  return inspection
}

async function hydrateSignedUrls(args: { inspection: AnyInspection; agencyId: string }) {
  const { inspection, agencyId } = args
  const admin = getSupabaseAdmin()

  const photos = collectPhotos(inspection)
  const uniquePaths = Array.from(
    new Set(
      photos
        .map((p) => p.storagePath)
        .filter((p): p is string => typeof p === "string" && p.length > 0 && p.startsWith(`${agencyId}/`)),
    ),
  )

  if (uniquePaths.length === 0) return inspection

  const signedByPath = new Map<string, string>()

  for (const path of uniquePaths) {
    const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGN_TTL_SECONDS)
    if (data?.signedUrl) signedByPath.set(path, data.signedUrl)
  }

  for (const p of photos) {
    if (p.storagePath && signedByPath.has(p.storagePath)) {
      p.dataUrl = signedByPath.get(p.storagePath)
    }
  }

  return inspection
}

function toInspection(row: any): AnyInspection {
  return row.payload as AnyInspection
}

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  const hydrated: AnyInspection[] = []
  for (const row of data ?? []) {
    const insp = toInspection(row)
    hydrated.push(await hydrateSignedUrls({ inspection: insp, agencyId: tenant.agencyId }))
  }

  return applyCookies(NextResponse.json(hydrated))
}

const InspectionSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.enum(["move_in", "move_out"]),
  status: z.enum(["draft", "in_progress", "completed"]),
  propertyId: z.string().min(1),
  landlordId: z.string().min(1),
  tenantId: z.string().min(1),
  scheduledDate: z.string().nullable().optional().default(null),
  startedAt: z.string().nullable().optional().default(null),
  completedAt: z.string().nullable().optional().default(null),
  rooms: z.array(z.any()).default([]),
  meters: z.record(z.any()).default({}),
  keys: z.array(z.any()).default([]),
  generalNotes: z.string().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = InspectionSchema.parse(await req.json())
  const now = new Date().toISOString()

  let inspection: AnyInspection
  try {
    inspection = stripSignedUrlsAndRequireStoragePaths({
      ...(payload as any),
      id: payload.id ?? crypto.randomUUID(),
      createdAt: payload.createdAt ?? now,
      updatedAt: payload.updatedAt ?? now,
    })
  } catch (e) {
    if (e instanceof Error && e.message === "PHOTO_STORAGE_PATH_REQUIRED") {
      return applyCookies(NextResponse.json({ error: "Upload photos first." }, { status: 400 }))
    }
    return applyCookies(NextResponse.json({ error: "Invalid inspection payload." }, { status: 400 }))
  }

  const { data: created, error } = await supabase
    .from("inspections")
    .insert({
      id: inspection.id,
      agency_id: tenant.agencyId,
      type: inspection.type,
      status: inspection.status,
      property_id: inspection.propertyId,
      landlord_id: inspection.landlordId,
      tenant_id: inspection.tenantId,
      scheduled_date: inspection.scheduledDate ?? null,
      started_at: inspection.startedAt ? new Date(inspection.startedAt).toISOString() : null,
      completed_at: inspection.completedAt ? new Date(inspection.completedAt).toISOString() : null,
      payload: inspection,
      created_at: inspection.createdAt ? new Date(inspection.createdAt).toISOString() : undefined,
      updated_at: inspection.updatedAt ? new Date(inspection.updatedAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "inspection.create",
    entityType: "inspection",
    entityId: inspection.id,
    after: created,
  })

  const hydrated = await hydrateSignedUrls({ inspection: toInspection(created), agencyId: tenant.agencyId })
  return applyCookies(NextResponse.json(hydrated))
}
