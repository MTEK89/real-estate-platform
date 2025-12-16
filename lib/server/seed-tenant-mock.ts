import { contacts, properties, tasks } from "@/lib/mock-data"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

function chunk<T>(items: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function demoId(agencyId: string, kind: string, originalId: string) {
  return `demo_${agencyId}_${kind}_${originalId}`
}

function safeIso(value: string | null | undefined) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export async function seedTenantMockData(args: { agencyId: string; userId: string; scope?: "properties" | "full" }) {
  const { agencyId, userId, scope = "properties" } = args
  const supabase = getSupabaseAdmin()

  const contactIdByOriginal = new Map<string, string>()
  for (const c of contacts) contactIdByOriginal.set(c.id, demoId(agencyId, "contact", c.id))

  const propertyIdByOriginal = new Map<string, string>()
  for (const p of properties) propertyIdByOriginal.set(p.id, demoId(agencyId, "property", p.id))

  const seededContacts = contacts.map((c) => ({
    id: demoId(agencyId, "contact", c.id),
    agency_id: agencyId,
    type: c.type,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email ?? null,
    phone: c.phone ?? null,
    source: c.source,
    status: c.status,
    assigned_to: userId,
    tags: c.tags ?? [],
    notes: c.notes ?? "",
    last_contact_at: safeIso(c.lastContactAt),
    created_at: safeIso(c.createdAt) ?? new Date().toISOString(),
  }))

  const fallbackOwnerId = seededContacts[0]?.id ?? userId
  const seededProperties = properties.map((p) => ({
    id: demoId(agencyId, "property", p.id),
    agency_id: agencyId,
    reference: p.reference,
    status: p.status,
    type: p.type,
    address: p.address ?? {},
    characteristics: p.characteristics ?? {},
    price: p.price ?? 0,
    owner_id: contactIdByOriginal.get(p.ownerId) ?? fallbackOwnerId,
    tags: p.tags ?? [],
    images: p.images ?? [],
    created_at: safeIso(p.createdAt) ?? new Date().toISOString(),
  }))

  const seededTasks =
    scope === "full"
      ? tasks.map((t) => {
          const related = t.relatedTo ?? null
          const relatedTo =
            related && typeof related === "object" && "type" in related && "id" in related
              ? (() => {
                  const type = String((related as any).type)
                  const id = String((related as any).id)
                  if (type === "contact") return { type, id: contactIdByOriginal.get(id) ?? id }
                  if (type === "property") return { type, id: propertyIdByOriginal.get(id) ?? id }
                  return { type, id }
                })()
              : null

          return {
            id: demoId(agencyId, "task", t.id),
            agency_id: agencyId,
            title: t.title,
            description: t.description ?? "",
            assigned_to: userId,
            related_to: relatedTo,
            priority: t.priority,
            status: t.status,
            due_date: t.dueDate,
            completed_at: safeIso(t.completedAt),
            created_at: safeIso(t.createdAt) ?? new Date().toISOString(),
          }
        })
      : []

  const res: { contacts: number; properties: number; tasks: number } = {
    contacts: 0,
    properties: 0,
    tasks: 0,
  }

  for (const batch of chunk(seededContacts, 250)) {
    const { error } = await supabase.from("contacts").upsert(batch, { onConflict: "id" })
    if (error) throw new Error(`contacts seed failed: ${error.message}`)
    res.contacts += batch.length
  }

  for (const batch of chunk(seededProperties, 250)) {
    const { error } = await supabase.from("properties").upsert(batch, { onConflict: "id" })
    if (error) throw new Error(`properties seed failed: ${error.message}`)
    res.properties += batch.length
  }

  for (const batch of chunk(seededTasks, 250)) {
    const { error } = await supabase.from("tasks").upsert(batch, { onConflict: "id" })
    if (error) throw new Error(`tasks seed failed: ${error.message}`)
    res.tasks += batch.length
  }

  return res
}

