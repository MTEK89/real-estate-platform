"use client"

import { useState } from "react"
import {
  MoreHorizontal,
  Calendar,
  User,
  Building2,
  TrendingUp,
  FileText,
  Flag,
  CheckCircle,
  Circle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/data-store"
import type { Task } from "@/lib/mock-data"
import { TasksEditDialog } from "@/components/tasks-edit-dialog"
import { toast } from "sonner"

const priorityConfig: Record<Task["priority"], { color: string; label: string }> = {
  low: { color: "bg-muted text-muted-foreground", label: "Low" },
  medium: { color: "bg-sky-500/10 text-sky-600", label: "Medium" },
  high: { color: "bg-amber-500/10 text-amber-600", label: "High" },
  urgent: { color: "bg-destructive/10 text-destructive", label: "Urgent" },
}

const statusConfig: Record<Task["status"], { icon: typeof CheckCircle; color: string; label: string }> = {
  todo: { icon: Circle, color: "text-muted-foreground", label: "To Do" },
  in_progress: { icon: Circle, color: "text-sky-500", label: "In Progress" },
  completed: { icon: CheckCircle, color: "text-emerald-500", label: "Completed" },
  cancelled: { icon: Circle, color: "text-muted-foreground", label: "Cancelled" },
}

const relatedTypeIcons = {
  contact: User,
  property: Building2,
  deal: TrendingUp,
  visit: Calendar,
  contract: FileText,
}

export function TasksList() {
  const { tasks, updateTask, completeTask, deleteTask, getContactById, getPropertyById, getDealById } = useDataStore()
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const getRelatedLabel = (task: Task): string | null => {
    if (!task.relatedTo) return null

    switch (task.relatedTo.type) {
      case "contact": {
        const contact = getContactById(task.relatedTo.id)
        return contact ? `${contact.firstName} ${contact.lastName}` : null
      }
      case "property": {
        const property = getPropertyById(task.relatedTo.id)
        return property ? property.reference : null
      }
      case "deal": {
        const deal = getDealById(task.relatedTo.id)
        if (deal) {
          const contact = getContactById(deal.buyerId)
          return contact ? `${contact.firstName} ${contact.lastName}` : `Deal #${deal.id}`
        }
        return null
      }
      default:
        return null
    }
  }

  const toggleTaskStatus = (taskId: string, currentStatus: Task["status"]) => {
    if (currentStatus === "completed") {
      updateTask(taskId, { status: "todo", completedAt: null })
    } else {
      completeTask(taskId)
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Related To</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const priority = priorityConfig[task.priority]
            const status = statusConfig[task.status]
            const StatusIcon = status.icon
            const RelatedIcon = task.relatedTo ? relatedTypeIcons[task.relatedTo.type] : null
            const relatedLabel = getRelatedLabel(task)

            return (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p
                      className={`font-medium text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {RelatedIcon && relatedLabel ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <RelatedIcon className="h-3.5 w-3.5" />
                      {relatedLabel}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={priority.color}>
                    <Flag className="mr-1 h-3 w-3" />
                    {priority.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center gap-1.5 text-sm ${status.color}`}>
                    <StatusIcon className="h-4 w-4" />
                    {status.label}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(task.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTaskId(task.id)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Priority quick edit coming soon.")}>Change Priority</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (!confirm("Delete this task?")) return
                          deleteTask(task.id)
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}

          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No tasks yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TasksEditDialog
        open={Boolean(editingTaskId)}
        onOpenChange={(open) => {
          if (!open) setEditingTaskId(null)
        }}
        taskId={editingTaskId}
      />
    </div>
  )
}
