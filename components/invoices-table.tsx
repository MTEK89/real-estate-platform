"use client"

import { MoreHorizontal, Eye, Download, Send, CheckCircle, AlertCircle, XCircle, FileText } from "lucide-react"
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
import type { Invoice } from "@/lib/mock-data"
import type { InvoiceData } from "@/lib/pdf"
import { toast } from "sonner"
import { useState } from "react"

const statusConfig: Record<Invoice["status"], { icon: typeof CheckCircle; color: string; label: string }> = {
  draft: { icon: FileText, color: "bg-muted text-muted-foreground", label: "Draft" },
  sent: { icon: Send, color: "bg-sky-500/10 text-sky-600", label: "Sent" },
  paid: { icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600", label: "Paid" },
  overdue: { icon: AlertCircle, color: "bg-destructive/10 text-destructive", label: "Overdue" },
  cancelled: { icon: XCircle, color: "bg-muted text-muted-foreground", label: "Cancelled" },
}

export function InvoicesTable() {
  const { invoices, getContactById, getDealById, getPropertyById, markInvoicePaid, sendInvoice, updateInvoice } = useDataStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const getPdfData = (invoice: Invoice): InvoiceData => {
    const deal = invoice.dealId ? getDealById(invoice.dealId) : undefined
    const property = deal ? getPropertyById(deal.propertyId) : undefined
    return { invoice: invoice as unknown as InvoiceData["invoice"], deal, property }
  }

  const persistAndGetUrl = async (args: { invoiceId: string; data: InvoiceData; filename: string }) => {
    const res = await fetch("/api/v1/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: "invoice",
        data: args.data,
        options: { filename: args.filename },
        persist: { kind: "invoice", id: args.invoiceId },
      }),
    })

    const json = await res.json().catch(() => ({} as any))
    if (!res.ok) throw new Error(json.error || "Failed to generate PDF")
    if (!json.signedUrl) throw new Error("Missing signed URL")
    return json.signedUrl as string
  }

  const downloadFromUrl = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handlePreviewPDF = async (invoice: Invoice) => {
    setIsGenerating(true)
    try {
      const pdfData = getPdfData(invoice)
      const filename = `${invoice.invoiceNumber}.pdf`
      const url = await persistAndGetUrl({ invoiceId: invoice.id, data: pdfData, filename })
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to preview invoice")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    setIsGenerating(true)
    try {
      const pdfData = getPdfData(invoice)
      const filename = `${invoice.invoiceNumber}.pdf`
      const url = await persistAndGetUrl({ invoiceId: invoice.id, data: pdfData, filename })
      downloadFromUrl(url, filename)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download invoice")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => {
              const contact = getContactById(invoice.contactId)
              const status = statusConfig[invoice.status]

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber || `INV-${invoice.id.slice(-4).toUpperCase()}`}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {contact?.firstName} {contact?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {invoice.items.length} item{invoice.items.length !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: invoice.currency ?? "EUR" }).format(
                      invoice.totals.totalInclVat,
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={status.color}>
                      <status.icon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreviewPDF(invoice)} disabled={isGenerating}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)} disabled={isGenerating}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        {invoice.status === "draft" && (
                          <DropdownMenuItem onClick={() => sendInvoice(invoice.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Client
                          </DropdownMenuItem>
                        )}
                        {(invoice.status === "sent" || invoice.status === "overdue") && (
                          <DropdownMenuItem onClick={() => markInvoicePaid(invoice.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => updateInvoice(invoice.id, { status: "cancelled" })}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Invoice
                        </DropdownMenuItem>
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
