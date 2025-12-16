"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Eye, Download, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

function toPdfType(type: string) {
  // Types supported by /api/pdf/generate
  const supported = new Set([
    "window_display",
    "cma",
    "open_house",
    "property_brochure",
    "property_postcard",
    "listing_presentation",
    "property_feature_sheet",
    "social_media_post",
    "email_marketing",
    "buyer_welcome_kit",
    "seller_packet",
    "client_intake_form",
  ])
  if (!supported.has(type)) return null
  return type as any
}

export function MarketingDocumentsTable() {
  const { marketingDocuments, getPropertyById, deleteMarketingDocument, updateMarketingDocument } = useDataStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const rows = useMemo(() => {
    return marketingDocuments.map((d) => {
      const property = d.propertyId ? getPropertyById(d.propertyId) : undefined
      return { doc: d, property }
    })
  }, [marketingDocuments, getPropertyById])

  const persistAndGetUrl = async (args: { docId: string; docType: string; data: Record<string, unknown>; filename: string }) => {
    const res = await fetch("/api/v1/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: args.docType,
        data: args.data,
        options: { filename: args.filename },
        persist: { kind: "marketing", id: args.docId },
      }),
    })

    const json = await res.json().catch(() => ({} as any))
    if (!res.ok) throw new Error(json.error || "Failed to generate PDF")
    if (!json.signedUrl) throw new Error("Missing signed URL")

    if (typeof json.storagePath === "string") {
      updateMarketingDocument(args.docId, { fileUrl: json.storagePath, generatedAt: new Date().toISOString() })
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
    <Card className="rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No marketing documents yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map(({ doc, property }) => {
              const pdfType = toPdfType(doc.type)
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">v{doc.version}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.type}</TableCell>
                  <TableCell>
                    {property ? (
                      <div>
                        <p className="text-sm text-card-foreground">{property.address.street}</p>
                        <p className="text-xs text-muted-foreground">{property.reference}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(statusStyles[doc.status] || statusStyles.draft, "capitalize")}>{doc.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Preview PDF"
                        disabled={!pdfType || isGenerating}
                        onClick={async () => {
                          if (!pdfType) return toast.info("Preview not available for this type yet.")
                          if (!doc.data || Object.keys(doc.data).length === 0) {
                            return toast.info("This document has no saved data yet. Open it from New Document and generate it once.")
                          }
                          const filename = `${doc.type}_${property?.reference || "document"}_${new Date().toISOString().slice(0, 10)}.pdf`
                          try {
                            setIsGenerating(true)
                            const signedUrl = await persistAndGetUrl({ docId: doc.id, docType: pdfType, data: doc.data, filename })
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
                        disabled={!pdfType || isGenerating}
                        onClick={async () => {
                          if (!pdfType) return toast.info("Download not available for this type yet.")
                          if (!doc.data || Object.keys(doc.data).length === 0) {
                            return toast.info("This document has no saved data yet. Open it from New Document and generate it once.")
                          }
                          const filename = `${doc.type}_${property?.reference || "document"}_${new Date().toISOString().slice(0, 10)}.pdf`
                          try {
                            setIsGenerating(true)
                            const signedUrl = await persistAndGetUrl({ docId: doc.id, docType: pdfType, data: doc.data, filename })
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/marketing/documents/new?type=${encodeURIComponent(doc.type)}&propertyId=${encodeURIComponent(doc.propertyId || "")}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              Duplicate
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              deleteMarketingDocument(doc.id)
                              toast.success("Document deleted")
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
    </Card>
  )
}
