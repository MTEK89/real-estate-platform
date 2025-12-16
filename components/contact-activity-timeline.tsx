"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, Calendar, TrendingUp, FileText, CheckCircle2, Phone, MessageSquare, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Visit, Deal, Task, Contract, Email } from "@/lib/mock-data"

interface ActivityItem {
  id: string
  type: "email" | "visit" | "deal" | "contract" | "task" | "call" | "note"
  title: string
  description: string
  date: Date
  status?: string
  metadata?: Record<string, string>
}

interface ContactActivityTimelineProps {
  visits: Visit[]
  deals: Deal[]
  tasks: Task[]
  contracts: Contract[]
  emails: Email[]
  getPropertyById: (id: string) => { address: { street: string } } | undefined
  maxItems?: number
}

export function ContactActivityTimeline({
  visits,
  deals,
  tasks,
  contracts,
  emails,
  getPropertyById,
  maxItems = 15,
}: ContactActivityTimelineProps) {
  const timeline = useMemo(() => {
    const items: ActivityItem[] = []

    // Add emails
    emails.forEach((email) => {
      items.push({
        id: `email-${email.id}`,
        type: "email",
        title: email.folder === "sent" ? "Email Sent" : "Email Received",
        description: email.subject,
        date: new Date(email.date),
        status: email.status,
        metadata: {
          from: email.from.name,
          folder: email.folder,
        },
      })
    })

    // Add visits
    visits.forEach((visit) => {
      const property = getPropertyById(visit.propertyId)
      items.push({
        id: `visit-${visit.id}`,
        type: "visit",
        title:
          visit.status === "completed"
            ? "Property Visited"
            : visit.status === "cancelled"
              ? "Visit Cancelled"
              : "Visit Scheduled",
        description: property?.address.street || "Property",
        date: new Date(visit.date),
        status: visit.status,
        metadata: {
          time: visit.startTime,
        },
      })
    })

    // Add deals
    deals.forEach((deal) => {
      const property = getPropertyById(deal.propertyId)
      items.push({
        id: `deal-${deal.id}`,
        type: "deal",
        title: `Deal ${deal.status === "closed" ? "Closed" : "Updated"}`,
        description: `${deal.type === "sale" ? "Sale" : "Rental"} - ${property?.address.street || "Property"}`,
        date: new Date(deal.createdAt),
        status: deal.status,
        metadata: {
          value: deal.priceOffered ? `€${deal.priceOffered.toLocaleString()}` : undefined,
        },
      })
    })

    // Add contracts
    contracts.forEach((contract) => {
      const property = getPropertyById(contract.propertyId)
      items.push({
        id: `contract-${contract.id}`,
        type: "contract",
        title: `Contract ${contract.status === "signed" ? "Signed" : contract.status.replace("_", " ")}`,
        description: `${contract.type} - ${property?.address.street || "Property"}`,
        date: new Date(contract.signedAt || contract.createdAt),
        status: contract.status,
      })
    })

    // Add completed tasks
    tasks
      .filter((t) => t.status === "completed")
      .forEach((task) => {
        items.push({
          id: `task-${task.id}`,
          type: "task",
          title: "Task Completed",
          description: task.title,
          date: new Date(task.completedAt || task.createdAt),
          status: "completed",
        })
      })

    // Sort by date descending
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, maxItems)
  }, [visits, deals, tasks, contracts, emails, getPropertyById, maxItems])

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "email":
        return Mail
      case "visit":
        return Calendar
      case "deal":
        return TrendingUp
      case "contract":
        return FileText
      case "task":
        return CheckCircle2
      case "call":
        return Phone
      case "note":
        return MessageSquare
      default:
        return Clock
    }
  }

  const getIconStyle = (type: ActivityItem["type"], status?: string) => {
    if (status === "completed" || status === "signed") {
      return "bg-emerald-100 text-emerald-600"
    }
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-600"
      case "visit":
        return "bg-purple-100 text-purple-600"
      case "deal":
        return "bg-amber-100 text-amber-600"
      case "contract":
        return "bg-emerald-100 text-emerald-600"
      case "task":
        return "bg-slate-100 text-slate-600"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Activity Timeline
          <Badge variant="secondary" className="ml-auto">
            {timeline.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Clock className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mt-2">No activity yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="px-4 pb-4">
              {timeline.map((item, index) => {
                const Icon = getIcon(item.type)
                const iconStyle = getIconStyle(item.type, item.status)
                return (
                  <div key={item.id} className="flex gap-3 relative">
                    {/* Timeline line */}
                    {index < timeline.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                    )}
                    {/* Icon */}
                    <div
                      className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full z-10", iconStyle)}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(item.date)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      {item.metadata?.value && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.metadata.value}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
