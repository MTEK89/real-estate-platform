import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { requireTenant } from "@/lib/server/require-tenant"
import { writeAuditLog } from "@/lib/server/audit"

export const runtime = "nodejs"

const BodySchema = z
  .object({
    action: z.string().min(1),
    entityType: z.string().min(1),
    entityId: z.string().min(1).nullable().optional().default(null),
    meta: z.record(z.any()).optional().default({}),
  })
  .strict()

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { tenant, applyCookies } = ctx

  const payload = BodySchema.parse(await req.json())

  await writeAuditLog({
    req,
    tenant,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId ?? null,
    after: payload.meta ?? null,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}

