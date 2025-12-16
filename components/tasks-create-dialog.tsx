"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDataStore } from "@/lib/data-store"

type RelatedType = "none" | "contact" | "property" | "deal"

export function TasksCreateDialog({
  open,
  onOpenChange,
  initialStatus = "todo",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStatus?: "todo" | "in_progress" | "completed" | "cancelled"
}) {
  const { contacts, properties, deals, addTask, addContact } = useDataStore()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [status, setStatus] = useState<"todo" | "in_progress" | "completed" | "cancelled">(initialStatus)

  const [relatedType, setRelatedType] = useState<RelatedType>("none")
  const [relatedId, setRelatedId] = useState("")

  const [showQuickContact, setShowQuickContact] = useState(false)
  const [newContactType, setNewContactType] = useState<"lead" | "buyer" | "seller" | "investor">("lead")
  const [newContactFirst, setNewContactFirst] = useState("")
  const [newContactLast, setNewContactLast] = useState("")
  const [newContactEmail, setNewContactEmail] = useState("")
  const [newContactPhone, setNewContactPhone] = useState("")

  const contactsOptions = useMemo(
    () => contacts.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` })),
    [contacts],
  )
  const propertyOptions = useMemo(
    () => properties.map((p) => ({ id: p.id, label: `${p.reference} — ${p.address.city}` })),
    [properties],
  )
  const dealOptions = useMemo(() => deals.map((d) => ({ id: d.id, label: `Deal ${d.id}` })), [deals])

  const reset = () => {
    setTitle("")
    setDescription("")
    setPriority("medium")
    setStatus(initialStatus)
    const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    setDueDate(d.toISOString().slice(0, 10))
    setRelatedType("none")
    setRelatedId("")
    setShowQuickContact(false)
    setNewContactType("lead")
    setNewContactFirst("")
    setNewContactLast("")
    setNewContactEmail("")
    setNewContactPhone("")
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Call owner for mandate signature"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due">Due date</Label>
            <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger id="task-priority">
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
            <Label htmlFor="task-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger id="task-status">
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
            <Label htmlFor="task-related-type">Link to (optional)</Label>
            <Select
              value={relatedType}
              onValueChange={(v) => {
                setRelatedType(v as RelatedType)
                setRelatedId("")
                setShowQuickContact(false)
              }}
            >
              <SelectTrigger id="task-related-type">
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
            <Label htmlFor="task-related-id">Target</Label>
            <Select value={relatedId || "none"} onValueChange={(v) => setRelatedId(v === "none" ? "" : v)} disabled={relatedType === "none"}>
              <SelectTrigger id="task-related-id">
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
              <div className="text-sm text-muted-foreground">Don’t see the contact? Create it here and link it to the task.</div>
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
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
              className="min-h-[110px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!title.trim()) {
                toast.error("Title is required.")
                return
              }
              addTask({
                title: title.trim(),
                description: description.trim(),
                assignedTo: "u1",
                relatedTo:
                  relatedType === "none" || !relatedId
                    ? null
                    : { type: relatedType as "contact" | "property" | "deal", id: relatedId },
                priority,
                status,
                dueDate: dueDate || new Date().toISOString().slice(0, 10),
                completedAt: status === "completed" ? new Date().toISOString() : null,
              })
              toast.success("Task created.")
              onOpenChange(false)
            }}
          >
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
