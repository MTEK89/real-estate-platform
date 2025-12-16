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
import { ArrowLeft } from "lucide-react"
import { useDataStore } from "@/lib/data-store"
import { Badge } from "@/components/ui/badge"

export default function NewContactPage() {
  const router = useRouter()
  const { addContact, addTask, currentUserId } = useDataStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; name: string }>>([])

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [contactType, setContactType] = useState("")
  const [source, setSource] = useState("")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [preferredPropertyTypes, setPreferredPropertyTypes] = useState("")
  const [preferredCities, setPreferredCities] = useState("")
  const [notes, setNotes] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [tags, setTags] = useState("")

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
    if (!firstName || !lastName || !contactType) return

    setIsSubmitting(true)
    const effectiveAssignedTo = assignedTo || currentUserId || "u1"

    // Add contact to data store
    const newContact = addContact({
      type: contactType as "lead" | "buyer" | "seller" | "investor",
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      source: source || "Website",
      status: "new",
      assignedTo: effectiveAssignedTo,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes,
      lastContactAt: null,
    })

    // Auto-create a follow-up task for new contacts
    addTask({
      title: `Initial contact with ${firstName} ${lastName}`,
      description: `New ${contactType} added. Make initial contact to understand their needs.`,
      assignedTo: effectiveAssignedTo,
      relatedTo: { type: "contact", id: newContact.id },
      priority: contactType === "lead" ? "high" : "medium",
      status: "todo",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Tomorrow
      completedAt: null,
    })

    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push("/dashboard/contacts")
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Add New Contact" description="Create a new contact in your CRM" />

      <div className="flex-1 p-6">
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+352 621 123 456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="type">Contact Type *</Label>
                      <Select value={contactType} onValueChange={setContactType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="buyer">Buyer</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="investor">Investor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Select value={source} onValueChange={setSource}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="atHome.lu">atHome.lu</SelectItem>
                          <SelectItem value="IMMOTOP.LU">IMMOTOP.LU</SelectItem>
                          <SelectItem value="Wortimmo.lu">Wortimmo.lu</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Open House">Open House</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferences (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="budgetMin">Minimum Budget (€)</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        placeholder="0"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budgetMax">Maximum Budget (€)</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        placeholder="0"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="propertyTypes">Property Types</Label>
                      <Select value={preferredPropertyTypes} onValueChange={setPreferredPropertyTypes}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cities">Preferred Cities</Label>
                      <Input
                        id="cities"
                        placeholder="Luxembourg, Esch-sur-Alzette, Differdange, etc."
                        value={preferredCities}
                        onChange={(e) => setPreferredCities(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add any additional notes about this contact..."
                    className="min-h-[120px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment</CardTitle>
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
                  <p className="mt-2 text-xs text-muted-foreground">
                    Assign this contact to an agent for follow-up. A task will be automatically created.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Add tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">Add tags to help segment and filter contacts.</p>
                  {tags && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting || !firstName || !lastName || !contactType}>
                  {isSubmitting ? "Creating..." : "Create Contact"}
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
