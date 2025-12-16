import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("agency_users")
    .select("id,agency_id,user_id,role,created_at,users:users(id,email,first_name,last_name,phone,role)")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: true })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    role: r.role,
    createdAt: r.created_at,
    profile: r.users
      ? {
          id: r.users.id,
          email: r.users.email,
          firstName: r.users.first_name,
          lastName: r.users.last_name,
          phone: r.users.phone,
        }
      : null,
  }))

  return applyCookies(NextResponse.json(rows))
}

const PatchSchema = z
  .object({
    memberId: z.string().min(1),
    role: z.enum(["owner", "admin", "manager", "agent"]),
  })
  .strict()

export async function PATCH(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const body = PatchSchema.parse(await req.json())

  // Prevent removing ownership accidentally in MVP.
  if (body.role === "owner") {
    return applyCookies(NextResponse.json({ error: "Promoting to owner is not supported yet." }, { status: 400 }))
  }

  const { error } = await supabase
    .from("agency_users")
    .update({ role: body.role })
    .eq("id", body.memberId)
    .eq("agency_id", tenant.agencyId)

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
  return GET(req)
}

const DeleteSchema = z.object({ memberId: z.string().min(1) }).strict()

export async function DELETE(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const url = new URL(req.url)
  const memberId = url.searchParams.get("memberId")
  const bodyMemberId = memberId || (await req.json().catch(() => null))?.memberId
  const body = DeleteSchema.parse({ memberId: bodyMemberId })

  const { error } = await supabase.from("agency_users").delete().eq("id", body.memberId).eq("agency_id", tenant.agencyId)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  return applyCookies(NextResponse.json({ ok: true }))
}

