"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDataStore } from "@/lib/data-store"
import type { Task } from "@/lib/mock-data"

type RelatedType = "none" | "contact" | "property" | "deal"

export function TasksEditDialog({
  open,
  onOpenChange,
  taskId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string | null
}) {
  const { tasks, contacts, properties, deals, addContact, updateTask, deleteTask } = useDataStore()

  const task = useMemo(() => (taskId ? tasks.find((t) => t.id === taskId) ?? null : null), [tasks, taskId])

  const contactsOptions = useMemo(
    () => contacts.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` })),
    [contacts],
  )
  const propertyOptions = useMemo(
    () => properties.map((p) => ({ id: p.id, label: `${p.reference} — ${p.address.city}` })),
    [properties],
  )
  const dealOptions = useMemo(() => deals.map((d) => ({ id: d.id, label: `Deal ${d.id}` })), [deals])

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("medium")
  const [dueDate, setDueDate] = useState("")
  const [status, setStatus] = useState<Task["status"]>("todo")

  const [relatedType, setRelatedType] = useState<RelatedType>("none")
  const [relatedId, setRelatedId] = useState("")

  const [showQuickContact, setShowQuickContact] = useState(false)
  const [newContactType, setNewContactType] = useState<"lead" | "buyer" | "seller" | "investor">("lead")
  const [newContactFirst, setNewContactFirst] = useState("")
  const [newContactLast, setNewContactLast] = useState("")
  const [newContactEmail, setNewContactEmail] = useState("")
  const [newContactPhone, setNewContactPhone] = useState("")

  useEffect(() => {
    if (!open) return
    if (!task) return

    setTitle(task.title)
    setDescription(task.description || "")
    setPriority(task.priority)
    setDueDate(task.dueDate || new Date().toISOString().slice(0, 10))
    setStatus(task.status)
    setRelatedType((task.relatedTo?.type as RelatedType) ?? "none")
    setRelatedId(task.relatedTo?.id ?? "")

    setShowQuickContact(false)
    setNewContactType("lead")
    setNewContactFirst("")
    setNewContactLast("")
    setNewContactEmail("")
    setNewContactPhone("")
  }, [open, task])

  const handleSave = () => {
    if (!task) return
    if (!title.trim()) {
      toast.error("Title is required.")
      return
    }

    const nextRelated =
      relatedType === "none" || !relatedId ? null : { type: relatedType as "contact" | "property" | "deal", id: relatedId }

    const nextStatus = status
    const completedAt = nextStatus === "completed" ? task.completedAt ?? new Date().toISOString() : null

    updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      status: nextStatus,
      completedAt,
      relatedTo: nextRelated,
    })

    toast.success("Task updated.")
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!task) return
    if (!confirm("Delete this task?")) return
    deleteTask(task.id)
    toast.success("Task deleted.")
    onOpenChange(false)
  }

  const handleCreateContact = () => {
    if (!newContactFirst.trim() || !newContactLast.trim()) {
      toast.error("First and last name are required.")
      return
    }
    const created = addContact({
      type: newContactType,
      firstName: newContactFirst.trim(),
      lastName: newContactLast.trim(),
      email: newContactEmail.trim() || null,
      phone: newContactPhone.trim() || null,
      source: "tasks",
      status: "new",
      assignedTo: null,
      tags: [],
      notes: "",
      lastContactAt: null,
    })
    setRelatedType("contact")
    setRelatedId(created.id)
    setShowQuickContact(false)
    toast.success("Contact created and linked.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        {!task ? (
          <div className="text-sm text-muted-foreground">Task not found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-task-title">Title *</Label>
              <Input id="edit-task-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-due">Due date</Label>
              <Input id="edit-task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
                <SelectTrigger id="edit-task-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Task["status"])}>
                <SelectTrigger id="edit-task-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-related-type">Link to (optional)</Label>
              <Select
                value={relatedType}
                onValueChange={(v) => {
                  setRelatedType(v as RelatedType)
                  setRelatedId("")
                  setShowQuickContact(false)
                }}
              >
                <SelectTrigger id="edit-task-related-type">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-related-id">Target</Label>
              <Select value={relatedId || "none"} onValueChange={(v) => setRelatedId(v === "none" ? "" : v)} disabled={relatedType === "none"}>
                <SelectTrigger id="edit-task-related-id">
                  <SelectValue placeholder={relatedType === "none" ? "—" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {relatedType === "contact"
                    ? contactsOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))
                    : null}
                  {relatedType === "property"
                    ? propertyOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))
                    : null}
                  {relatedType === "deal"
                    ? dealOptions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.label}
                        </SelectItem>
                      ))
                    : null}
                </SelectContent>
              </Select>
            </div>

            {relatedType === "contact" ? (
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/10 p-3">
                <div className="text-sm text-muted-foreground">
                  Don’t see the contact? Create it here and link it to the task.
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowQuickContact((v) => !v)}>
                  {showQuickContact ? "Hide" : "New contact"}
                </Button>
              </div>
            ) : null}

            {relatedType === "contact" && showQuickContact ? (
              <div className="sm:col-span-2 grid gap-3 rounded-md border bg-muted/10 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newContactType} onValueChange={(v) => setNewContactType(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="hidden sm:block" />
                <div className="space-y-2">
                  <Label>First name *</Label>
                  <Input value={newContactFirst} onChange={(e) => setNewContactFirst(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last name *</Label>
                  <Input value={newContactLast} onChange={(e) => setNewContactLast(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowQuickContact(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreateContact}>
                    Create & link
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-task-desc">Notes</Label>
              <Textarea
                id="edit-task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Call outcome, next steps, access code, etc."
                className="min-h-[120px]"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={!task}>
              Delete
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!task}>
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

