"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDataStore } from "@/lib/data-store"
import { ArrowLeft } from "lucide-react"

export default function NewDealPage() {
  const router = useRouter()
  const { contacts, properties, addDeal, currentUserId } = useDataStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; name: string }>>([])

  // Form state
  const [selectedProperty, setSelectedProperty] = useState("")
  const [selectedContact, setSelectedContact] = useState("")
  const [dealType, setDealType] = useState<"sale" | "rental">("sale")
  const [initialStage, setInitialStage] = useState<"lead" | "visit" | "offer" | "negotiation">("lead")
  const [priceOffered, setPriceOffered] = useState("")
  const [assignedTo, setAssignedTo] = useState("")

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/v1/team/members")
        const json = (await res.json().catch(() => [])) as any[]
        if (!res.ok || !Array.isArray(json)) return
        if (cancelled) return
        setTeamMembers(
          json
            .map((m) => ({
              userId: String(m?.userId || ""),
              name:
                [m?.profile?.firstName, m?.profile?.lastName].filter(Boolean).join(" ") ||
                (typeof m?.profile?.email === "string" ? m.profile.email : "") ||
                "Member",
            }))
            .filter((m) => m.userId),
        )
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (assignedTo) return
    if (currentUserId) setAssignedTo(currentUserId)
  }, [assignedTo, currentUserId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProperty || !selectedContact) return

    setIsSubmitting(true)
    const effectiveAssignedTo = assignedTo || currentUserId || "u1"

    // Create the deal using the data store
    addDeal({
      propertyId: selectedProperty,
      buyerId: selectedContact,
      assignedTo: effectiveAssignedTo,
      type: dealType,
      status: initialStage,
      priceOffered: priceOffered ? Number(priceOffered) : null,
      priceAccepted: null,
      commissionAmount: null,
    })

    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push("/dashboard/pipeline")
  }

  const availableContacts = contacts.filter((c) => c.type === "buyer" || c.type === "investor" || c.type === "lead")
  const availableProperties = properties.filter(
    (p) => p.status === "published" || p.status === "under_offer" || p.status === "draft",
  )

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Create Deal" description="Start tracking a new deal in your pipeline" />

      <div className="flex-1 p-6">
        <Link
          href="/dashboard/pipeline"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pipeline
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Deal Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Deal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="property">Property</Label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProperties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.reference} - {property.address.street} (€{property.price.toLocaleString("de-DE")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyer">Buyer / Interested Party</Label>
                    <Select value={selectedContact} onValueChange={setSelectedContact}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName} ({contact.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="type">Deal Type</Label>
                      <Select value={dealType} onValueChange={(v) => setDealType(v as "sale" | "rental")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">Sale</SelectItem>
                          <SelectItem value="rental">Rental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stage">Initial Stage</Label>
                      <Select
                        value={initialStage}
                        onValueChange={(v) => setInitialStage(v as "lead" | "visit" | "offer" | "negotiation")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="visit">Visit</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Details (Optional) */}
              <Card>
                <CardHeader>
                  <CardTitle>Offer Details (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="priceOffered">Offered Price (€)</Label>
                      <Input
                        id="priceOffered"
                        type="number"
                        placeholder="0"
                        value={priceOffered}
                        onChange={(e) => setPriceOffered(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit">Deposit Amount (€)</Label>
                      <Input id="deposit" type="number" placeholder="0" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conditions">Conditions</Label>
                    <Textarea
                      id="conditions"
                      placeholder="Any conditions attached to the offer..."
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Additional notes about this deal..." className="min-h-[100px]" />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-muted-foreground">Agent responsible for this deal.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expected Close Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input type="date" />
                  <p className="mt-2 text-xs text-muted-foreground">Estimated closing date for forecasting.</p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-800">
                    A follow-up task will be automatically created when this deal is added to your pipeline.
                  </p>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting || !selectedProperty || !selectedContact}>
                  {isSubmitting ? "Creating..." : "Create Deal"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
