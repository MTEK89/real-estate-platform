import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "@/lib/supabase/route-client"

export const runtime = "nodejs"

const BodySchema = z.object({ inviteId: z.string().uuid() }).strict()

export async function POST(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

  const { inviteId } = BodySchema.parse(await req.json())

  const { data, error } = await supabase.rpc("accept_agency_invitation", { p_invite_id: inviteId })
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 400 }))

  return applyCookies(NextResponse.json(data))
}

