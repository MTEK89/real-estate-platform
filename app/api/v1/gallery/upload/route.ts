import { NextResponse, type NextRequest } from "next/server"
import { requireTenant } from "@/lib/server/require-tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "property-photos"

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "photo"
}

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const form = await req.formData()
  const propertyId = (form.get("propertyId") as string | null) || null
  const files = form.getAll("files") as File[]
  const rawTags = form.get("tags") as string | null
  const rawNote = form.get("note") as string | null

  let tags: string[] = []
  if (rawTags && rawTags.trim()) {
    try {
      const parsed = JSON.parse(rawTags)
      if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === "string")
    } catch {
      tags = rawTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    }
  }

  if (!files.length) return applyCookies(NextResponse.json({ error: "No files uploaded" }, { status: 400 }))

  const admin = getSupabaseAdmin()
  const created: any[] = []

  for (const file of files) {
    const id = crypto.randomUUID()
    const filename = sanitizeFilename(file.name || "photo")
    const path = `${tenant.agencyId}/${id}-${filename}`
    const contentType = file.type || "application/octet-stream"
    const buf = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buf, {
      contentType,
      upsert: false,
    })
    if (uploadError) {
      return applyCookies(NextResponse.json({ error: uploadError.message }, { status: 500 }))
    }

    const { data: row, error: insertError } = await supabase
      .from("photos")
      .insert({
        // Let DB generate uuid; store our id in path for uniqueness
        agency_id: tenant.agencyId,
        property_id: propertyId,
        filename,
        path,
        content_type: contentType,
        size: buf.length,
        tags:
          tags.length
            ? tags
            : propertyId
              ? ["folder:property"]
              : ["folder:gallery"],
        note: rawNote ?? "",
        favorite: false,
        created_by: tenant.userId,
        taken_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (insertError || !row) return applyCookies(NextResponse.json({ error: insertError?.message || "Insert failed" }, { status: 500 }))

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 30)
    created.push({
      id: row.id,
      filename: row.filename,
      path: row.path,
      url: signed?.signedUrl || null,
      propertyId: row.property_id,
      createdAt: row.created_at,
    })
  }

  return applyCookies(NextResponse.json({ ok: true, created }))
}
