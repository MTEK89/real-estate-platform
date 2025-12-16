import { NextResponse, type NextRequest } from "next/server"
import { requireTenant } from "@/lib/server/require-tenant"
import { seedTenantMockData } from "@/lib/server/seed-tenant-mock"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to seed demo data safely." },
      { status: 400 },
    )
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seeding is disabled in production." }, { status: 403 })
  }

  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { tenant, applyCookies } = ctx

  const url = new URL(req.url)
  const scope = url.searchParams.get("scope") === "full" ? "full" : "properties"

  const result = await seedTenantMockData({ agencyId: tenant.agencyId, userId: tenant.userId, scope })
  return applyCookies(NextResponse.json({ ok: true, scope, ...result }))
}
