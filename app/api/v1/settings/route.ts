import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireTenant } from "@/lib/server/require-tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const runtime = "nodejs"

const UpdateProfileSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().min(1).optional().nullable(),
  })
  .optional()

const UpdateAgencySchema = z
  .object({
    name: z.string().min(2).optional(),
    settings: z.record(z.unknown()).optional(),
  })
  .optional()

const UpdateBodySchema = z
  .object({
    profile: UpdateProfileSchema,
    agency: UpdateAgencySchema,
  })
  .strict()

async function ensureUserRow(args: { userId: string; email: string | null; firstName?: string; lastName?: string }) {
  const admin = getSupabaseAdmin()
  const { userId, email, firstName, lastName } = args

  await admin.from("users").upsert(
    {
      id: userId,
      email: email ?? `${userId}@unknown`,
      first_name: firstName || "Agent",
      last_name: lastName || "User",
      role: "agent",
    },
    { onConflict: "id" },
  )
}

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Ensure the companion profile row exists (best-effort) so Settings can always load.
  try {
    await ensureUserRow({
      userId: tenant.userId,
      email: user?.email ?? null,
      firstName: (user?.user_metadata as any)?.first_name,
      lastName: (user?.user_metadata as any)?.last_name,
    })
  } catch {
    // ignore
  }

  const [{ data: agency, error: agencyError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("agencies").select("id,name,settings").eq("id", tenant.agencyId).maybeSingle(),
    supabase.from("users").select("id,email,first_name,last_name,phone,settings,role").eq("id", tenant.userId).maybeSingle(),
  ])

  if (agencyError) return applyCookies(NextResponse.json({ error: agencyError.message }, { status: 500 }))
  if (profileError) return applyCookies(NextResponse.json({ error: profileError.message }, { status: 500 }))

  return applyCookies(
    NextResponse.json({
      agency: agency
        ? {
            id: agency.id,
            name: agency.name,
            settings: (agency.settings ?? {}) as Record<string, unknown>,
          }
        : null,
      profile: profile
        ? {
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            phone: profile.phone,
            role: profile.role,
            settings: (profile.settings ?? {}) as Record<string, unknown>,
          }
        : null,
    }),
  )
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx
  const writer = isSupabaseAdminConfigured() ? getSupabaseAdmin() : supabase

  const body = UpdateBodySchema.parse(await req.json())

  if (body.profile) {
    const patch: Record<string, unknown> = {}
    if (body.profile.firstName !== undefined) patch.first_name = body.profile.firstName
    if (body.profile.lastName !== undefined) patch.last_name = body.profile.lastName
    if (body.profile.phone !== undefined) patch.phone = body.profile.phone

    if (Object.keys(patch).length) {
      const { error } = await writer.from("users").update(patch).eq("id", tenant.userId)
      if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
    }
  }

  if (body.agency) {
    const patch: Record<string, unknown> = {}
    if (body.agency.name !== undefined) patch.name = body.agency.name
    if (body.agency.settings !== undefined) patch.settings = body.agency.settings

    if (Object.keys(patch).length) {
      const { error } = await writer.from("agencies").update(patch).eq("id", tenant.agencyId)
      if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
    }
  }

  return GET(req)
}
