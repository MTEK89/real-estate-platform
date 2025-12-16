import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import type { Invoice } from "@/lib/mock-data"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

function toInvoice(row: any): Invoice {
  const payload = (row.payload ?? {}) as Partial<Invoice>

  return {
    id: String(row.id),
    contactId: String(row.contact_id ?? payload.contactId ?? ""),
    dealId: row.deal_id ? String(row.deal_id) : null,
    invoiceNumber: String(row.invoice_number ?? payload.invoiceNumber ?? ""),
    issueDate: String(row.issue_date ?? payload.issueDate ?? ""),
    dueDate: String(row.due_date ?? payload.dueDate ?? ""),
    currency: (row.currency ?? payload.currency ?? "EUR") as Invoice["currency"],
    supplier: (payload.supplier ?? { name: "" }) as Invoice["supplier"],
    customer: (payload.customer ?? { name: "" }) as Invoice["customer"],
    items: (payload.items ?? []) as Invoice["items"],
    totals: (payload.totals ?? { subtotalExclVat: 0, vatTotal: 0, totalInclVat: 0 }) as Invoice["totals"],
    payment: (payload.payment ?? {}) as Invoice["payment"],
    notes: payload.notes,
    status: (row.status ?? payload.status ?? "draft") as Invoice["status"],
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : (payload.paidAt ?? null),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : payload.createdAt ?? new Date().toISOString(),
    fileUrl: row.file_path ?? (payload as any).fileUrl ?? null,
    generatedAt: row.generated_at ? new Date(row.generated_at).toISOString() : (payload as any).generatedAt ?? null,
  } as Invoice
}

const InvoiceSchema = z.object({
  id: z.string().min(1).optional(),
  contactId: z.string().min(1),
  dealId: z.string().min(1).nullable().optional().default(null),
  invoiceNumber: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  currency: z.literal("EUR").default("EUR"),
  supplier: z.record(z.any()),
  customer: z.record(z.any()),
  items: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().finite(),
      unitPrice: z.number().finite(),
      vatRate: z.number().finite(),
    }),
  ),
  totals: z.object({
    subtotalExclVat: z.number().finite(),
    vatTotal: z.number().finite(),
    totalInclVat: z.number().finite(),
  }),
  payment: z.record(z.any()).default({}),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  paidAt: z.string().datetime().nullable().optional().default(null),
  createdAt: z.string().datetime().optional(),
  fileUrl: z.string().nullable().optional().default(null),
  generatedAt: z.string().datetime().nullable().optional().default(null),
})

export async function GET(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .order("created_at", { ascending: false })

  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  return applyCookies(NextResponse.json((data ?? []).map(toInvoice)))
}

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const payload = InvoiceSchema.parse(await req.json())
  const id = payload.id ?? crypto.randomUUID()

  const storedPayload: Record<string, unknown> = {
    ...payload,
    id,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  }

  const { data: created, error } = await supabase
    .from("invoices")
    .insert({
      id,
      agency_id: tenant.agencyId,
      contact_id: payload.contactId,
      deal_id: payload.dealId ?? null,
      invoice_number: payload.invoiceNumber,
      issue_date: payload.issueDate,
      due_date: payload.dueDate,
      currency: payload.currency,
      status: payload.status,
      paid_at: payload.paidAt ? new Date(payload.paidAt).toISOString() : null,
      payload: storedPayload,
      file_path: payload.fileUrl ?? null,
      generated_at: payload.generatedAt ? new Date(payload.generatedAt).toISOString() : null,
      created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : undefined,
    })
    .select("*")
    .single()

  if (error || !created) return applyCookies(NextResponse.json({ error: error?.message || "Create failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "invoice.create",
    entityType: "invoice",
    entityId: id,
    after: created,
  })

  return applyCookies(NextResponse.json(toInvoice(created)))
}

