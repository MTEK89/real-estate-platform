import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseRouteClient } from "@/lib/supabase/route-client"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
  if (!user) return applyCookies(NextResponse.json({ user: null }, { status: 200 }))

  const { data: memberships } = await supabase.from("agency_users").select("agency_id, role").eq("user_id", user.id)

  return applyCookies(
    NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      memberships: memberships ?? [],
    }),
  )
}

