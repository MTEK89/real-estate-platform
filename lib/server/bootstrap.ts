import { contacts, currentAgency, currentUser, properties, tasks } from "@/lib/mock-data"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

let bootstrapped = false

export async function ensureDemoSeed(opts?: { force?: boolean }) {
  if (!opts?.force && process.env.DEMO_MODE !== "true") return
  if (bootstrapped) return

  // Guard against hot-reload races.
  bootstrapped = true

  const supabase = getSupabaseAdmin()

  await supabase.from("agencies").upsert(
    {
      id: currentAgency.id,
      name: currentAgency.name,
    },
    { onConflict: "id" },
  )

  await supabase.from("users").upsert(
    {
      id: currentUser.id,
      email: currentUser.email,
      first_name: currentUser.firstName,
      last_name: currentUser.lastName,
      role: currentUser.role,
    },
    { onConflict: "id" },
  )

  await supabase.from("agency_users").upsert(
    {
      id: `au_${currentAgency.id}_${currentUser.id}`,
      agency_id: currentAgency.id,
      user_id: currentUser.id,
      role: currentUser.role,
    },
    { onConflict: "agency_id,user_id" },
  )

  const { count: contactCount } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", currentAgency.id)

  if (!contactCount) {
    await supabase.from("contacts").insert(
      contacts.map((c) => ({
        id: c.id,
        agency_id: currentAgency.id,
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
        last_contact_at: c.lastContactAt ? new Date(c.lastContactAt).toISOString() : null,
        created_at: new Date(c.createdAt).toISOString(),
      })),
    )
  }

  const { count: propertyCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", currentAgency.id)

  if (!propertyCount) {
    await supabase.from("properties").insert(
      properties.map((p) => ({
        id: p.id,
        agency_id: currentAgency.id,
        reference: p.reference,
        status: p.status,
        type: p.type,
        address: p.address,
        characteristics: p.characteristics,
        price: p.price,
        owner_id: p.ownerId,
        tags: p.tags,
        images: p.images,
        created_at: new Date(p.createdAt).toISOString(),
      })),
    )
  }

  const { count: taskCount } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", currentAgency.id)

  if (!taskCount) {
    await supabase.from("tasks").insert(
      tasks.map((t) => ({
        id: t.id,
        agency_id: currentAgency.id,
        title: t.title,
        description: t.description,
        assigned_to: t.assignedTo,
        related_to: t.relatedTo ?? null,
        priority: t.priority,
        status: t.status,
        due_date: t.dueDate,
        completed_at: t.completedAt ? new Date(t.completedAt).toISOString() : null,
        created_at: new Date(t.createdAt).toISOString(),
      })),
    )
  }
}

export async function ensureTenantSeed(args: { agencyId: string; userId: string }) {
  // Seed tenant data automatically for local/dev so the app is usable immediately.
  if (process.env.NODE_ENV === "production") return

  const { agencyId, userId } = args
  const supabase = getSupabaseAdmin()

  const [{ count: contactCount }, { count: propertyCount }] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
  ])

  if ((contactCount ?? 0) > 0 || (propertyCount ?? 0) > 0) return

  const stamp = Date.now().toString(36)

  const sellerId = `c_demo_${stamp}_seller`
  const buyerId = `c_demo_${stamp}_buyer`
  const leadId = `c_demo_${stamp}_lead`

  await supabase.from("contacts").insert([
    {
      id: sellerId,
      agency_id: agencyId,
      type: "seller",
      first_name: "Emma",
      last_name: "Muller",
      email: `emma.muller+${stamp}@example.com`,
      phone: "+352 621 234 567",
      source: "Referral",
      status: "contacted",
      assigned_to: userId,
      tags: ["seller", "luxembourg"],
      notes: "Wants to sell within 3 months.",
      last_contact_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: buyerId,
      agency_id: agencyId,
      type: "buyer",
      first_name: "Michael",
      last_name: "Chen",
      email: `michael.chen+${stamp}@example.com`,
      phone: "+352 621 123 456",
      source: "Website",
      status: "new",
      assigned_to: userId,
      tags: ["buyer", "luxembourg"],
      notes: "Interested in apartments near city center.",
      last_contact_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: leadId,
      agency_id: agencyId,
      type: "lead",
      first_name: "David",
      last_name: "Schmit",
      email: `david.schmit+${stamp}@example.com`,
      phone: "+352 621 345 678",
      source: "Open House",
      status: "qualified",
      assigned_to: userId,
      tags: ["lead"],
      notes: "Asked for valuation and brochure.",
      last_contact_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ])

  const p1 = `p_demo_${stamp}_001`
  const p2 = `p_demo_${stamp}_002`

  await supabase.from("properties").insert([
    {
      id: p1,
      agency_id: agencyId,
      reference: `PROP-${stamp.toUpperCase()}-001`,
      status: "published",
      type: "apartment",
      address: { street: "10 Avenue Monterey", city: "Luxembourg", postalCode: "L-2163", country: "Luxembourg" },
      characteristics: { surface: 111, rooms: 4, bedrooms: 2, bathrooms: 2, yearBuilt: 2019, condition: "Excellent" },
      price: 895000,
      owner_id: sellerId,
      tags: ["downtown", "modern"],
      images: [],
      created_at: new Date().toISOString(),
    },
    {
      id: p2,
      agency_id: agencyId,
      reference: `PROP-${stamp.toUpperCase()}-002`,
      status: "draft",
      type: "house",
      address: { street: "2 Rue du Fort Bourbon", city: "Luxembourg", postalCode: "L-1249", country: "Luxembourg" },
      characteristics: { surface: 220, rooms: 6, bedrooms: 4, bathrooms: 2, yearBuilt: 2015, condition: "Very Good" },
      price: 1450000,
      owner_id: sellerId,
      tags: ["family-home"],
      images: [],
      created_at: new Date().toISOString(),
    },
  ])

  await supabase.from("tasks").insert([
    {
      id: `t_demo_${stamp}_1`,
      agency_id: agencyId,
      title: "Call seller Emma Muller",
      description: "Follow up on mandate and documents",
      assigned_to: userId,
      related_to: { type: "contact", id: sellerId },
      priority: "high",
      status: "todo",
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      completed_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: `t_demo_${stamp}_2`,
      agency_id: agencyId,
      title: `Prepare brochure for ${p1}`,
      description: "Generate brochure and watermark images",
      assigned_to: userId,
      related_to: { type: "property", id: p1 },
      priority: "medium",
      status: "in_progress",
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      completed_at: null,
      created_at: new Date().toISOString(),
    },
  ])
}
