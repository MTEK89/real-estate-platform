import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { writeAuditLog } from "@/lib/server/audit"
import { requireTenant } from "@/lib/server/require-tenant"

export const runtime = "nodejs"

const ImportSchema = z.object({
  csv: z.string().min(1),
})

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  const pushCell = () => {
    row.push(cell)
    cell = ""
  }

  const pushRow = () => {
    // Skip empty trailing row
    if (row.length === 1 && row[0].trim() === "") {
      row = []
      return
    }
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1]
        if (next === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ",") {
      pushCell()
      continue
    }

    if (ch === "\n") {
      pushCell()
      pushRow()
      continue
    }

    if (ch === "\r") {
      // Handle CRLF
      const next = text[i + 1]
      if (next === "\n") i++
      pushCell()
      pushRow()
      continue
    }

    cell += ch
  }

  pushCell()
  pushRow()
  return rows
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, "_")
}

const allowedTypes = new Set(["lead", "buyer", "seller", "investor"])
const allowedStatuses = new Set(["new", "contacted", "qualified", "nurturing", "closed"])

export async function POST(req: NextRequest) {
  const ctx = await requireTenant(req)
  if ("response" in ctx) return ctx.response
  const { supabase, tenant, applyCookies } = ctx

  const { csv } = ImportSchema.parse(await req.json())
  const rows = parseCsv(csv)
  if (rows.length < 2) {
    return applyCookies(NextResponse.json({ error: "CSV must include a header row and at least 1 data row." }, { status: 400 }))
  }

  const headers = rows[0].map(normalizeHeader)
  const dataRows = rows.slice(1)

  const contacts = dataRows
    .map((r) => {
      const record: Record<string, string> = {}
      for (let i = 0; i < headers.length; i++) record[headers[i]] = (r[i] ?? "").trim()

      const firstName = record.first_name || record.firstname || record.first || record.prenom || record.prénom || ""
      const lastName = record.last_name || record.lastname || record.last || record.nom || ""
      if (!firstName || !lastName) return null

      const typeRaw = (record.type || "lead").toLowerCase()
      const statusRaw = (record.status || "new").toLowerCase()

      const tagsRaw = record.tags || ""
      const tags = tagsRaw
        ? tagsRaw
            .split(/[;,]/g)
            .map((t) => t.trim())
            .filter(Boolean)
        : []

      return {
        type: allowedTypes.has(typeRaw) ? typeRaw : "lead",
        firstName,
        lastName,
        email: record.email || null,
        phone: record.phone || record.telephone || record.téléphone || null,
        source: record.source || "CSV Import",
        status: allowedStatuses.has(statusRaw) ? statusRaw : "new",
        assignedTo: record.assigned_to || record.assignedto || null,
        tags,
        notes: record.notes || "",
      }
    })
    .filter(Boolean) as Array<{
      type: string
      firstName: string
      lastName: string
      email: string | null
      phone: string | null
      source: string
      status: string
      assignedTo: string | null
      tags: string[]
      notes: string
    }>

  if (contacts.length === 0) {
    return applyCookies(NextResponse.json({ error: "No valid rows found. Need firstName + lastName." }, { status: 400 }))
  }

  if (contacts.length > 1000) {
    return applyCookies(NextResponse.json({ error: "Too many rows. Max 1000 contacts per import." }, { status: 400 }))
  }

  const { error } = await supabase.from("contacts").insert(
    contacts.map((c) => ({
      id: crypto.randomUUID(),
      agency_id: tenant.agencyId,
      type: c.type,
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email,
      phone: c.phone,
      source: c.source,
      status: c.status,
      assigned_to: c.assignedTo,
      tags: c.tags,
      notes: c.notes,
    })),
  )
  if (error) return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }))

  await writeAuditLog({
    req,
    tenant,
    action: "contact.import",
    entityType: "contact",
    entityId: null,
    after: { count: contacts.length },
  })

  return applyCookies(NextResponse.json({ ok: true, imported: contacts.length }))
}
