import { NextRequest, NextResponse } from "next/server"
import type { BrandConfig } from "@/lib/pdf"
import { defaultBrandConfig } from "@/lib/pdf/config/brand-config"
import { generatePdfBuffer, type DocumentData, type ExtendedDocumentType } from "@/lib/pdf/server-generate"
import { requireTenant } from "@/lib/server/require-tenant"

interface PDFGenerationRequest {
  documentType: ExtendedDocumentType
  data: DocumentData
  brandConfig?: Partial<BrandConfig>
  options?: {
    filename?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireTenant(request)
    if ("response" in ctx) return ctx.response
    const { supabase, tenant, applyCookies } = ctx

    const body: PDFGenerationRequest = await request.json()
    const { documentType, data } = body
    let partialBrandConfig = body.brandConfig as Partial<BrandConfig> | undefined

    if (!documentType || !data) {
      return applyCookies(NextResponse.json({ error: "Missing required fields: documentType and data" }, { status: 400 }))
    }

    // Treat empty object as "not provided" so we can fall back to the saved agency branding.
    if (partialBrandConfig && typeof partialBrandConfig === "object" && Object.keys(partialBrandConfig).length === 0) {
      partialBrandConfig = undefined
    }

    if (!partialBrandConfig) {
      const { data: agencyRow } = await supabase
        .from("agencies")
        .select("name,settings")
        .eq("id", tenant.agencyId)
        .maybeSingle()

      const settings = (agencyRow as any)?.settings as Record<string, unknown> | null | undefined
      const branding = settings?.pdf_branding as Partial<BrandConfig> | undefined
      if (branding) partialBrandConfig = branding

      const agencyName = (agencyRow as any)?.name as string | undefined
      if (agencyName) {
        const currentName = (partialBrandConfig as any)?.agencyName as string | undefined
        if (!currentName || currentName === defaultBrandConfig.agencyName) {
          partialBrandConfig = { ...(partialBrandConfig ?? {}), agencyName }
        }
      }
    }

    const origin = request.nextUrl.origin
    const { pdfBuffer } = await generatePdfBuffer({
      documentType,
      data,
      brandConfig: partialBrandConfig,
      origin,
    })

    return applyCookies(
      new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": pdfBuffer.length.toString(),
          "Cache-Control": "no-store",
        },
      }),
    )
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
