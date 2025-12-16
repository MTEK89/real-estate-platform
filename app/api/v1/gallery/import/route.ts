import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireTenant } from "@/lib/server/require-tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "property-photos"
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "photo"
}

function sniffImageContentType(buf: Buffer): "image/png" | "image/jpeg" | "image/webp" | null {
  if (buf.length < 12) return null
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png"
  // JPEG signature: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg"
  // WEBP signature: "RIFF"...."WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "image/webp"
  return null
}

function extFromUrl(url: string) {
  try {
    const u = new URL(url)
    const path = u.pathname.toLowerCase()
    const m = path.match(/\.([a-z0-9]+)$/)
    return m?.[1] ?? null
  } catch {
    return null
  }
}

const BodySchema = z.object({
  url: z.string().url(),
  filename: z.string().optional(),
  propertyId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  note: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const body = BodySchema.parse(await req.json())

  const resp = await fetch(body.url)
  if (!resp.ok) {
    return applyCookies(NextResponse.json({ error: `Failed to fetch image: ${resp.status}` }, { status: 400 }))
  }

  const buf = Buffer.from(await resp.arrayBuffer())
  const headerType = resp.headers.get("content-type") || ""
  const sniffed = sniffImageContentType(buf)
  const contentType = (headerType.startsWith("image/") ? headerType.split(";")[0] : sniffed) || "application/octet-stream"
  if (!String(contentType).startsWith("image/")) {
    return applyCookies(
      NextResponse.json(
        { error: `URL did not return an image (content-type: ${headerType || "missing"})` },
        { status: 400 },
      ),
    )
  }

  const extGuess = extFromUrl(body.url)
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : contentType === "image/jpeg" ? "jpg" : extGuess || "jpg"
  const filename = sanitizeFilename(body.filename || `import_${new Date().toISOString().slice(0, 10)}.${ext}`)

  const admin = getSupabaseAdmin()
  const id = crypto.randomUUID()
  const path = `${tenant.agencyId}/${id}-${filename}`

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buf, { contentType, upsert: false })
  if (uploadError) return applyCookies(NextResponse.json({ error: uploadError.message }, { status: 500 }))

  const folderTag =
    (body.tags || []).some((t) => typeof t === "string" && t.startsWith("folder:")) ? [] : ["folder:gallery"]

  const { data: row, error: insertError } = await supabase
    .from("photos")
    .insert({
      agency_id: tenant.agencyId,
      property_id: body.propertyId ?? null,
      filename,
      path,
      content_type: contentType,
      size: buf.length,
      tags: [...folderTag, ...(body.tags ?? [])],
      note: body.note ?? "",
      favorite: false,
      created_by: tenant.userId,
      taken_at: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (insertError || !row) return applyCookies(NextResponse.json({ error: insertError?.message || "Insert failed" }, { status: 500 }))

  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGN_TTL_SECONDS)
  return applyCookies(
    NextResponse.json({
      ok: true,
      photo: {
        id: row.id,
        filename: row.filename,
        path: row.path,
        url: signed?.signedUrl || null,
        propertyId: row.property_id,
        tags: row.tags ?? [],
        createdAt: row.created_at,
      },
    }),
  )
}
