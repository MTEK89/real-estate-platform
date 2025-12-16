"use client"

import { useState } from "react"
import { Plus, Filter, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { TasksStats } from "@/components/tasks-stats"
import { TasksBoard } from "@/components/tasks-board"
import { TasksList } from "@/components/tasks-list"
import { TasksCreateDialog } from "@/components/tasks-create-dialog"

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<"board" | "list">("board")
  const [createOpen, setCreateOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState<"todo" | "in_progress" | "completed" | "cancelled">("todo")

  return (
    <>
      <DashboardHeader
        title="Tasks & Productivity"
        description="Manage your tasks and stay organized"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === "board" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setCreateStatus("todo")
                setCreateOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <TasksStats />

        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="today">Due Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          <TabsContent value="all" className="mt-4">
            {viewMode === "board" ? (
              <TasksBoard
                onAddTask={(status) => {
                  setCreateStatus(status)
                  setCreateOpen(true)
                }}
              />
            ) : (
              <TasksList />
            )}
          </TabsContent>

          <TabsContent value="today" className="mt-4">
            {viewMode === "board" ? (
              <TasksBoard
                onAddTask={(status) => {
                  setCreateStatus(status)
                  setCreateOpen(true)
                }}
              />
            ) : (
              <TasksList />
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            {viewMode === "board" ? (
              <TasksBoard
                onAddTask={(status) => {
                  setCreateStatus(status)
                  setCreateOpen(true)
                }}
              />
            ) : (
              <TasksList />
            )}
          </TabsContent>

          <TabsContent value="overdue" className="mt-4">
            {viewMode === "board" ? (
              <TasksBoard
                onAddTask={(status) => {
                  setCreateStatus(status)
                  setCreateOpen(true)
                }}
              />
            ) : (
              <TasksList />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TasksCreateDialog open={createOpen} onOpenChange={setCreateOpen} initialStatus={createStatus} />
    </>
  )
}
