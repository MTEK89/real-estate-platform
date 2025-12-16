"use client"

import { Euro, Clock, CheckCircle, AlertCircle, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useDataStore } from "@/lib/data-store"

export function FinanceStats() {
  const { commissions, invoices } = useDataStore()

  const totalRevenue = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.amount, 0)

  const pendingCommissions = commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.amount, 0)

  const paidCommissions = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.amount, 0)

  const outstandingInvoices = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.total, 0)

  const monthlyTarget = 150000
  const yearToDateRevenue = totalRevenue + pendingCommissions

  const stats = [
    {
      label: "Total Revenue",
      value: totalRevenue,
      icon: Euro,
      format: "currency",
    },
    {
      label: "Pending Commissions",
      value: pendingCommissions,
      icon: Clock,
      format: "currency",
      variant: "warning" as const,
    },
    {
      label: "Paid Commissions",
      value: paidCommissions,
      icon: CheckCircle,
      format: "currency",
      variant: "success" as const,
    },
    {
      label: "Outstanding Invoices",
      value: outstandingInvoices,
      icon: AlertCircle,
      format: "currency",
      variant: "danger" as const,
    },
  ]

  const variantColors = {
    default: "text-primary bg-primary/10",
    warning: "text-amber-600 bg-amber-500/10",
    success: "text-emerald-600 bg-emerald-500/10",
    danger: "text-destructive bg-destructive/10",
  }

  const progressPercent = (yearToDateRevenue / (monthlyTarget * 12)) * 100

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const colorClass = variantColors[stat.variant || "default"]
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {stat.format === "currency"
                        ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(stat.value)
                        : stat.value.toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Annual Revenue Target</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(yearToDateRevenue)} /{" "}
              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(monthlyTarget * 12)}
            </span>
          </div>
          <Progress value={Math.min(progressPercent, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{progressPercent.toFixed(1)}% of annual target achieved</p>
        </CardContent>
      </Card>
    </div>
  )
}
