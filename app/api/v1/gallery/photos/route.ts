import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireTenant } from "@/lib/server/require-tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "property-photos"

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const url = new URL(req.url)
  const propertyId = url.searchParams.get("propertyId")
  const folder = url.searchParams.get("folder")

  let query = supabase.from("photos").select("*").eq("agency_id", tenant.agencyId).order("created_at", { ascending: false })
  if (propertyId && propertyId !== "all") query = query.eq("property_id", propertyId)
  if (folder && folder !== "all") {
    // PostgREST array filters require quoting when values include special chars.
    // Folder tags are stored as "folder:<name>", so we filter by that exact tag.
    const safeFolder = folder.trim().toLowerCase()
    // Only apply filter if folder name is valid (alphanumeric + underscore)
    if (/^[a-z0-9_]+$/.test(safeFolder)) {
      const tag = `folder:${safeFolder}`
      // Use contains filter with proper escaping
      query = query.filter("tags", "cs", `"${tag}"`)
    } else {
      // If folder parameter is invalid, return no results (invalid filter request)
      return applyCookies(NextResponse.json([], { status: 200 }))
    }
  }

  const { data, error } = await query
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  // Generate signed URLs (private bucket). Keep short TTL.
  const admin = getSupabaseAdmin()
  const rows = await Promise.all(
    (data ?? []).map(async (p: any) => {
      let url: string | null = null
      if (p.path) {
        try {
          const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUrl(p.path, 60 * 30)
          if (!signError && signed?.signedUrl) {
            url = signed.signedUrl
          }
        } catch (err) {
          console.error(`[gallery] Failed to create signed URL for ${p.path}:`, err)
        }
      }
      return {
        id: p.id,
        agencyId: p.agency_id,
        propertyId: p.property_id,
        filename: p.filename,
        path: p.path,
        url,
        contentType: p.content_type,
        size: p.size,
        width: p.width,
        height: p.height,
        takenAt: p.taken_at,
        tags: Array.isArray(p.tags) ? p.tags : [],
        note: p.note,
        favorite: !!p.favorite,
        createdAt: p.created_at,
      }
    }),
  )

  return applyCookies(NextResponse.json(rows))
}

const PatchSchema = z
  .object({
    id: z.string().uuid(),
    propertyId: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    note: z.string().optional(),
    favorite: z.boolean().optional(),
    takenAt: z.string().datetime().nullable().optional(),
  })
  .strict()

export async function PATCH(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const body = PatchSchema.parse(await req.json())
  const patch: Record<string, unknown> = {}
  if (body.propertyId !== undefined) patch.property_id = body.propertyId
  if (body.tags !== undefined) patch.tags = body.tags
  if (body.note !== undefined) patch.note = body.note
  if (body.favorite !== undefined) patch.favorite = body.favorite
  if (body.takenAt !== undefined) patch.taken_at = body.takenAt

  const { error } = await supabase.from("photos").update(patch).eq("id", body.id).eq("agency_id", tenant.agencyId)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  return GET(req)
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return applyCookies(NextResponse.json({ error: "Missing id" }, { status: 400 }))

  const { data: existing, error: existingErr } = await supabase.from("photos").select("*").eq("id", id).eq("agency_id", tenant.agencyId).maybeSingle()
  if (existingErr) return applyCookies(NextResponse.json({ error: existingErr.message }, { status: 500 }))
  if (!existing) return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }))

  // Remove file (best-effort), then row.
  try {
    const admin = getSupabaseAdmin()
    await admin.storage.from(BUCKET).remove([existing.path])
  } catch {
    // ignore
  }

  const { error } = await supabase.from("photos").delete().eq("id", id).eq("agency_id", tenant.agencyId)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  return applyCookies(NextResponse.json({ ok: true }))
}
