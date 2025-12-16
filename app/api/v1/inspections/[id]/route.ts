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

const PatchSchema = z.object({
  type: z.enum(["move_in", "move_out"]).optional(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  propertyId: z.string().min(1).optional(),
  landlordId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  scheduledDate: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  rooms: z.array(z.any()).optional(),
  meters: z.record(z.any()).optional(),
  keys: z.array(z.any()).optional(),
  generalNotes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params

  const { data, error } = await supabase
    .from("inspections")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  if (error || !data) return applyCookies(NextResponse.json({ error: error?.message || "Not found" }, { status: 404 }))

  const hydrated = await hydrateSignedUrls({ inspection: toInspection(data), agencyId: tenant.agencyId })
  return applyCookies(NextResponse.json(hydrated))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params
  const patch = PatchSchema.parse(await req.json())

  const { data: existing, error: exErr } = await supabase
    .from("inspections")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  if (exErr || !existing) return applyCookies(NextResponse.json({ error: exErr?.message || "Not found" }, { status: 404 }))

  const before = existing
  const current = toInspection(existing)

  let merged: AnyInspection
  try {
    merged = stripSignedUrlsAndRequireStoragePaths({
      ...current,
      ...(patch as any),
      id,
      updatedAt: new Date().toISOString(),
    })
  } catch (e) {
    if (e instanceof Error && e.message === "PHOTO_STORAGE_PATH_REQUIRED") {
      return applyCookies(NextResponse.json({ error: "Upload photos first." }, { status: 400 }))
    }
    return applyCookies(NextResponse.json({ error: "Invalid inspection payload." }, { status: 400 }))
  }

  const { data: updated, error } = await supabase
    .from("inspections")
    .update({
      type: merged.type,
      status: merged.status,
      property_id: merged.propertyId,
      landlord_id: merged.landlordId,
      tenant_id: merged.tenantId,
      scheduled_date: merged.scheduledDate ?? null,
      started_at: merged.startedAt ? new Date(merged.startedAt).toISOString() : null,
      completed_at: merged.completedAt ? new Date(merged.completedAt).toISOString() : null,
      payload: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !updated) return applyCookies(NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "inspection.update",
    entityType: "inspection",
    entityId: id,
    before,
    after: updated,
  })

  const hydrated = await hydrateSignedUrls({ inspection: toInspection(updated), agencyId: tenant.agencyId })
  return applyCookies(NextResponse.json(hydrated))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params

  const { data: existing } = await supabase
    .from("inspections")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const before = existing ?? null

  const { error } = await supabase.from("inspections").delete().eq("agency_id", tenant.agencyId).eq("id", id)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  // Best-effort: also delete photos referenced in payload.
  try {
    const admin = getSupabaseAdmin()
    const payload = existing?.payload as any
    const photos = collectPhotos(payload)
    const paths = Array.from(
      new Set(
        photos
          .map((p) => p.storagePath)
          .filter((p): p is string => typeof p === "string" && p.length > 0 && p.startsWith(`${tenant.agencyId}/`)),
      ),
    )
    if (paths.length) {
      await admin.storage.from(BUCKET).remove(paths)
    }
  } catch {
    // ignore
  }

  await writeAuditLog({
    req,
    tenant,
    action: "inspection.delete",
    entityType: "inspection",
    entityId: id,
    before,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}
