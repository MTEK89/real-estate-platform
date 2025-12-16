import { TrendingUp, TrendingDown, Euro, Target, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const kpis = [
  {
    label: "Total Revenue",
    value: "€186,500",
    change: "+23.5%",
    changeType: "positive" as const,
    icon: Euro,
    description: "vs last quarter",
  },
  {
    label: "Active Deals",
    value: "12",
    change: "+4",
    changeType: "positive" as const,
    icon: TrendingUp,
    description: "in pipeline",
  },
  {
    label: "Conversion Rate",
    value: "24.8%",
    change: "+2.3%",
    changeType: "positive" as const,
    icon: Target,
    description: "leads to closed",
  },
  {
    label: "Avg. Deal Value",
    value: "€1.2M",
    change: "-5.2%",
    changeType: "negative" as const,
    icon: Activity,
    description: "vs last quarter",
  },
]

export function AnalyticsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {kpi.changeType === "positive" ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span
                className={`text-xs font-medium ${kpi.changeType === "positive" ? "text-emerald-500" : "text-destructive"}`}
              >
                {kpi.change}
              </span>
              <span className="text-xs text-muted-foreground ml-1">{kpi.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
