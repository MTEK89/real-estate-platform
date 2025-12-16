"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, ClipboardCheck, Clock } from "lucide-react"
import { useDataStore } from "@/lib/data-store"

export function DocumentsStats() {
  const { contracts, operationalDocuments } = useDataStore()
  // Contract stats
  const contractsDraft = contracts.filter((c) => c.status === "draft").length
  const contractsPending = contracts.filter((c) => c.status === "pending_signature").length
  const contractsSigned = contracts.filter((c) => c.status === "signed").length

  // Operational docs stats
  const opsScheduled = operationalDocuments.filter((d) => d.status === "scheduled").length
  const opsCompleted = operationalDocuments.filter((d) => d.status === "completed").length

  const stats = [
    {
      label: "Total Contracts",
      value: contracts.length,
      subLabel: `${contractsSigned} signed`,
      icon: FileText,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Pending Signatures",
      value: contractsPending,
      subLabel: `${contractsDraft} drafts`,
      icon: Clock,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Operational Docs",
      value: operationalDocuments.length,
      subLabel: `${opsScheduled} scheduled`,
      icon: ClipboardCheck,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-card-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
