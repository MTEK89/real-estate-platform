import { Eye, MessageSquare, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { marketingStats } from "@/lib/mock-data"

const stats = [
  {
    label: "Active Listings",
    value: marketingStats.activeListings,
    total: marketingStats.totalListings,
    icon: TrendingUp,
    format: (v: number, t?: number) => `${v}/${t}`,
  },
  {
    label: "Total Views",
    value: marketingStats.totalViews,
    icon: Eye,
    change: "+12%",
    changeType: "positive" as const,
  },
  {
    label: "Inquiries",
    value: marketingStats.totalInquiries,
    icon: MessageSquare,
    change: "+8%",
    changeType: "positive" as const,
  },
  {
    label: "Avg. Days on Market",
    value: marketingStats.avgDaysOnMarket,
    icon: Clock,
    change: "-3 days",
    changeType: "positive" as const,
  },
]

export function MarketingStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">
                  {stat.format ? stat.format(stat.value, stat.total) : stat.value.toLocaleString()}
                </p>
                {stat.change && (
                  <p
                    className={`text-xs mt-1 ${
                      stat.changeType === "positive" ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {stat.change} vs last month
                  </p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
