"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Calendar, User, Building2, TrendingUp, FileText, Flag, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDataStore } from "@/lib/data-store"
import type { Task } from "@/lib/mock-data"
import { TasksEditDialog } from "@/components/tasks-edit-dialog"

const priorityConfig: Record<Task["priority"], { color: string; label: string }> = {
  low: { color: "bg-muted text-muted-foreground", label: "Low" },
  medium: { color: "bg-sky-500/10 text-sky-600", label: "Medium" },
  high: { color: "bg-amber-500/10 text-amber-600", label: "High" },
  urgent: { color: "bg-destructive/10 text-destructive", label: "Urgent" },
}

const statusColumns = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
]

const relatedTypeIcons = {
  contact: User,
  property: Building2,
  deal: TrendingUp,
  visit: Calendar,
  contract: FileText,
}

export function TasksBoard({
  onAddTask,
}: {
  onAddTask?: (status: Task["status"]) => void
}) {
  const { tasks, updateTask, completeTask, deleteTask, getContactById, getPropertyById, getDealById } = useDataStore()

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<Task["status"] | null>(null)

  const tasksById = useMemo(() => {
    const map = new Map<string, Task>()
    for (const t of tasks) map.set(t.id, t)
    return map
  }, [tasks])

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

  const moveTaskToStatus = (taskId: string, nextStatus: Task["status"]) => {
    const task = tasksById.get(taskId)
    if (!task) return
    if (task.status === nextStatus) return

    if (nextStatus === "completed") {
      completeTask(taskId)
      return
    }

    updateTask(taskId, { status: nextStatus, completedAt: null })
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
      {statusColumns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id)

        return (
          <div
            key={column.id}
            className={[
              "space-y-4 rounded-lg transition-colors",
              dragOverStatus === column.id ? "bg-primary/5 ring-2 ring-primary" : "",
            ].join(" ")}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverStatus(column.id as Task["status"])
            }}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragOverStatus(column.id as Task["status"])
            }}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(e) => {
              e.preventDefault()
              const taskId = e.dataTransfer.getData("text/plain")
              setDragOverStatus(null)
              if (!taskId) return
              moveTaskToStatus(taskId, column.id as Task["status"])
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {columnTasks.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddTask?.(column.id as Task["status"])}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

              <div className="space-y-3">
              {columnTasks.map((task) => {
                const priority = priorityConfig[task.priority]
                const RelatedIcon = task.relatedTo ? relatedTypeIcons[task.relatedTo.type] : null
                const relatedLabel = getRelatedLabel(task)

                return (
                  <Card
                    key={task.id}
                    className="group cursor-pointer"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id)
                      e.dataTransfer.effectAllowed = "move"
                    }}
                    onClick={() => setEditingTaskId(task.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.status === "completed"}
                          onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                          className="mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-sm leading-tight ${
                              task.status === "completed" ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingTaskId(task.id)}>Edit</DropdownMenuItem>
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
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <Badge variant="secondary" className={priority.color}>
                          <Flag className="mr-1 h-3 w-3" />
                          {priority.label}
                        </Badge>
                        {RelatedIcon && relatedLabel && (
                          <Badge variant="outline" className="font-normal">
                            <RelatedIcon className="mr-1 h-3 w-3" />
                            {relatedLabel}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {columnTasks.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">Drag a task here</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
      </div>

      <TasksEditDialog
        open={Boolean(editingTaskId)}
        onOpenChange={(open) => {
          if (!open) setEditingTaskId(null)
        }}
        taskId={editingTaskId}
      />
    </>
  )
}
