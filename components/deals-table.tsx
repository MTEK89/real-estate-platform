"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/data-store"
import { MoreHorizontal, ArrowRight, Phone, Mail, Calendar } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  lead: "bg-slate-100 text-slate-700",
  visit: "bg-blue-100 text-blue-700",
  offer: "bg-amber-100 text-amber-700",
  negotiation: "bg-orange-100 text-orange-700",
  contract: "bg-purple-100 text-purple-700",
  notary: "bg-indigo-100 text-indigo-700",
  closed: "bg-emerald-100 text-emerald-700",
}

interface DealsTableProps {
  pipelineType: "sale" | "rental"
}

export function DealsTable({ pipelineType }: DealsTableProps) {
  const { deals, getContactById, getPropertyById, moveDealToStage } = useDataStore()

  const filteredDeals = deals.filter((d) => d.type === pipelineType)

  const formatCurrency = (value: number | null) => {
    if (!value) return "-"
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStageLabel = (status: string) => {
    if (pipelineType === "rental") {
      const rentalLabels: Record<string, string> = {
        lead: "Lead",
        visit: "Visit",
        offer: "Application",
        negotiation: "Background Check",
        contract: "Lease Signing",
        closed: "Move-in",
      }
      return rentalLabels[status] || status
    }
    return status
  }

  const getNextStage = (currentStatus: string): string | null => {
    const saleStages = ["lead", "visit", "offer", "negotiation", "contract", "notary", "closed"]
    const rentalStages = ["lead", "visit", "offer", "negotiation", "contract", "closed"]
    const stages = pipelineType === "sale" ? saleStages : rentalStages
    const currentIndex = stages.indexOf(currentStatus)
    if (currentIndex < stages.length - 1) {
      return stages[currentIndex + 1]
    }
    return null
  }

  const handleMoveToNextStage = (dealId: string, currentStatus: string) => {
    const nextStage = getNextStage(currentStatus)
    if (nextStage) {
      moveDealToStage(dealId, nextStage as any)
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>{pipelineType === "sale" ? "Buyer" : "Tenant"}</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>{pipelineType === "sale" ? "Offered" : "Monthly Rent"}</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDeals.map((deal) => {
            const contact = getContactById(deal.buyerId)
            const property = getPropertyById(deal.propertyId)

            return (
              <TableRow key={deal.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-card-foreground">{property?.address.street}</p>
                    <p className="text-sm text-muted-foreground">{property?.reference}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {contact?.firstName[0]}
                        {contact?.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {contact?.firstName} {contact?.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(statusStyles[deal.status], "capitalize")}>{getStageLabel(deal.status)}</Badge>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(deal.priceOffered)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(deal.createdAt)}</TableCell>
	                <TableCell>
	                  <div className="flex items-center gap-1">
	                    <Button
	                      variant="ghost"
	                      size="icon"
	                      className="h-8 w-8"
	                      title="Call"
	                      onClick={() => toast.info("Call action coming soon.")}
	                    >
	                      <Phone className="h-4 w-4" />
	                    </Button>
	                    <Button
	                      variant="ghost"
	                      size="icon"
	                      className="h-8 w-8"
	                      title="Email"
	                      onClick={() => toast.info("Email action coming soon.")}
	                    >
	                      <Mail className="h-4 w-4" />
	                    </Button>
	                    <Button
	                      variant="ghost"
	                      size="icon"
	                      className="h-8 w-8"
	                      title="Schedule Visit"
	                      onClick={() => toast.info("Visit scheduling coming soon.")}
	                    >
	                      <Calendar className="h-4 w-4" />
	                    </Button>
                    {deal.status !== "closed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Move to next stage"
                        onClick={() => handleMoveToNextStage(deal.id, deal.status)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Deal details coming soon.")}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Deal edit coming soon.")}>Edit Deal</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Offer flow coming soon.")}>Add Offer</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Archive coming soon.")}>
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {filteredDeals.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No {pipelineType === "sale" ? "sales" : "rental"} deals yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
