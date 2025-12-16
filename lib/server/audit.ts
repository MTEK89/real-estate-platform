import type { NextRequest } from "next/server"
import type { TenantContext } from "@/lib/server/tenant"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function writeAuditLog(args: {
  req: NextRequest
  tenant: TenantContext
  action: string
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
}) {
  const { req, tenant, action, entityType, entityId, before, after } = args

  try {
    const supabase = getSupabaseAdmin()
    await supabase.from("audit_logs").insert({
      agency_id: tenant.agencyId,
      actor_user_id: tenant.userId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      before: before ?? null,
      after: after ?? null,
      ip: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    })
  } catch {
    // Best-effort: never block the primary operation for audit logging.
  }
}
