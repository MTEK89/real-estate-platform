import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/lib/supabase/route-client"

export type TenantContext = {
  agencyId: string
  userId: string
}

export async function requireTenant(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      response: applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 })),
    } as const
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("agency_users")
    .select("agency_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)

  if (membershipsError) {
    return {
      response: applyCookies(NextResponse.json({ error: membershipsError.message }, { status: 500 })),
    } as const
  }

  const agencyId = memberships?.[0]?.agency_id

  if (!agencyId) {
    return {
      response: applyCookies(
        NextResponse.json({ error: "No agency found for this user", code: "NO_AGENCY" }, { status: 409 }),
      ),
    } as const
  }

  return {
    supabase,
    applyCookies,
    tenant: { agencyId, userId: user.id },
  } as const
}

