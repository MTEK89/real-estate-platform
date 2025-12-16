"use client"

import Link from "next/link"
import { useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { Plus, ClipboardCheck } from "lucide-react"

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
}

export default function InspectionsPage() {
  const { inspections, getPropertyById, getContactById } = useDataStore()

  const rows = useMemo(() => {
    return inspections.map((inspection) => {
      const property = getPropertyById(inspection.propertyId)
      const landlord = getContactById(inspection.landlordId)
      const tenant = getContactById(inspection.tenantId)
      return { inspection, property, landlord, tenant }
    })
  }, [inspections, getPropertyById, getContactById])

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Inspections"
        description="Move-in / move-out walkthroughs with checklists and photos."
        actions={
          <Link href="/dashboard/inspections/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Inspection
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        {rows.length === 0 ? (
          <Card className="max-w-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">No inspections yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create a move-in / move-out inspection to capture room conditions and photo evidence.
                  </p>
                  <div className="pt-2">
                    <Link href="/dashboard/inspections/new">
                      <Button size="sm">Create your first inspection</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inspection</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ inspection, property, landlord, tenant }) => (
                  <TableRow key={inspection.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/dashboard/inspections/${inspection.id}`} className="block">
                        <p className="font-medium">{inspection.id.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {landlord ? `${landlord.firstName} ${landlord.lastName}` : "—"} →{" "}
                          {tenant ? `${tenant.firstName} ${tenant.lastName}` : "—"}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{property ? property.address.street : "—"}</p>
                      <p className="text-xs text-muted-foreground">{property ? property.reference : "—"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {inspection.type.replace("_", "-")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusStyles[inspection.status], "capitalize")}>
                        {inspection.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inspection.scheduledDate ? new Date(inspection.scheduledDate).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
