import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireTenant } from "@/lib/server/require-tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("agency_invitations")
    .select("id,email,role,status,created_at,accepted_at")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
  return applyCookies(NextResponse.json(data ?? []))
}

const InviteSchema = z
  .object({
    email: z.string().email(),
    role: z.enum(["admin", "manager", "agent"]).default("agent"),
  })
  .strict()

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const body = InviteSchema.parse(await req.json())

  // Create invitation row first
  const { data: created, error } = await supabase
    .from("agency_invitations")
    .insert({
      agency_id: tenant.agencyId,
      email: body.email.toLowerCase(),
      role: body.role,
      invited_by_user_id: tenant.userId,
      status: "pending",
    })
    .select("id,email,role,status,created_at,accepted_at")
    .single()

  if (error || !created) return applyCookies(NextResponse.json({ error: error?.message || "Invite failed" }, { status: 500 }))

  // Send Supabase Auth invite email (magic link) that lands in our accept page.
  try {
    const origin = req.headers.get("origin") || "http://localhost:3002"
    const redirectTo = `${origin}/auth/callback?next=/accept-invite?invite_id=${created.id}`
    const admin = getSupabaseAdmin()
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(body.email, { redirectTo })
    if (inviteErr) throw inviteErr
  } catch (e: any) {
    // Keep the invitation row; owner can retry later (we'll expose "Resend" next).
    return applyCookies(
      NextResponse.json(
        { error: `Invitation created but email failed to send: ${e?.message || "unknown error"}`, invite: created },
        { status: 502 },
      ),
    )
  }

  return applyCookies(NextResponse.json({ ok: true, invite: created }))
}

