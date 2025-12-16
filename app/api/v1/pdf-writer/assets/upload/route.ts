import { NextResponse, type NextRequest } from "next/server"
import { requireTenant } from "@/lib/server/require-tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "generated-documents"
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "asset"
}

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { tenant, applyCookies } = ctx

  const form = await req.formData()
  const documentId = String(form.get("documentId") || "").trim()
  const files = form.getAll("files") as File[]

  if (!documentId) return applyCookies(NextResponse.json({ error: "documentId is required" }, { status: 400 }))
  if (!files.length) return applyCookies(NextResponse.json({ error: "No files uploaded" }, { status: 400 }))

  const admin = getSupabaseAdmin()
  const created: any[] = []

  for (const file of files) {
    const filename = sanitizeFilename(file.name || "asset")
    const id = crypto.randomUUID()
    const path = `${tenant.agencyId}/marketing/${documentId}/assets/${id}-${filename}`
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
      path,
      filename,
      contentType,
      size: buf.length,
      signedUrl: signed?.signedUrl || null,
    })
  }

  return applyCookies(NextResponse.json({ ok: true, created }))
}

