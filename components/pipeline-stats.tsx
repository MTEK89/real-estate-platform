"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useDataStore } from "@/lib/data-store"
import { TrendingUp, Euro, Target, Clock } from "lucide-react"

interface PipelineStatsProps {
  pipelineType: "sale" | "rental"
}

export function PipelineStats({ pipelineType }: PipelineStatsProps) {
  const { deals } = useDataStore()

  const filteredDeals = deals.filter((d) => d.type === pipelineType)
  const activeDeals = filteredDeals.filter((d) => d.status !== "closed").length
  const closedDeals = filteredDeals.filter((d) => d.status === "closed").length
  const totalPipelineValue = filteredDeals
    .filter((d) => d.status !== "closed")
    .reduce((sum, deal) => sum + (deal.priceOffered || 0), 0)
  const closedValue = filteredDeals
    .filter((d) => d.status === "closed")
    .reduce((sum, deal) => sum + (deal.priceAccepted || 0), 0)
  const avgDealSize = closedDeals > 0 ? closedValue / closedDeals : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  }

  const stats = [
    {
      label: pipelineType === "sale" ? "Active Sales" : "Active Rentals",
      value: activeDeals,
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(totalPipelineValue),
      icon: Euro,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Closed This Month",
      value: closedDeals,
      icon: Target,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: pipelineType === "sale" ? "Avg Sale Price" : "Avg Monthly Rent",
      value: formatCurrency(avgDealSize),
      icon: Clock,
      color: "text-amber-600 bg-amber-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
