"use client"

import type { Contact, Property } from "@/lib/mock-data"

export type InspectionType = "move_in" | "move_out"
export type InspectionStatus = "draft" | "in_progress" | "completed"

export type InspectionCondition = "excellent" | "good" | "fair" | "poor" | "na"

export interface InspectionPhoto {
  id: string
  name: string
  mimeType: string
  /**
   * UI-friendly URL to render (usually a signed URL).
   * For persisted photos, prefer `storagePath` and let the server hydrate `dataUrl`.
   */
  dataUrl?: string
  /** Supabase Storage path (private bucket). */
  storagePath?: string
  createdAt: string
}

export interface InspectionChecklistItem {
  id: string
  kind: "walls" | "floor" | "ceiling" | "windows" | "fixture"
  label: string
  condition: InspectionCondition
  notes: string
  photos: InspectionPhoto[]
}

export interface InspectionRoom {
  id: string
  name: string
  items: InspectionChecklistItem[]
}

export interface InspectionMeter {
  reading: string
  notes: string
  photos: InspectionPhoto[]
}

export interface InspectionKeyItem {
  id: string
  label: string
  quantity: number
  notes: string
  photos: InspectionPhoto[]
}

export interface Inspection {
  id: string
  type: InspectionType
  status: InspectionStatus
  propertyId: string
  landlordId: string
  tenantId: string
  scheduledDate: string | null
  startedAt: string | null
  completedAt: string | null
  rooms: InspectionRoom[]
  meters: {
    electricity: InspectionMeter
    gas: InspectionMeter
    water: InspectionMeter
  }
  keys: InspectionKeyItem[]
  generalNotes: string
  createdAt: string
  updatedAt: string
}

export const INSPECTIONS_STORAGE_KEY = "real-estate-platform.inspections.v1"

function generateId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createDefaultInspection(args: {
  property: Property
  landlord: Contact
  tenant: Contact
  type: InspectionType
  scheduledDate?: string | null
}): Inspection {
  const { property, landlord, tenant, type } = args
  const now = new Date().toISOString()

  const defaultRooms: Array<{ name: string; fixtures: string[]; windows?: boolean }> = [
    { name: "Entrée", fixtures: ["Interrupteur", "Prise électrique"], windows: false },
    { name: "Séjour", fixtures: ["Interrupteur", "Prises électriques", "Radiateur"], windows: true },
    { name: "Cuisine", fixtures: ["Évier", "Robinetterie", "Plaques de cuisson", "Hotte"], windows: true },
    { name: "Chambre 1", fixtures: ["Interrupteur", "Prises électriques", "Placard"], windows: true },
    { name: "Salle de bain", fixtures: ["Lavabo", "Baignoire/Douche", "WC", "Miroir"], windows: false },
  ]

  const rooms: InspectionRoom[] = defaultRooms.map((room) => {
    const baseItems: InspectionChecklistItem[] = [
      { id: generateId("ci"), kind: "walls", label: "Murs", condition: "good", notes: "", photos: [] },
      { id: generateId("ci"), kind: "floor", label: "Sol", condition: "good", notes: "", photos: [] },
      { id: generateId("ci"), kind: "ceiling", label: "Plafond", condition: "good", notes: "", photos: [] },
      {
        id: generateId("ci"),
        kind: "windows",
        label: "Fenêtres",
        condition: room.windows ? "good" : "na",
        notes: "",
        photos: [],
      },
      ...room.fixtures.map((fixtureLabel) => ({
        id: generateId("ci"),
        kind: "fixture" as const,
        label: fixtureLabel,
        condition: "good" as const,
        notes: "",
        photos: [],
      })),
    ]

    return {
      id: generateId("r"),
      name: room.name,
      items: baseItems,
    }
  })

  return {
    id: generateId("insp"),
    type,
    status: "draft",
    propertyId: property.id,
    landlordId: landlord.id,
    tenantId: tenant.id,
    scheduledDate: args.scheduledDate ?? null,
    startedAt: null,
    completedAt: null,
    rooms,
    meters: {
      electricity: { reading: "", notes: "", photos: [] },
      gas: { reading: "", notes: "", photos: [] },
      water: { reading: "", notes: "", photos: [] },
    },
    keys: [
      { id: generateId("key"), label: "Clé porte d'entrée", quantity: 2, notes: "", photos: [] },
      { id: generateId("key"), label: "Clé boîte aux lettres", quantity: 1, notes: "", photos: [] },
      { id: generateId("key"), label: "Badge immeuble", quantity: 1, notes: "", photos: [] },
    ],
    generalNotes: "",
    createdAt: now,
    updatedAt: now,
  }
}
