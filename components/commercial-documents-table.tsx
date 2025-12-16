"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { commercialDocuments, getPropertyById } from "@/lib/mock-data"
import { MoreHorizontal, Eye, Download, FileText, BookOpen, DollarSign, Presentation, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const typeConfig: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  notice_descriptive: {
    icon: BookOpen,
    label: "Notice Descriptive",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  customer_pdf: {
    icon: Presentation,
    label: "Customer PDF",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  price_list: {
    icon: DollarSign,
    label: "Price List",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  brochure: {
    icon: FileText,
    label: "Brochure",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
}

export function CommercialDocumentsTable() {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commercialDocuments.map((doc) => {
            const property = getPropertyById(doc.propertyId)
            const config = typeConfig[doc.type]
            const IconComponent = config.icon

            return (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.color)}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="max-w-[200px]">
                      <span className="font-medium text-card-foreground line-clamp-1">{doc.title}</span>
                      <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
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
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      v{doc.version}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(statusStyles[doc.status], "capitalize")}>{doc.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(doc.generatedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {doc.fileUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Download">
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
	                        <DropdownMenuItem onClick={() => toast.info("Preview coming soon.")}>
	                          <Eye className="mr-2 h-4 w-4" />
	                          Preview
	                        </DropdownMenuItem>
	                        {doc.fileUrl && (
	                          <DropdownMenuItem onClick={() => toast.info("Download coming soon.")}>
	                            <Download className="mr-2 h-4 w-4" />
	                            Download PDF
	                          </DropdownMenuItem>
	                        )}
	                        <DropdownMenuItem onClick={() => toast.info("Regenerate coming soon.")}>
	                          <RefreshCw className="mr-2 h-4 w-4" />
	                          Regenerate
	                        </DropdownMenuItem>
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
