"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataStore } from "@/lib/data-store"
import { generateFollowUpSuggestions, type FollowUpSuggestion } from "@/lib/follow-up-engine"
import type { Deal, Task } from "@/lib/mock-data"
import {
  MoreHorizontal,
  Euro,
  Building2,
  GripVertical,
  CheckSquare,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Clock,
  Send,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const saleStages: { id: Deal["status"]; label: string; color: string }[] = [
  { id: "lead", label: "Lead", color: "bg-slate-500" },
  { id: "visit", label: "Visit", color: "bg-blue-500" },
  { id: "offer", label: "Offer", color: "bg-amber-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "contract", label: "Contract", color: "bg-purple-500" },
  { id: "notary", label: "Notary", color: "bg-indigo-500" },
  { id: "closed", label: "Closed", color: "bg-emerald-500" },
]

const rentalStages: { id: Deal["status"]; label: string; color: string }[] = [
  { id: "lead", label: "Lead", color: "bg-slate-500" },
  { id: "visit", label: "Visit", color: "bg-blue-500" },
  { id: "offer", label: "Application", color: "bg-amber-500" },
  { id: "negotiation", label: "Background Check", color: "bg-orange-500" },
  { id: "contract", label: "Lease Signing", color: "bg-purple-500" },
  { id: "closed", label: "Move-in", color: "bg-emerald-500" },
]

interface DealCardProps {
  deal: Deal
  onDragStart: (e: React.DragEvent, deal: Deal) => void
  onTaskAction: (deal: Deal, action: string) => void
  onViewDetails: (deal: Deal) => void
  relatedTasks: Task[]
  contactName: string
  propertyAddress: string
  propertyRef: string
  suggestion?: FollowUpSuggestion
}

function DealCard({
  deal,
  onDragStart,
  onTaskAction,
  onViewDetails,
  relatedTasks,
  contactName,
  propertyAddress,
  propertyRef,
  suggestion,
}: DealCardProps) {
  const formattedPrice = deal.priceOffered
    ? new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(deal.priceOffered)
    : null

  const pendingTasks = relatedTasks.filter((t) => t.status !== "completed")

  return (
    <Card
      className={cn(
        "cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing",
        suggestion && suggestion.priority === "urgent" && "ring-2 ring-red-500/50",
        suggestion && suggestion.priority === "high" && "ring-2 ring-amber-500/50",
      )}
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {contactName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-card-foreground">{contactName}</p>
              <Badge variant="secondary" className="text-xs capitalize">
                {deal.type}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(deal)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                View Details & History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Deal edit coming soon.")}>Edit Deal</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTaskAction(deal, "call")}>
                <Phone className="mr-2 h-4 w-4" />
                Schedule Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTaskAction(deal, "email")}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTaskAction(deal, "visit")}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Visit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Archive coming soon.")}>
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{propertyAddress}</span>
          </div>

          {formattedPrice && (
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium text-emerald-600">{formattedPrice}</span>
            </div>
          )}
        </div>

        {pendingTasks.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>
              {pendingTasks.length} pending task{pendingTasks.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {suggestion && (
          <button
            onClick={() => onViewDetails(deal)}
            className={cn(
              "mt-2 w-full flex items-center gap-2 p-2 rounded-md text-xs transition-colors",
              suggestion.priority === "urgent" && "bg-red-50 text-red-700 hover:bg-red-100",
              suggestion.priority === "high" && "bg-amber-50 text-amber-700 hover:bg-amber-100",
              suggestion.priority === "medium" && "bg-blue-50 text-blue-700 hover:bg-blue-100",
              suggestion.priority === "low" && "bg-slate-50 text-slate-700 hover:bg-slate-100",
            )}
          >
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate flex-1 text-left">{suggestion.reason}</span>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          </button>
        )}

        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize">{deal.type}</span>
          <span className="text-xs text-muted-foreground">{propertyRef}</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface PipelineBoardProps {
  pipelineType: "sale" | "rental"
}

export function PipelineBoard({ pipelineType }: PipelineBoardProps) {
  const {
    deals,
    contacts,
    properties,
    emails,
    visits,
    tasks,
    moveDealToStage,
    getContactById,
    getPropertyById,
    getTasksByDealId,
    addTask,
    addVisit,
    addEmail,
    getEmailsByContactId,
  } = useDataStore()

  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [selectedTaskAction, setSelectedTaskAction] = useState<{ deal: Deal; action: string } | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([])
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [selectedTone, setSelectedTone] = useState("professional")

  // Form state for task/visit creation
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskDueDate, setTaskDueDate] = useState("")
  const [visitDate, setVisitDate] = useState("")
  const [visitStartTime, setVisitStartTime] = useState("10:00")
  const [visitEndTime, setVisitEndTime] = useState("11:00")

  const filteredDeals = useMemo(() => deals.filter((d) => d.type === pipelineType), [deals, pipelineType])
  const stages = pipelineType === "sale" ? saleStages : rentalStages

  useEffect(() => {
    const newSuggestions = generateFollowUpSuggestions(filteredDeals, emails, visits, tasks, contacts, properties)
    setSuggestions(newSuggestions)
  }, [filteredDeals, emails, visits, tasks, contacts, properties])

  const getDealsByStage = (status: Deal["status"]) => {
    return filteredDeals.filter((d) => d.status === status)
  }

  const getStageValue = (status: Deal["status"]) => {
    const stageDeals = getDealsByStage(status)
    const total = stageDeals.reduce((sum, deal) => sum + (deal.priceOffered || 0), 0)
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(total)
  }

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetStatus: Deal["status"]) => {
    e.preventDefault()
    if (draggedDeal && draggedDeal.status !== targetStatus) {
      moveDealToStage(draggedDeal.id, targetStatus)
    }
    setDraggedDeal(null)
  }

  const handleDragEnd = () => {
    setDraggedDeal(null)
  }

  const handleTaskAction = (deal: Deal, action: string) => {
    setSelectedTaskAction({ deal, action })
    setTaskTitle("")
    setTaskDescription("")
    setTaskDueDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    setVisitDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    setVisitStartTime("10:00")
    setVisitEndTime("11:00")

    const contact = getContactById(deal.buyerId)
    if (contact) {
      switch (action) {
        case "call":
          setTaskTitle(`Call ${contact.firstName} ${contact.lastName}`)
          setTaskDescription(`Follow-up call regarding the ${deal.type} deal`)
          break
        case "email":
          setTaskTitle(`Email ${contact.firstName} ${contact.lastName}`)
          setTaskDescription(`Send email regarding the ${deal.type} deal`)
          break
        case "visit":
          setTaskTitle(`Property visit with ${contact.firstName} ${contact.lastName}`)
          break
      }
    }
    setTaskDialogOpen(true)
  }

  const handleCreateTask = () => {
    if (!selectedTaskAction) return
    const { deal, action } = selectedTaskAction

    if (action === "visit") {
      addVisit({
        propertyId: deal.propertyId,
        contactId: deal.buyerId,
        agentId: deal.assignedTo,
        date: visitDate,
        startTime: visitStartTime,
        endTime: visitEndTime,
        status: "scheduled",
        confirmationStatus: "pending",
        notes: taskDescription,
      })
    } else {
      addTask({
        title: taskTitle,
        description: taskDescription,
        assignedTo: deal.assignedTo,
        relatedTo: { type: "deal", id: deal.id },
        priority: action === "call" ? "high" : "medium",
        status: "todo",
        dueDate: taskDueDate,
        completedAt: null,
      })
    }

    setTaskDialogOpen(false)
    setSelectedTaskAction(null)
  }

  const handleViewDetails = (deal: Deal) => {
    setSelectedDeal(deal)
    const suggestion = suggestions.find((s) => s.dealId === deal.id)
    if (suggestion) {
      setEmailSubject(suggestion.suggestedSubject || "")
      setEmailBody(suggestion.suggestedBody || "")
    } else {
      setEmailSubject("")
      setEmailBody("")
    }
    setDetailSheetOpen(true)
  }

  const handleSendEmail = async () => {
    if (!selectedDeal || !emailSubject || !emailBody) return

    const contact = getContactById(selectedDeal.buyerId)
    if (!contact) return

    setIsSendingEmail(true)

    // Simulate sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    addEmail({
      from: { name: "Moi", email: "agent@immobilier.fr" },
      to: [{ name: `${contact.firstName} ${contact.lastName}`, email: contact.email }],
      subject: emailSubject,
      body: emailBody,
      date: new Date().toISOString(),
      status: "read",
      starred: false,
      folder: "sent",
      relatedTo: { type: "deal", id: selectedDeal.id },
    })

    setIsSendingEmail(false)
    setDetailSheetOpen(false)
    setEmailSubject("")
    setEmailBody("")
  }

  const handleGenerateAIEmail = async () => {
    if (!selectedDeal) return

    const contact = getContactById(selectedDeal.buyerId)
    const property = getPropertyById(selectedDeal.propertyId)
    if (!contact || !property) return

    setIsGeneratingAI(true)

    try {
      const response = await fetch("/api/ai/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: `Client: ${contact.firstName} ${contact.lastName}
Property: ${property.address.street}, ${property.address.city}
Price: ${property.price}€
Deal Stage: ${selectedDeal.status}
Deal Type: ${selectedDeal.type}`,
          tone: selectedTone,
          type: "follow-up",
          language: "french",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEmailSubject(data.subject || emailSubject)
        setEmailBody(data.body || emailBody)
      }
    } catch (error) {
      console.error("Error generating email:", error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const getTaskActionTitle = () => {
    if (!selectedTaskAction) return ""
    const { action } = selectedTaskAction
    switch (action) {
      case "call":
        return "Schedule Call"
      case "email":
        return "Send Email"
      case "visit":
        return "Schedule Visit"
      default:
        return "New Task"
    }
  }

  // Get deal-specific data for detail sheet
  const selectedContact = selectedDeal ? getContactById(selectedDeal.buyerId) : null
  const selectedProperty = selectedDeal ? getPropertyById(selectedDeal.propertyId) : null
  const dealEmails =
    selectedDeal && selectedContact
      ? emails
          .filter(
            (e) =>
              (e.relatedTo?.type === "deal" && e.relatedTo.id === selectedDeal.id) ||
              e.from.email === selectedContact.email ||
              e.to.some((t) => t.email === selectedContact.email),
          )
          .slice(0, 10)
      : []
  const dealSuggestion = selectedDeal ? suggestions.find((s) => s.dealId === selectedDeal.id) : null
  const dealVisits =
    selectedDeal && selectedContact
      ? visits.filter((v) => v.contactId === selectedContact.id && v.propertyId === selectedDeal.propertyId)
      : []

  return (
    <>
      {suggestions.filter((s) => s.priority === "urgent" || s.priority === "high").length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {suggestions.filter((s) => s.priority === "urgent").length} relance(s) urgente(s),{" "}
              {suggestions.filter((s) => s.priority === "high").length} prioritaire(s)
            </p>
            <p className="text-xs text-amber-600">
              Cliquez sur les cartes pour voir les suggestions et envoyer des emails
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-amber-600" />
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.id)
          const isDropTarget = draggedDeal && draggedDeal.status !== stage.id

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                  <span className="font-medium text-sm">{stage.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stageDeals.length}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{getStageValue(stage.id)}</span>
              </div>

              <div
                className={cn(
                  "space-y-3 min-h-[200px] rounded-lg transition-colors p-2 -m-2",
                  isDropTarget && "bg-primary/5 border-2 border-dashed border-primary/20",
                )}
              >
                {stageDeals.map((deal) => {
                  const contact = getContactById(deal.buyerId)
                  const property = getPropertyById(deal.propertyId)
                  const relatedTasks = getTasksByDealId(deal.id)
                  const suggestion = suggestions.find((s) => s.dealId === deal.id)

                  return (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onDragStart={handleDragStart}
                      onTaskAction={handleTaskAction}
                      onViewDetails={handleViewDetails}
                      relatedTasks={relatedTasks}
                      contactName={contact ? `${contact.firstName} ${contact.lastName}` : "Unknown"}
                      propertyAddress={property?.address.street || "Unknown"}
                      propertyRef={property?.reference || "N/A"}
                      suggestion={suggestion}
                    />
                  )
                })}

                {stageDeals.length === 0 && (
                  <div
                    className={cn(
                      "flex items-center justify-center h-32 border-2 border-dashed rounded-lg text-sm text-muted-foreground",
                      isDropTarget && "border-primary/40 bg-primary/10",
                    )}
                  >
                    {isDropTarget ? "Drop here" : "No deals"}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Task/Visit Creation Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTaskActionTitle()}</DialogTitle>
            <DialogDescription>
              {selectedTaskAction && (
                <>
                  {selectedTaskAction.action === "visit"
                    ? "Schedule a property visit - this will also appear in the Visits page"
                    : "Create a task - this will also appear in the Tasks page"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {selectedTaskAction?.action === "visit" ? (
              <>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={visitStartTime} onChange={(e) => setVisitStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={visitEndTime} onChange={(e) => setVisitEndTime(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Add any notes for the visit..."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Add details..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>
              {selectedTaskAction?.action === "visit" ? "Schedule Visit" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedContact && `${selectedContact.firstName} ${selectedContact.lastName}`}
              {dealSuggestion && (
                <Badge
                  variant="outline"
                  className={cn(
                    dealSuggestion.priority === "urgent" && "border-red-500 text-red-600",
                    dealSuggestion.priority === "high" && "border-amber-500 text-amber-600",
                  )}
                >
                  {dealSuggestion.priority === "urgent" ? "Urgent" : "À relancer"}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {selectedProperty?.address.street} • {selectedDeal?.status}
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="suggestion" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suggestion" className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Suggestion
              </TabsTrigger>
              <TabsTrigger value="emails" className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Emails ({dealEmails.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestion" className="mt-4 space-y-4">
              {dealSuggestion ? (
                <>
                  <div
                    className={cn(
                      "p-4 rounded-lg",
                      dealSuggestion.priority === "urgent" && "bg-red-50 border border-red-200",
                      dealSuggestion.priority === "high" && "bg-amber-50 border border-amber-200",
                      dealSuggestion.priority === "medium" && "bg-blue-50 border border-blue-200",
                      dealSuggestion.priority === "low" && "bg-slate-50 border border-slate-200",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles
                        className={cn(
                          "h-5 w-5 mt-0.5",
                          dealSuggestion.priority === "urgent" && "text-red-600",
                          dealSuggestion.priority === "high" && "text-amber-600",
                          dealSuggestion.priority === "medium" && "text-blue-600",
                        )}
                      />
                      <div>
                        <p className="font-medium">{dealSuggestion.reason}</p>
                        <p className="text-sm text-muted-foreground mt-1">{dealSuggestion.suggestedAction}</p>
                        {dealSuggestion.lastContactDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Dernier contact: {new Date(dealSuggestion.lastContactDate).toLocaleDateString("fr-FR")}
                            {dealSuggestion.lastContactType && ` (${dealSuggestion.lastContactType})`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Email suggéré</Label>
                      <div className="flex items-center gap-2">
                        <Select value={selectedTone} onValueChange={setSelectedTone}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professionnel</SelectItem>
                            <SelectItem value="friendly">Amical</SelectItem>
                            <SelectItem value="formal">Formel</SelectItem>
                            <SelectItem value="casual">Décontracté</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={handleGenerateAIEmail} disabled={isGeneratingAI}>
                          {isGeneratingAI ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-1" />
                              Régénérer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <Input placeholder="Objet" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                    <Textarea
                      placeholder="Corps de l'email..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="min-h-[200px]"
                    />

                    <Button
                      className="w-full"
                      onClick={handleSendEmail}
                      disabled={isSendingEmail || !emailSubject || !emailBody}
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer l'email
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune suggestion pour le moment</p>
                  <p className="text-sm">Ce contact est bien suivi</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="emails" className="mt-4">
              <ScrollArea className="h-[400px]">
                {dealEmails.length > 0 ? (
                  <div className="space-y-3">
                    {dealEmails.map((email) => (
                      <div
                        key={email.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          email.folder === "sent" ? "bg-blue-50/50" : "bg-background",
                        )}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={email.folder === "sent" ? "default" : "secondary"} className="text-xs">
                              {email.folder === "sent" ? "Envoyé" : "Reçu"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(email.date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="font-medium text-sm">{email.subject}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{email.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun email échangé</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {/* Visits */}
                  {dealVisits.map((visit) => (
                    <div key={visit.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-4 w-4 mt-0.5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">
                          Visite {visit.status === "completed" ? "effectuée" : "prévue"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(visit.date).toLocaleDateString("fr-FR")} à {visit.startTime}
                        </p>
                        {visit.notes && <p className="text-xs text-muted-foreground mt-1">{visit.notes}</p>}
                      </div>
                    </div>
                  ))}

                  {/* Deal created */}
                  {selectedDeal && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Building2 className="h-4 w-4 mt-0.5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium">Deal créé</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedDeal.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  )}

                  {dealVisits.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Historique limité</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}
