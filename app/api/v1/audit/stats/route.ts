import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

const QuerySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const url = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    entityType: url.searchParams.get("entityType") ?? "",
    entityId: url.searchParams.get("entityId") ?? "",
  })
  if (!parsed.success) {
    return applyCookies(NextResponse.json({ error: "Invalid query" }, { status: 400 }))
  }

  const { entityType, entityId } = parsed.data

  const { data, error } = await supabase
    .from("audit_logs")
    .select("action, created_at, after")
    .eq("agency_id", tenant.agencyId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .in("action", ["contract.view_start", "contract.view_end"])
    .order("created_at", { ascending: false })
    .limit(1000)

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  let openCount = 0
  let lastOpenedAt: string | null = null
  let totalTimeMs = 0

  for (const row of data ?? []) {
    if (row.action === "contract.view_start") {
      openCount += 1
      if (!lastOpenedAt) lastOpenedAt = row.created_at ?? null
    }
    if (row.action === "contract.view_end") {
      const after = (row.after ?? {}) as any
      const durationMs = typeof after?.durationMs === "number" ? after.durationMs : Number(after?.durationMs)
      if (Number.isFinite(durationMs)) totalTimeMs += Math.max(0, Math.floor(durationMs))
    }
  }

  return applyCookies(NextResponse.json({ ok: true, openCount, lastOpenedAt, totalTimeMs }))
}

