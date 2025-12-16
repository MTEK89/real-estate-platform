import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Visit } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toVisit(row: any): Visit {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    contactId: String(row.contact_id),
    agentId: String(row.agent_id),
    date: String(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    status: row.status as Visit["status"],
    confirmationStatus: row.confirmation_status as Visit["confirmationStatus"],
    notes: row.notes ?? "",
    feedback: row.feedback ?? undefined,
  }
}

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  return applyCookies(NextResponse.json((data ?? []).map(toVisit)))
}

const VisitSchema = z.object({
  id: z.string().min(1).optional(),
  propertyId: z.string().min(1),
  contactId: z.string().min(1),
  agentId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).default("scheduled"),
  confirmationStatus: z.enum(["pending", "confirmed", "declined"]).default("pending"),
  notes: z.string().optional().default(""),
  feedback: z
    .object({
      interestLevel: z.number().int().min(1).max(5),
      comments: z.string(),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = VisitSchema.parse(await req.json())
  const id = payload.id ?? crypto.randomUUID()

  const { data: created, error } = await supabase
    .from("visits")
    .insert({
      id,
      agency_id: tenant.agencyId,
      property_id: payload.propertyId,
      contact_id: payload.contactId,
      agent_id: payload.agentId,
      date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      status: payload.status,
      confirmation_status: payload.confirmationStatus,
      notes: payload.notes,
      feedback: payload.feedback ?? null,
    })
    .select("*")
    .single()

  if (error || !created) {
    return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))
  }

  await writeAuditLog({
    req,
    tenant,
    action: "visit.create",
    entityType: "visit",
    entityId: id,
    after: created,
  })

  return applyCookies(NextResponse.json(toVisit(created)))
}
