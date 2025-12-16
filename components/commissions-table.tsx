"use client"

import { MoreHorizontal, Eye, Download, CheckCircle, Clock, XCircle } from "lucide-react"
import { toast } from "sonner"
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
import type { Commission } from "@/lib/mock-data"

const statusConfig: Record<Commission["status"], { icon: typeof CheckCircle; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-amber-500/10 text-amber-600", label: "Pending" },
  paid: { icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600", label: "Paid" },
  cancelled: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Cancelled" },
}

export function CommissionsTable() {
  const { commissions, deals, properties, markCommissionPaid, getDealById, getPropertyById } = useDataStore()

  const handleMarkPaid = (id: string) => {
    markCommissionPaid(id)
  }

  const handleDownloadStatement = (commission: Commission) => {
    const deal = getDealById(commission.dealId)
    const property = deal ? getPropertyById(deal.propertyId) : null

    // Generate simple PDF-like content
    const content = `
COMMISSION STATEMENT
====================

Commission ID: ${commission.id}
Date: ${new Date().toLocaleDateString("fr-FR")}

Property: ${property?.address.street || "N/A"}
         ${property?.address.city}, ${property?.address.postalCode}

Deal Reference: ${deal?.id || "N/A"}
Commission Rate: ${commission.percentage}%
Amount: ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(commission.amount)}

Status: ${commission.status.toUpperCase()}
${commission.paidAt ? `Paid on: ${new Date(commission.paidAt).toLocaleDateString("fr-FR")}` : ""}

---
PropFlow Realty
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `commission-statement-${commission.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal / Property</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No commissions found
              </TableCell>
            </TableRow>
          ) : (
            commissions.map((commission) => {
              const deal = getDealById(commission.dealId)
              const property = deal ? getPropertyById(deal.propertyId) : null
              const status = statusConfig[commission.status]

              return (
                <TableRow key={commission.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{property?.address.street || "Unknown Property"}</p>
                      <p className="text-xs text-muted-foreground">
                        {property?.address.city} · Deal #{deal?.id.slice(-4)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{commission.percentage}%</TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(commission.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={status.color}>
                      <status.icon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {commission.paidAt
                      ? new Date(commission.paidAt).toLocaleDateString("fr-FR")
                      : new Date(commission.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
	                      </DropdownMenuTrigger>
	                      <DropdownMenuContent align="end">
	                        <DropdownMenuItem onClick={() => toast.info("Commission details coming soon.")}>
	                          <Eye className="mr-2 h-4 w-4" />
	                          View Details
	                        </DropdownMenuItem>
	                        <DropdownMenuItem onClick={() => handleDownloadStatement(commission)}>
	                          <Download className="mr-2 h-4 w-4" />
	                          Download Statement
	                        </DropdownMenuItem>
                        {commission.status === "pending" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleMarkPaid(commission.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Paid
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
