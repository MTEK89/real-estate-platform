import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseRouteClient } from "@/lib/supabase/route-client"
import { ensureTenantSeed } from "@/lib/server/bootstrap"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
  }

  const { data: memberships, error } = await supabase
    .from("agency_users")
    .select("agency_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  const agencyId = memberships?.[0]?.agency_id ?? null
  if (!agencyId) {
    return applyCookies(NextResponse.json({ ok: false, code: "NO_AGENCY" }, { status: 409 }))
  }

  // Auto-seed minimal data (dev only) so the platform is usable immediately.
  // This avoids "empty dropdown" UX while still storing data in Supabase.
  if (isSupabaseAdminConfigured()) {
    try {
      await ensureTenantSeed({ agencyId, userId: user.id })
    } catch {
      // ignore best-effort seed failures
    }
  }

  return applyCookies(NextResponse.json({ ok: true, userId: user.id, agencyId }))
}
