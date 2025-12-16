"use client"

import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useDataStore } from "@/lib/data-store"

export function TasksStats() {
  const { tasks } = useDataStore()
  const todoCount = tasks.filter((t) => t.status === "todo").length
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length
  const completedCount = tasks.filter((t) => t.status === "completed").length
  const overdueCount = tasks.filter((t) => t.status !== "completed" && new Date(t.dueDate) < new Date()).length

  const stats = [
    {
      label: "To Do",
      value: todoCount,
      icon: Clock,
      color: "text-muted-foreground bg-muted",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Clock,
      color: "text-sky-600 bg-sky-500/10",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-500/10",
    },
    {
      label: "Overdue",
      value: overdueCount,
      icon: AlertCircle,
      color: "text-destructive bg-destructive/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
