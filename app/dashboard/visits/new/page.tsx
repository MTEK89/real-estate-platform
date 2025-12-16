"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useDataStore } from "@/lib/data-store"
import { ArrowLeft, Calendar, Sparkles } from "lucide-react"

export default function NewVisitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { contacts, properties, addVisit, currentUserId } = useDataStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendReminder, setSendReminder] = useState(true)
  const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; name: string }>>([])

  // Form state
  const [selectedProperty, setSelectedProperty] = useState("")
  const [selectedContact, setSelectedContact] = useState("")
  const [visitDate, setVisitDate] = useState("")
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("11:00")
  const [notes, setNotes] = useState("")
  const [agentId, setAgentId] = useState("")

  useEffect(() => {
    const contactId = searchParams.get("contactId")
    const propertyId = searchParams.get("propertyId")
    const date = searchParams.get("date")

    if (contactId) setSelectedContact(contactId)
    if (propertyId) setSelectedProperty(propertyId)
    if (date) setVisitDate(date)
  }, [searchParams])

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
    if (agentId) return
    if (currentUserId) setAgentId(currentUserId)
  }, [agentId, currentUserId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProperty || !selectedContact || !visitDate) return

    setIsSubmitting(true)
    const effectiveAgentId = agentId || currentUserId || "u1"

    // Create the visit using the data store (will also auto-create a task)
    addVisit({
      propertyId: selectedProperty,
      contactId: selectedContact,
      agentId: effectiveAgentId,
      date: visitDate,
      startTime,
      endTime,
      status: "scheduled",
      confirmationStatus: "pending",
      notes,
    })

    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push("/dashboard/visits")
  }

  const handleQuickSchedule = (daysFromNow: number, time: string) => {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    setVisitDate(date.toISOString().split("T")[0])
    setStartTime(time)
    const [hours, minutes] = time.split(":")
    setEndTime(`${String(Number(hours) + 1).padStart(2, "0")}:${minutes}`)
  }

  const availableContacts = contacts.filter((c) => c.type === "buyer" || c.type === "lead")
  const availableProperties = properties.filter((p) => p.status === "published" || p.status === "under_offer")

  const selectedContactData = contacts.find((c) => c.id === selectedContact)
  const selectedPropertyData = properties.find((p) => p.id === selectedProperty)

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Schedule Visit" description="Create a new property visit appointment" />

      <div className="flex-1 p-6">
        <Link
          href="/dashboard/visits"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Visits
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Visit Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Visit Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="property">Property *</Label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProperties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.reference} - {property.address.street}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPropertyData && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="font-medium">{selectedPropertyData.address.street}</span>
                        </div>
                        <p className="text-muted-foreground">
                          {selectedPropertyData.characteristics.surface}m² |{" "}
                          {selectedPropertyData.characteristics.rooms} rooms | €
                          {selectedPropertyData.price.toLocaleString("de-DE")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact *</Label>
                    <Select value={selectedContact} onValueChange={setSelectedContact}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName} - {contact.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedContactData && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="font-medium">
                            {selectedContactData.firstName} {selectedContactData.lastName}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {selectedContactData.email} | {selectedContactData.phone}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input id="date" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes or special instructions for the visit..."
                      className="min-h-[100px]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sendConfirmation" defaultChecked />
                    <label
                      htmlFor="sendConfirmation"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send confirmation email to contact
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sendReminder" checked={sendReminder} onCheckedChange={(c) => setSendReminder(!!c)} />
                    <label
                      htmlFor="sendReminder"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send reminder 24 hours before visit
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="addToCalendar" defaultChecked />
                    <label
                      htmlFor="addToCalendar"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Add to calendar
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={agentId} onValueChange={setAgentId}>
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
                  <p className="mt-2 text-xs text-muted-foreground">Agent responsible for conducting this visit.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Quick Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-sm bg-transparent"
                    onClick={() => handleQuickSchedule(1, "09:00")}
                  >
                    Tomorrow morning (9:00 AM)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-sm bg-transparent"
                    onClick={() => handleQuickSchedule(1, "14:00")}
                  >
                    Tomorrow afternoon (2:00 PM)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-sm bg-transparent"
                    onClick={() => handleQuickSchedule(5, "10:00")}
                  >
                    This weekend (10:00 AM)
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-800">
                    A task will be automatically created for this visit and will appear in your Tasks page.
                  </p>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting || !selectedProperty || !selectedContact || !visitDate}>
                  {isSubmitting ? "Scheduling..." : "Schedule Visit"}
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
