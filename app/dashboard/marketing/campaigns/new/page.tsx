"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDataStore } from "@/lib/data-store"
import { portals as luxPortals } from "@/lib/mock-data"

function getTodayISODate(): string {
  return new Date().toISOString().split("T")[0]
}

function addDaysISODate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

export default function NewCampaignPage() {
  const router = useRouter()
  const { addCampaign } = useDataStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [objective, setObjective] = useState<"seller_leads" | "buyer_leads" | "open_house" | "brand_awareness">(
    "buyer_leads",
  )
  const [status, setStatus] = useState<"draft" | "active" | "paused" | "completed">("draft")
  const [budgetTotal, setBudgetTotal] = useState("600")
  const [startDate, setStartDate] = useState(getTodayISODate())
  const [endDate, setEndDate] = useState(addDaysISODate(28))
  const [targetAreas, setTargetAreas] = useState("Luxembourg-Ville, Kirchberg")
  const [notes, setNotes] = useState("")

  const [channels, setChannels] = useState<Array<"meta" | "google" | "email" | "portals">>(["meta", "portals"])
  const [selectedPortals, setSelectedPortals] = useState<string[]>(["atHome.lu", "IMMOTOP.LU", "Wortimmo.lu", "vivi.lu"])

  const availablePortals = useMemo(() => luxPortals.map((p) => p.name), [])

  const toggleChannel = (channel: "meta" | "google" | "email" | "portals") => {
    setChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]))
  }

  const togglePortal = (portal: string) => {
    setSelectedPortals((prev) => (prev.includes(portal) ? prev.filter((p) => p !== portal) : [...prev, portal]))
  }

  const canSubmit = name.trim().length > 0 && Number.parseFloat(budgetTotal) > 0 && startDate && endDate

  const handleSave = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      addCampaign({
        name: name.trim(),
        objective,
        status,
        budgetTotal: Number.parseFloat(budgetTotal),
        currency: "EUR",
        startDate,
        endDate,
        targetAreas: targetAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        channels,
        portals: channels.includes("portals") ? selectedPortals : [],
        metrics: { spend: 0, leads: 0, visits: 0, offers: 0 },
        notes: notes.trim() || undefined,
      })

      router.push("/dashboard/marketing")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DashboardHeader title="Create Campaign" description="Campaign planner (MVP) with manual KPIs." />

      <div className="p-6 space-y-6">
        <Link
          href="/dashboard/marketing"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketing
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: PROP-001 - Just Listed" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Objective</Label>
                    <Select value={objective} onValueChange={(v) => setObjective(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seller_leads">Seller leads</SelectItem>
                        <SelectItem value="buyer_leads">Buyer leads</SelectItem>
                        <SelectItem value="open_house">Open house</SelectItem>
                        <SelectItem value="brand_awareness">Brand awareness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Total Budget (€)</Label>
                    <Input type="number" value={budgetTotal} onChange={(e) => setBudgetTotal(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Areas</Label>
                    <Input
                      value={targetAreas}
                      onChange={(e) => setTargetAreas(e.target.value)}
                      placeholder="Comma-separated (Ex: Luxembourg-Ville, Kirchberg)"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channels</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <Checkbox checked={channels.includes("meta")} onCheckedChange={() => toggleChannel("meta")} />
                  <div>
                    <div className="font-medium text-sm">Meta Ads</div>
                    <div className="text-xs text-muted-foreground">Facebook / Instagram</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <Checkbox checked={channels.includes("google")} onCheckedChange={() => toggleChannel("google")} />
                  <div>
                    <div className="font-medium text-sm">Google Ads</div>
                    <div className="text-xs text-muted-foreground">Search / Display</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <Checkbox checked={channels.includes("email")} onCheckedChange={() => toggleChannel("email")} />
                  <div>
                    <div className="font-medium text-sm">Email</div>
                    <div className="text-xs text-muted-foreground">Newsletter / list</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <Checkbox checked={channels.includes("portals")} onCheckedChange={() => toggleChannel("portals")} />
                  <div>
                    <div className="font-medium text-sm">Portals</div>
                    <div className="text-xs text-muted-foreground">Lux market</div>
                  </div>
                </label>
              </CardContent>
            </Card>

            {channels.includes("portals") ? (
              <Card>
                <CardHeader>
                  <CardTitle>Portals</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {availablePortals.map((p) => (
                    <label key={p} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                      <Checkbox checked={selectedPortals.includes(p)} onCheckedChange={() => togglePortal(p)} />
                      <span className="text-sm font-medium">{p}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Budget split, targeting notes, landing page, etc."
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">€{Number.parseFloat(budgetTotal || "0").toLocaleString("fr-FR")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dates</span>
                  <span className="font-medium">
                    {startDate} → {endDate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Channels</span>
                  <span className="font-medium">{channels.map((c) => c.toUpperCase()).join(", ")}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button onClick={handleSave} disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Campaign
                  </>
                )}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/marketing">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
