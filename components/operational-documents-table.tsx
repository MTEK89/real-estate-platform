"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/data-store"
import {
  MoreHorizontal,
  Eye,
  Download,
  ClipboardCheck,
  Key,
  Camera,
  Ruler,
  FileBarChart,
  Calendar,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface OperationalDocumentsTableProps {
  typeFilter?: string
  statusFilter?: string
  searchQuery?: string
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  signed: "bg-primary/10 text-primary",
}

const typeConfig: Record<string, { icon: typeof ClipboardCheck; label: string; color: string }> = {
  etat_des_lieux: {
    icon: ClipboardCheck,
    label: "État des Lieux",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  remise_des_cles: {
    icon: Key,
    label: "Remise des Clés",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  photo_session: {
    icon: Camera,
    label: "Photo Session",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  surface_calculation: {
    icon: Ruler,
    label: "Surface Calculation",
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  },
  evaluation: {
    icon: FileBarChart,
    label: "Evaluation",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
}

export function OperationalDocumentsTable({
  typeFilter = "all",
  statusFilter = "all",
  searchQuery = "",
}: OperationalDocumentsTableProps) {
  const { operationalDocuments, getPropertyById, getContactById, updateOperationalDocument } = useDataStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const filteredDocuments = useMemo(() => {
    return operationalDocuments.filter((doc) => {
      // Type filter
      if (typeFilter !== "all" && doc.type !== typeFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== "all" && doc.status !== statusFilter) {
        return false
      }

      // Search query filter
      if (searchQuery) {
        const property = getPropertyById(doc.propertyId)
        const contact = doc.contactId ? getContactById(doc.contactId) : null
        const searchLower = searchQuery.toLowerCase()

        const matchesId = doc.id.toLowerCase().includes(searchLower)
        const matchesProperty =
          property?.address.street.toLowerCase().includes(searchLower) ||
          property?.reference.toLowerCase().includes(searchLower)
        const matchesContact = contact
          ? `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchLower)
          : false
        const matchesType = typeConfig[doc.type]?.label.toLowerCase().includes(searchLower)

        if (!matchesId && !matchesProperty && !matchesContact && !matchesType) {
          return false
        }
      }

      return true
    })
  }, [typeFilter, statusFilter, searchQuery, operationalDocuments, getPropertyById, getContactById])

  const canRenderPdf = (docType: string) => docType === "etat_des_lieux" || docType === "remise_des_cles"

  const toPdfType = (docType: string) => {
    if (docType === "etat_des_lieux") return "etat_des_lieux" as const
    if (docType === "remise_des_cles") return "key_handover" as const
    return null
  }

  const persistAndGetUrl = async (args: {
    docId: string
    docType: string
    data: Record<string, unknown>
    filename: string
    currentAttachments: string[]
  }) => {
    const res = await fetch("/api/v1/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: args.docType,
        data: args.data,
        options: { filename: args.filename },
        persist: { kind: "operational", id: args.docId },
      }),
    })

    const json = await res.json().catch(() => ({} as any))
    if (!res.ok) throw new Error(json.error || "Failed to generate PDF")
    if (!json.signedUrl) throw new Error("Missing signed URL")

    if (typeof json.storagePath === "string") {
      updateOperationalDocument(args.docId, {
        attachments: Array.from(new Set([...(Array.isArray(args.currentAttachments) ? args.currentAttachments : []), json.storagePath])),
      } as any)
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

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No documents found matching your filters.
              </TableCell>
            </TableRow>
          ) : (
            filteredDocuments.map((doc) => {
              const property = getPropertyById(doc.propertyId)
              const contact = doc.contactId ? getContactById(doc.contactId) : null
              const config = typeConfig[doc.type]
              const IconComponent = config.icon

              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.color)}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium text-card-foreground">{doc.id.toUpperCase()}</span>
                        {doc.subType && (
                          <p className="text-xs text-muted-foreground capitalize">{doc.subType.replace("_", " ")}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{config.label}</span>
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
                    {doc.scheduledDate ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(doc.scheduledDate)}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(statusStyles[doc.status], "capitalize")}>{doc.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    {doc.completedAt ? (
                      <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {formatDate(doc.completedAt)}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Preview"
                        disabled={!canRenderPdf(doc.type) || isGenerating}
                        onClick={async () => {
                          const pdfType = toPdfType(doc.type)
                          if (!pdfType) return toast.info("Preview not available for this document type yet.")
                          const filename = `${doc.type}_${property?.reference || "document"}_${new Date().toISOString().slice(0, 10)}.pdf`
                          try {
                            setIsGenerating(true)
                            const signedUrl = await persistAndGetUrl({
                              docId: doc.id,
                              docType: pdfType,
                              data: doc.data as unknown as Record<string, unknown>,
                              filename,
                              currentAttachments: doc.attachments,
                            })
                            window.open(signedUrl, "_blank", "noopener,noreferrer")
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed to generate PDF")
                          } finally {
                            setIsGenerating(false)
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Download PDF"
                        disabled={!canRenderPdf(doc.type) || isGenerating}
                        onClick={async () => {
                          const pdfType = toPdfType(doc.type)
                          if (!pdfType) return toast.info("Download not available for this document type yet.")
                          const filename = `${doc.type}_${property?.reference || "document"}_${new Date().toISOString().slice(0, 10)}.pdf`
                          try {
                            setIsGenerating(true)
                            const signedUrl = await persistAndGetUrl({
                              docId: doc.id,
                              docType: pdfType,
                              data: doc.data as unknown as Record<string, unknown>,
                              filename,
                              currentAttachments: doc.attachments,
                            })
                            downloadFromUrl(signedUrl, filename)
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed to generate PDF")
                          } finally {
                            setIsGenerating(false)
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {doc.attachments.length > 0 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Download attachments">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
	                      <DropdownMenuTrigger asChild>
	                        <Button variant="ghost" size="icon" className="h-8 w-8">
	                          <MoreHorizontal className="h-4 w-4" />
	                        </Button>
	                      </DropdownMenuTrigger>
	                      <DropdownMenuContent align="end">
		                        <DropdownMenuItem
	                            disabled={!canRenderPdf(doc.type) || isGenerating}
	                            onClick={async () => {
	                              const pdfType = toPdfType(doc.type)
	                              if (!pdfType) return toast.info("Preview not available for this document type yet.")
	                              const filename = `${doc.type}_${property?.reference || "document"}_${new Date().toISOString().slice(0, 10)}.pdf`
                                try {
                                  setIsGenerating(true)
                                  const signedUrl = await persistAndGetUrl({
                                    docId: doc.id,
                                    docType: pdfType,
                                    data: doc.data as unknown as Record<string, unknown>,
                                    filename,
                                    currentAttachments: doc.attachments,
                                  })
                                  window.open(signedUrl, "_blank", "noopener,noreferrer")
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Failed to generate PDF")
                                } finally {
                                  setIsGenerating(false)
                                }
	                            }}
	                          >
		                          <Eye className="mr-2 h-4 w-4" />
		                          Preview PDF
		                        </DropdownMenuItem>
	                          <DropdownMenuItem
	                            disabled={!canRenderPdf(doc.type) || isGenerating}
	                            onClick={async () => {
	                              const pdfType = toPdfType(doc.type)
	                              if (!pdfType) return toast.info("Download not available for this document type yet.")
	                              const filename = `${doc.type}_${property?.reference || "document"}_${new Date().toISOString().slice(0, 10)}.pdf`
                                try {
                                  setIsGenerating(true)
                                  const signedUrl = await persistAndGetUrl({
                                    docId: doc.id,
                                    docType: pdfType,
                                    data: doc.data as unknown as Record<string, unknown>,
                                    filename,
                                    currentAttachments: doc.attachments,
                                  })
                                  downloadFromUrl(signedUrl, filename)
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Failed to generate PDF")
                                } finally {
                                  setIsGenerating(false)
                                }
	                            }}
	                          >
	                            <Download className="mr-2 h-4 w-4" />
	                            Download PDF
	                          </DropdownMenuItem>
	                        {doc.attachments.length > 0 && (
	                          <DropdownMenuItem onClick={() => toast.info("Attachments download coming soon.")}>
	                            <Download className="mr-2 h-4 w-4" />
	                            Download Attachments
	                          </DropdownMenuItem>
	                        )}
	                        {doc.status === "scheduled" && (
	                          <DropdownMenuItem onClick={() => toast.info("Mark complete coming soon.")}>
	                            <CheckCircle2 className="mr-2 h-4 w-4" />
	                            Mark Complete
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
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
