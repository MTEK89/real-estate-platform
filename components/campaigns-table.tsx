"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Pause, Play, CheckCircle2, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/data-store"
import type { MarketingCampaign } from "@/lib/mock-data"

const objectiveLabel: Record<MarketingCampaign["objective"], string> = {
  seller_leads: "Seller leads",
  buyer_leads: "Buyer leads",
  open_house: "Open house",
  brand_awareness: "Brand awareness",
}

const statusStyle: Record<MarketingCampaign["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-600",
  paused: "bg-amber-500/10 text-amber-600",
  completed: "bg-sky-500/10 text-sky-600",
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount)
}

export function CampaignsTable() {
  const { campaigns, updateCampaign } = useDataStore()
  const [editing, setEditing] = useState<MarketingCampaign | null>(null)
  const [spend, setSpend] = useState("0")
  const [leads, setLeads] = useState("0")
  const [visits, setVisits] = useState("0")
  const [offers, setOffers] = useState("0")

  const sorted = useMemo(() => {
    return [...campaigns].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [campaigns])

  const openEdit = (campaign: MarketingCampaign) => {
    setEditing(campaign)
    setSpend(String(campaign.metrics.spend))
    setLeads(String(campaign.metrics.leads))
    setVisits(String(campaign.metrics.visits))
    setOffers(String(campaign.metrics.offers))
  }

  const saveEdit = () => {
    if (!editing) return
    updateCampaign(editing.id, {
      metrics: {
        spend: Number.parseFloat(spend) || 0,
        leads: Number.parseInt(leads, 10) || 0,
        visits: Number.parseInt(visits, 10) || 0,
        offers: Number.parseInt(offers, 10) || 0,
      },
    })
    setEditing(null)
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Objective</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Portals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">KPIs</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No campaigns yet
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {campaign.targetAreas.slice(0, 2).join(", ")}
                          {campaign.targetAreas.length > 2 ? "…" : ""}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{objectiveLabel[campaign.objective]}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(campaign.budgetTotal, campaign.currency)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {campaign.startDate} → {campaign.endDate}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {campaign.channels.map((c) => (
                        <Badge key={c} variant="secondary" className="bg-muted text-muted-foreground">
                          {c.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {campaign.portals.length ? campaign.portals.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusStyle[campaign.status]}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <div className="space-y-0.5">
                      <div className="font-medium">{formatCurrency(campaign.metrics.spend, campaign.currency)} spend</div>
                      <div className="text-muted-foreground">
                        {campaign.metrics.leads} leads · {campaign.metrics.visits} visits · {campaign.metrics.offers} offers
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(campaign)}>Update results</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status !== "active" ? (
                          <DropdownMenuItem onClick={() => updateCampaign(campaign.id, { status: "active" })}>
                            <Play className="mr-2 h-4 w-4" />
                            Mark active
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => updateCampaign(campaign.id, { status: "paused" })}>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => updateCampaign(campaign.id, { status: "completed" })}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark completed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update results</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Spend (€)</Label>
              <Input type="number" value={spend} onChange={(e) => setSpend(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Leads</Label>
              <Input type="number" value={leads} onChange={(e) => setLeads(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Visits</Label>
              <Input type="number" value={visits} onChange={(e) => setVisits(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Offers</Label>
              <Input type="number" value={offers} onChange={(e) => setOffers(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

