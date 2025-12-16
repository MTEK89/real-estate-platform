import { NextResponse, type NextRequest } from "next/server"
import { requireTenant } from "@/lib/server/require-tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "inspection-photos"
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "photo"
}

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const form = await req.formData()
  const inspectionId = String(form.get("inspectionId") || "")
  const files = form.getAll("files") as File[]

  if (!inspectionId) return applyCookies(NextResponse.json({ error: "inspectionId is required" }, { status: 400 }))
  if (!files.length) return applyCookies(NextResponse.json({ error: "No files uploaded" }, { status: 400 }))

  // Verify inspection belongs to tenant
  const { data: inspection, error: inspErr } = await supabase
    .from("inspections")
    .select("id")
    .eq("agency_id", tenant.agencyId)
    .eq("id", inspectionId)
    .single()

  if (inspErr || !inspection) {
    return applyCookies(NextResponse.json({ error: "Inspection not found" }, { status: 404 }))
  }

  const admin = getSupabaseAdmin()
  const created: any[] = []

  for (const file of files) {
    const id = crypto.randomUUID()
    const filename = sanitizeFilename(file.name || "photo")
    const path = `${tenant.agencyId}/inspections/${inspectionId}/${id}-${filename}`
    const contentType = file.type || "application/octet-stream"
    const buf = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buf, {
      contentType,
      upsert: false,
    })

    if (uploadError) {
      return applyCookies(NextResponse.json({ error: uploadError.message }, { status: 500 }))
    }

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGN_TTL_SECONDS)

    created.push({
      id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: filename,
      mimeType: contentType,
      storagePath: path,
      dataUrl: signed?.signedUrl || null,
      createdAt: new Date().toISOString(),
    })
  }

  return applyCookies(NextResponse.json({ ok: true, created }))
}
