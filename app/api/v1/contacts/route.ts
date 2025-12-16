import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Contact } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toContact(c: {
  id: string
  type: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  source: string
  status: string
  assignedTo: string | null
  tags: unknown
  notes: string
  lastContactAt: Date | null
  createdAt: Date
}): Contact {
  return {
    id: c.id,
    type: c.type as Contact["type"],
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    source: c.source,
    status: c.status as Contact["status"],
    assignedTo: c.assignedTo,
    tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
    notes: c.notes ?? "",
    lastContactAt: c.lastContactAt ? c.lastContactAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  const rows = (data ?? []).map((r: any) =>
    toContact({
      id: r.id,
      type: r.type,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      phone: r.phone,
      source: r.source,
      status: r.status,
      assignedTo: r.assigned_to,
      tags: r.tags,
      notes: r.notes,
      lastContactAt: r.last_contact_at ? new Date(r.last_contact_at) : null,
      createdAt: new Date(r.created_at),
    }),
  )

  return applyCookies(NextResponse.json(rows))
}

const CreateContactSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.enum(["lead", "buyer", "seller", "investor"]).default("lead"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable().optional().default(null),
  phone: z.string().nullable().optional().default(null),
  source: z.string().min(1).optional().default("Manual"),
  status: z.enum(["new", "contacted", "qualified", "nurturing", "closed"]).optional().default("new"),
  assignedTo: z.string().nullable().optional().default(null),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(""),
  lastContactAt: z.string().datetime().nullable().optional().default(null),
  createdAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = CreateContactSchema.parse(await req.json())

  const id = payload.id ?? crypto.randomUUID()
  const { data: created, error } = await supabase
    .from("contacts")
    .insert({
      id,
      agency_id: tenant.agencyId,
      type: payload.type,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      source: payload.source,
      status: payload.status,
      assigned_to: payload.assignedTo ?? null,
      tags: payload.tags,
      notes: payload.notes,
      last_contact_at: payload.lastContactAt ? new Date(payload.lastContactAt).toISOString() : null,
      created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) {
    return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))
  }

  await writeAuditLog({
    req,
    tenant,
    action: "contact.create",
    entityType: "contact",
    entityId: id,
    after: created,
  })

  return applyCookies(
    NextResponse.json(
      toContact({
        id: created.id,
        type: created.type,
        firstName: created.first_name,
      lastName: created.last_name,
      email: created.email,
      phone: created.phone,
      source: created.source,
      status: created.status,
      assignedTo: created.assigned_to,
      tags: created.tags,
      notes: created.notes,
        lastContactAt: created.last_contact_at ? new Date(created.last_contact_at) : null,
        createdAt: new Date(created.created_at),
      }),
    ),
  )
}
