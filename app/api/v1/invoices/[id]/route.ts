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

const PatchSchema = z.object({
  contactId: z.string().min(1).optional(),
  dealId: z.string().min(1).nullable().optional(),
  invoiceNumber: z.string().min(1).optional(),
  issueDate: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
  currency: z.literal("EUR").optional(),
  supplier: z.record(z.any()).optional(),
  customer: z.record(z.any()).optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().finite(),
        unitPrice: z.number().finite(),
        vatRate: z.number().finite(),
      }),
    )
    .optional(),
  totals: z
    .object({
      subtotalExclVat: z.number().finite(),
      vatTotal: z.number().finite(),
      totalInclVat: z.number().finite(),
    })
    .optional(),
  payment: z.record(z.any()).optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  paidAt: z.string().datetime().nullable().optional(),
  payload: z.record(z.any()).optional(),
  fileUrl: z.string().nullable().optional(),
  generatedAt: z.string().datetime().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params
  const patch = PatchSchema.parse(await req.json())

  const { data: before } = await supabase
    .from("invoices")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const currentPayload = (before as any)?.payload ?? {}
  const nextPayload =
    patch.payload ??
    ({
      ...currentPayload,
      ...(patch.contactId !== undefined ? { contactId: patch.contactId } : null),
      ...(patch.dealId !== undefined ? { dealId: patch.dealId } : null),
      ...(patch.invoiceNumber !== undefined ? { invoiceNumber: patch.invoiceNumber } : null),
      ...(patch.issueDate !== undefined ? { issueDate: patch.issueDate } : null),
      ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : null),
      ...(patch.currency !== undefined ? { currency: patch.currency } : null),
      ...(patch.supplier !== undefined ? { supplier: patch.supplier } : null),
      ...(patch.customer !== undefined ? { customer: patch.customer } : null),
      ...(patch.items !== undefined ? { items: patch.items } : null),
      ...(patch.totals !== undefined ? { totals: patch.totals } : null),
      ...(patch.payment !== undefined ? { payment: patch.payment } : null),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? undefined } : null),
      ...(patch.status !== undefined ? { status: patch.status } : null),
      ...(patch.paidAt !== undefined ? { paidAt: patch.paidAt } : null),
      ...(patch.fileUrl !== undefined ? { fileUrl: patch.fileUrl } : null),
      ...(patch.generatedAt !== undefined ? { generatedAt: patch.generatedAt } : null),
    } as Record<string, unknown>)

  const { data: updated, error } = await supabase
    .from("invoices")
    .update({
      contact_id: patch.contactId,
      deal_id: patch.dealId,
      invoice_number: patch.invoiceNumber,
      issue_date: patch.issueDate,
      due_date: patch.dueDate,
      currency: patch.currency,
      status: patch.status,
      paid_at: patch.paidAt === undefined ? undefined : patch.paidAt ? new Date(patch.paidAt).toISOString() : null,
      payload: nextPayload,
      file_path: patch.fileUrl === undefined ? undefined : patch.fileUrl,
      generated_at:
        patch.generatedAt === undefined ? undefined : patch.generatedAt ? new Date(patch.generatedAt).toISOString() : null,
    })
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .select("*")
    .single()

  if (error || !updated) return applyCookies(NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "invoice.update",
    entityType: "invoice",
    entityId: id,
    before,
    after: updated,
  })

  return applyCookies(NextResponse.json(toInvoice(updated)))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { id } = await params

  const { data: before } = await supabase
    .from("invoices")
    .select("*")
    .eq("agency_id", tenant.agencyId)
    .eq("id", id)
    .single()

  const { error } = await supabase.from("invoices").delete().eq("agency_id", tenant.agencyId).eq("id", id)
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "invoice.delete",
    entityType: "invoice",
    entityId: id,
    before,
  })

  return applyCookies(NextResponse.json({ ok: true }))
}

