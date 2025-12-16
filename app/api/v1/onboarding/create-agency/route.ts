import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "@/lib/supabase/route-client"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BodySchema = z.object({
  name: z.string().min(2),
})

export async function POST(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

  const { name } = BodySchema.parse(await req.json())

  // If the user already has an agency, return it.
  const { data: existingMemberships, error: existingErr } = await supabase
    .from("agency_users")
    .select("agency_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)

  if (existingErr) return applyCookies(NextResponse.json({ error: existingErr.message }, { status: 500 }))

  const existingAgencyId = existingMemberships?.[0]?.agency_id
  if (existingAgencyId) return applyCookies(NextResponse.json({ ok: true, agencyId: existingAgencyId }))

  const admin = getSupabaseAdmin()

  // Ensure the platform profile exists (public.users), required by FK constraints.
  const firstName = (user.user_metadata as any)?.first_name || ""
  const lastName = (user.user_metadata as any)?.last_name || ""

  const { error: upsertUserError } = await admin.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? `${user.id}@unknown`,
      first_name: String(firstName || "Agent"),
      last_name: String(lastName || "User"),
      role: "agent",
    },
    { onConflict: "id" },
  )
  if (upsertUserError) return applyCookies(NextResponse.json({ error: upsertUserError.message }, { status: 500 }))

  const agencyId = crypto.randomUUID()
  const agencyUserId = `au_${agencyId}_${user.id}`

  const { error: createAgencyError } = await admin.from("agencies").insert({ id: agencyId, name })
  if (createAgencyError) return applyCookies(NextResponse.json({ error: createAgencyError.message }, { status: 500 }))

  const { error: membershipError } = await admin.from("agency_users").insert({
    id: agencyUserId,
    agency_id: agencyId,
    user_id: user.id,
    role: "owner",
  })
  if (membershipError) return applyCookies(NextResponse.json({ error: membershipError.message }, { status: 500 }))

  return applyCookies(NextResponse.json({ ok: true, agencyId }))
}

