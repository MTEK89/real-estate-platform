import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { BrandConfig } from "@/lib/pdf"
import { defaultBrandConfig } from "@/lib/pdf/config/brand-config"
import { generatePdfBuffer, type DocumentData, type ExtendedDocumentType } from "@/lib/pdf/server-generate"
import { requireTenant } from "@/lib/server/require-tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "generated-documents"
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "document"
}

const PersistSchema = z.object({
  kind: z.enum(["operational", "marketing", "contract", "invoice"]),
  id: z.string().min(1),
})

const BodySchema = z.object({
  documentType: z.string().min(1),
  data: z.record(z.any()),
  brandConfig: z.record(z.any()).optional(),
  options: z
    .object({
      filename: z.string().optional(),
    })
    .optional(),
  persist: PersistSchema.optional(),
})

async function injectPdfWriterAssets(args: {
  admin: ReturnType<typeof getSupabaseAdmin>
  data: Record<string, any>
}) {
  const assets = Array.isArray(args.data?.assets) ? (args.data.assets as Array<any>) : []
  if (!assets.length) return args.data

  const images: Array<{ url: string; caption?: string | null }> = []
  const resolvedAssets: Array<any> = []
  for (const asset of assets) {
    const path = typeof asset?.path === "string" ? asset.path : ""
    if (!path) continue
    const { data: signed } = await args.admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
    if (!signed?.signedUrl) continue
    const resolved = {
      ...asset,
      url: signed.signedUrl,
      key: typeof asset?.key === "string" && asset.key.trim() ? asset.key.trim() : null,
      caption: typeof asset?.caption === "string" && asset.caption.trim() ? asset.caption.trim() : null,
    }
    resolvedAssets.push(resolved)
    images.push({ url: signed.signedUrl, caption: resolved.caption })
  }

  if (!images.length) return args.data

  const body = typeof args.data?.body === "string" ? args.data.body : ""
  const usedKeys = new Set<string>()
  for (const match of body.matchAll(/\[\[IMAGE:([a-zA-Z0-9_-]+)\]\]/g)) {
    if (match[1]) usedKeys.add(match[1])
  }

  const layoutSections = Array.isArray(args.data?.layout?.sections) ? (args.data.layout.sections as any[]) : []
  for (const s of layoutSections) {
    const keys = Array.isArray(s?.imageKeys) ? (s.imageKeys as any[]) : []
    for (const k of keys) {
      if (typeof k === "string" && k.trim()) usedKeys.add(k.trim())
    }
  }

  const unusedImages = resolvedAssets
    .filter((a) => !a?.key || !usedKeys.has(String(a.key)))
    .map((a) => ({ url: a.url, caption: a.caption }))

  const layout = (args.data.layout && typeof args.data.layout === "object" ? args.data.layout : {}) as any
  const sections = Array.isArray(layout.sections) ? (layout.sections as any[]) : []
  const nextSections = [
    ...sections,
    {
      title: "Annexes",
      body: null,
      bullets: null,
      numbered: null,
      imageUrls: null,
      images: unusedImages.length ? unusedImages : images,
    },
  ]

  return { ...args.data, assets: resolvedAssets, layout: { ...layout, sections: nextSections } }
}

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const parsed = BodySchema.parse(await req.json())
  const documentType = parsed.documentType as ExtendedDocumentType

  const origin = req.nextUrl.origin
  let brandConfig = parsed.brandConfig as unknown as Partial<BrandConfig> | undefined

  // Treat empty object as "not provided" so we can fall back to the saved agency branding.
  if (brandConfig && typeof brandConfig === "object" && Object.keys(brandConfig).length === 0) {
    brandConfig = undefined
  }

  if (!brandConfig) {
    const { data: agencyRow } = await supabase
      .from("agencies")
      .select("name,settings")
      .eq("id", tenant.agencyId)
      .maybeSingle()

    const settings = (agencyRow as any)?.settings as Record<string, unknown> | null | undefined
    const branding = settings?.pdf_branding as Partial<BrandConfig> | undefined
    if (branding) brandConfig = branding

    const agencyName = (agencyRow as any)?.name as string | undefined
    if (agencyName) {
      const currentName = (brandConfig as any)?.agencyName as string | undefined
      if (!currentName || currentName === defaultBrandConfig.agencyName) {
        brandConfig = { ...(brandConfig ?? {}), agencyName }
      }
    }
  }

  let dataForPdf = parsed.data as Record<string, any>
  if (documentType === "pdf_writer" && dataForPdf && typeof dataForPdf === "object") {
    const admin = getSupabaseAdmin()
    dataForPdf = await injectPdfWriterAssets({ admin, data: dataForPdf })
  }

  const { pdfBuffer } = await generatePdfBuffer({
    documentType,
    data: dataForPdf as unknown as DocumentData,
    brandConfig,
    origin,
  })

  const createdAt = new Date().toISOString()
  const filename = sanitizeFilename(parsed.options?.filename || `${documentType}_${createdAt}.pdf`)

  let storagePath: string | null = null
  let signedUrl: string | null = null

  if (parsed.persist) {
    const admin = getSupabaseAdmin()

    storagePath = `${tenant.agencyId}/${parsed.persist.kind}/${parsed.persist.id}/${createdAt.replace(/[:.]/g, "-")}-${filename}`

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })

    if (uploadError) {
      return applyCookies(NextResponse.json({ error: uploadError.message }, { status: 500 }))
    }

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, SIGN_TTL_SECONDS)
    signedUrl = signed?.signedUrl || null

    if (parsed.persist.kind === "marketing") {
      const { error } = await supabase
        .from("marketing_documents")
        .update({ file_path: storagePath, generated_at: createdAt })
        .eq("agency_id", tenant.agencyId)
        .eq("id", parsed.persist.id)

      if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    if (parsed.persist.kind === "operational") {
      const { data: existing, error: readError } = await supabase
        .from("operational_documents")
        .select("attachments")
        .eq("agency_id", tenant.agencyId)
        .eq("id", parsed.persist.id)
        .single()

      if (readError) return applyCookies(NextResponse.json({ error: readError.message }, { status: 500 }))

      const current = Array.isArray((existing as any)?.attachments) ? ((existing as any).attachments as string[]) : []
      const next = Array.from(new Set([...current, storagePath]))

      const { error } = await supabase
        .from("operational_documents")
        .update({ attachments: next })
        .eq("agency_id", tenant.agencyId)
        .eq("id", parsed.persist.id)

      if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    if (parsed.persist.kind === "contract") {
      const { error } = await supabase
        .from("contracts")
        .update({ file_path: storagePath, generated_at: createdAt })
        .eq("agency_id", tenant.agencyId)
        .eq("id", parsed.persist.id)

      if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    if (parsed.persist.kind === "invoice") {
      const { error } = await supabase
        .from("invoices")
        .update({ file_path: storagePath, generated_at: createdAt })
        .eq("agency_id", tenant.agencyId)
        .eq("id", parsed.persist.id)

      if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
    }
  }

  return applyCookies(
    NextResponse.json({
      ok: true,
      storagePath,
      signedUrl,
      size: pdfBuffer.length,
      contentType: "application/pdf",
    }),
  )
}
