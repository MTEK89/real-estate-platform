import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Commission } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toCommission(row: any): Commission {
  const payload = (row.payload ?? {}) as Partial<Commission>

  return {
    id: String(row.id),
    dealId: String(row.deal_id ?? payload.dealId ?? ""),
    agentId: String(row.agent_id ?? payload.agentId ?? ""),
    amount: Number(row.amount ?? payload.amount ?? 0),
    percentage: Number(row.percentage ?? payload.percentage ?? 0),
    status: (row.status ?? payload.status ?? "pending") as Commission["status"],
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : (payload.paidAt ?? null),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : payload.createdAt ?? new Date().toISOString(),
  } as Commission
}

const CommissionSchema = z.object({
  id: z.string().min(1).optional(),
  dealId: z.string().min(1),
  agentId: z.string().min(1),
  amount: z.number().finite().min(0),
  percentage: z.number().finite().min(0).max(100),
  status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
  paidAt: z.string().datetime().nullable().optional().default(null),
  createdAt: z.string().datetime().optional(),
})

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("commissions")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[commissions] Error fetching commissions:", error)
    return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))
  }

  return applyCookies(NextResponse.json((data ?? []).map(toCommission)))
}

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = CommissionSchema.parse(await req.json())
  const id = payload.id ?? crypto.randomUUID()

  const storedPayload: Record<string, unknown> = {
    ...payload,
    id,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  }

  const { data: created, error } = await supabase
    .from("commissions")
    .insert({
      id,
      agency_id: tenant.agencyId,
      deal_id: payload.dealId,
      agent_id: payload.agentId,
      amount: payload.amount,
      percentage: payload.percentage,
      status: payload.status,
      paid_at: payload.paidAt ? new Date(payload.paidAt).toISOString() : null,
      payload: storedPayload,
      created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "commission.create",
    entityType: "commission",
    entityId: id,
    after: created,
  })

  return applyCookies(NextResponse.json(toCommission(created)))
}