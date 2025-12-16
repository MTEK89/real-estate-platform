"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/data-store"
import { MoreHorizontal, FileText, Download, Send, Eye, PenTool, ScanLine, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ContractWorkflowDialog } from "@/components/contract-workflow-dialog"

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  signed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
}

const typeLabels: Record<string, string> = {
  mandate: "Mandate",
  sale_existing: "Sale (Existing)",
  sale_vefa: "Sale (VEFA)",
  rental: "Rental",
  offer: "Offer Letter",
  reservation: "Reservation",
}

const categoryLabels: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  office: "Office",
  professional: "Professional",
  retail: "Retail",
}

const signatureIcons: Record<string, { icon: typeof PenTool; label: string }> = {
  electronic: { icon: PenTool, label: "E-Signature" },
  scanned: { icon: ScanLine, label: "Scanned" },
  manual: { icon: FileText, label: "Manual" },
}

function toPdfType(type: string) {
  const supported = new Set(["mandate", "rental", "offer", "sale_existing", "sale_vefa"])
  if (!supported.has(type)) return null
  return type as any
}

export function ContractsTable() {
  const { contracts, getContactById, getPropertyById, updateContract } = useDataStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [workflowContractId, setWorkflowContractId] = useState<string | null>(null)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const persistAndGetUrl = async (args: { contractId: string; docType: string; data: Record<string, unknown>; filename: string }) => {
    const res = await fetch("/api/v1/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: args.docType,
        data: args.data,
        options: { filename: args.filename },
        persist: { kind: "contract", id: args.contractId },
      }),
    })

    const json = await res.json().catch(() => ({} as any))
    if (!res.ok) throw new Error(json.error || "Failed to generate PDF")
    if (!json.signedUrl) throw new Error("Missing signed URL")

    if (typeof json.storagePath === "string") {
      updateContract(args.contractId, { fileUrl: json.storagePath, generatedAt: new Date().toISOString() })
    }

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

  const handlePreview = async (contract: (typeof contracts)[number]) => {
    const pdfType = toPdfType(contract.type)
    if (!pdfType) {
      toast.error("This contract type doesn't have a PDF template yet.")
      return
    }
    if (!contract.data || Object.keys(contract.data).length === 0) {
      toast.error("This contract has no saved PDF data yet. Open it and regenerate.")
      return
    }

    setIsGenerating(true)
    try {
      const property = getPropertyById(contract.propertyId)
      const filename = `${contract.type}_${property?.reference || contract.id}_${new Date().toISOString().split("T")[0]}.pdf`
      const url = await persistAndGetUrl({ contractId: contract.id, docType: pdfType, data: contract.data, filename })
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to preview contract")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (contract: (typeof contracts)[number]) => {
    const pdfType = toPdfType(contract.type)
    if (!pdfType) {
      toast.error("This contract type doesn't have a PDF template yet.")
      return
    }
    if (!contract.data || Object.keys(contract.data).length === 0) {
      toast.error("This contract has no saved PDF data yet. Open it and regenerate.")
      return
    }

    setIsGenerating(true)
    try {
      const property = getPropertyById(contract.propertyId)
      const filename = `${contract.type}_${property?.reference || contract.id}_${new Date().toISOString().split("T")[0]}.pdf`
      const url = await persistAndGetUrl({ contractId: contract.id, docType: pdfType, data: contract.data, filename })
      downloadFromUrl(url, filename)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download contract")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <ContractWorkflowDialog
        open={workflowContractId !== null}
        contract={workflowContractId ? contracts.find((c) => c.id === workflowContractId) ?? null : null}
        onOpenChange={(open) => {
          if (!open) setWorkflowContractId(null)
        }}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Signature</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const contact = contract.contactId ? getContactById(contract.contactId) : null
            const property = getPropertyById(contract.propertyId)
            const signatureInfo = contract.signatureMethod ? signatureIcons[contract.signatureMethod] : null

            return (
              <TableRow key={contract.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-card-foreground">{contract.id.toUpperCase().slice(0, 8)}</span>
                      {contract.autoFilled && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          Auto-filled
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{typeLabels[contract.type]}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{categoryLabels[contract.propertyCategory]}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-card-foreground">{property?.address.street}</p>
                    <p className="text-xs text-muted-foreground">{property?.reference}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{contact ? `${contact.firstName} ${contact.lastName}` : "-"}</span>
                </TableCell>
                <TableCell>
                  {signatureInfo ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <signatureInfo.icon className="h-3.5 w-3.5" />
                      {signatureInfo.label}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={cn(statusStyles[contract.status], "capitalize")}>
                    {contract.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(contract.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Preview PDF"
                      disabled={isGenerating}
                      onClick={() => handlePreview(contract)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Download PDF"
                      disabled={isGenerating}
                      onClick={() => handleDownload(contract)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setWorkflowContractId(contract.id)}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Workflow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreview(contract)} disabled={isGenerating}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(contract)} disabled={isGenerating}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        {contract.status === "draft" && (
                          <DropdownMenuItem onClick={() => setWorkflowContractId(contract.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send for Signature
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Delete coming soon.")}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
