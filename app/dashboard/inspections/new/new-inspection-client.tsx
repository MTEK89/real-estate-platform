"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDataStore } from "@/lib/data-store"
import { createDefaultInspection, type InspectionType } from "@/lib/inspections"
import { ArrowLeft } from "lucide-react"

export function NewInspectionClient({
  propertyId: initialPropertyId,
  landlordId: initialLandlordId,
  tenantId: initialTenantId,
  type: initialType,
}: {
  propertyId: string
  landlordId: string
  tenantId: string
  type: InspectionType
}) {
  const router = useRouter()
  const { contacts, properties, getContactById, getPropertyById, addInspection } = useDataStore()

  const [propertyId, setPropertyId] = useState(initialPropertyId)
  const [landlordId, setLandlordId] = useState(initialLandlordId)
  const [tenantId, setTenantId] = useState(initialTenantId)
  const [type, setType] = useState<InspectionType>(initialType)
  const [scheduledDate, setScheduledDate] = useState<string>("")
  const [notes, setNotes] = useState("")

  const selectedProperty = useMemo(
    () => (propertyId ? getPropertyById(propertyId) : undefined),
    [propertyId, getPropertyById],
  )
  const ownerFromProperty = selectedProperty?.ownerId || ""

  const effectiveLandlordId = landlordId || ownerFromProperty
  const canCreate = Boolean(propertyId && effectiveLandlordId && tenantId)

  const handleCreate = () => {
    const property = getPropertyById(propertyId)
    const landlord = getContactById(effectiveLandlordId)
    const tenant = getContactById(tenantId)
    if (!property || !landlord || !tenant) return

    const now = new Date().toISOString()
    const inspection = createDefaultInspection({
      property,
      landlord,
      tenant,
      type,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
    })

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = inspection
    const created = addInspection({
      ...payload,
      status: "in_progress",
      startedAt: now,
      generalNotes: notes,
    })
    router.push(`/dashboard/inspections/${created.id}`)
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="New Inspection"
        description="Create a move-in / move-out walkthrough (mock-local)."
        actions={
          <Link href="/dashboard/inspections">
            <Button variant="outline" className="bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Setup</CardTitle>
              <CardDescription>Select parties and inspection type, then start the walkthrough.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Inspection type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as InspectionType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="move_in">Move-in</SelectItem>
                      <SelectItem value="move_out">Move-out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scheduled date/time (optional)</Label>
                  <Input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Property *</Label>
                <Select
                  value={propertyId}
                  onValueChange={(v) => {
                    setPropertyId(v)
                    const p = getPropertyById(v)
                    if (p?.ownerId) setLandlordId(p.ownerId)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.reference} — {p.address.street}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Landlord / Owner *</Label>
                  <Select value={effectiveLandlordId} onValueChange={setLandlordId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select landlord" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tenant *</Label>
                  <Select value={tenantId} onValueChange={setTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for the walkthrough…"
                  className="min-h-[90px]"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCreate} disabled={!canCreate}>
                  Start walkthrough
                </Button>
                <Link href="/dashboard/inspections">
                  <Button variant="outline" className="bg-transparent">
                    Cancel
                  </Button>
                </Link>
              </div>

              {!canCreate && <p className="text-sm text-muted-foreground">Select a property, landlord, and tenant.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
