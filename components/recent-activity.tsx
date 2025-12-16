import { cn } from "@/lib/utils"
import { Building2, Calendar, FileText, MessageSquare, TrendingUp } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "visit",
    title: "Visit scheduled",
    description: "Michael Chen - 123 Downtown Ave",
    time: "10 min ago",
    icon: Calendar,
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    id: 2,
    type: "offer",
    title: "New offer received",
    description: "€875,000 for PROP-001",
    time: "1 hour ago",
    icon: TrendingUp,
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    id: 3,
    type: "message",
    title: "New message",
    description: "Emily Rodriguez replied to your inquiry",
    time: "2 hours ago",
    icon: MessageSquare,
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    id: 4,
    type: "contract",
    title: "Contract signed",
    description: "Mandate for 456 Oak Lane",
    time: "3 hours ago",
    icon: FileText,
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    id: 5,
    type: "listing",
    title: "Property published",
    description: "PROP-004 is now live",
    time: "5 hours ago",
    icon: Building2,
    iconBg: "bg-teal-100 text-teal-600",
  },
]

export function RecentActivity() {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold text-card-foreground">Recent Activity</h3>
      </div>
      <div className="divide-y">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 px-6 py-4">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", activity.iconBg)}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
