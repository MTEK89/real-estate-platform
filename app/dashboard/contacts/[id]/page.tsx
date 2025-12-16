"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataStore } from "@/lib/data-store"
import { ContactActivityTimeline } from "@/components/contact-activity-timeline"
import { ContactLeadScore } from "@/components/contact-lead-score"
import { ContactAISuggestions } from "@/components/contact-ai-suggestions"
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Building2,
  Clock,
  FileText,
  CheckCircle2,
  ClipboardList,
  Plus,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { calculateLeadScore, getScoreColor } from "@/lib/lead-scoring"

const typeStyles: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700",
  buyer: "bg-emerald-100 text-emerald-700",
  seller: "bg-amber-100 text-amber-700",
  investor: "bg-purple-100 text-purple-700",
}

const statusStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  qualified: "bg-emerald-100 text-emerald-700",
  nurturing: "bg-purple-100 text-purple-700",
  closed: "bg-muted text-muted-foreground",
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    contacts,
    properties,
    deals,
    visits,
    tasks,
    contracts,
    emails,
    getPropertyById,
    addVisit,
    addDeal,
    addTask,
    getEmailsByContactId,
  } = useDataStore()

  const contact = contacts.find((c) => c.id === id)

  if (!contact) {
    notFound()
  }

  // Get all related data for this contact
  const contactVisits = visits.filter((v) => v.contactId === id)
  const contactDeals = deals.filter((d) => d.buyerId === id)
  const ownedProperties = properties.filter((p) => p.ownerId === id)
  const contactTasks = tasks.filter(
    (t) =>
      (t.relatedTo?.type === "contact" && t.relatedTo.id === id) ||
      contactDeals.some((d) => t.relatedTo?.type === "deal" && t.relatedTo.id === d.id) ||
      contactVisits.some((v) => t.relatedTo?.type === "visit" && t.relatedTo.id === v.id),
  )
  const contactContracts = contracts.filter((c) => c.contactId === id)
  const contactEmails = getEmailsByContactId(id)

  const leadScore = useMemo(() => {
    return calculateLeadScore(contact, contactDeals, contactVisits, contactTasks, contactEmails)
  }, [contact, contactDeals, contactVisits, contactTasks, contactEmails])

  const scoreColors = getScoreColor(leadScore.grade)

  // Build timeline from all activities
  const timeline = [
    ...contactVisits.map((v) => ({
      id: `visit-${v.id}`,
      type: "visit" as const,
      title: "Property visit",
      description: `Visited ${getPropertyById(v.propertyId)?.address.street || "property"}`,
      date: new Date(v.date),
      icon: Building2,
      status: v.status,
    })),
    ...contactDeals.map((d) => ({
      id: `deal-${d.id}`,
      type: "deal" as const,
      title: `Deal ${d.status}`,
      description: `${d.type === "sale" ? "Sale" : "Rental"} - ${getPropertyById(d.propertyId)?.address.street || "property"}`,
      date: new Date(d.createdAt),
      icon: TrendingUp,
      status: d.status,
    })),
    ...contactContracts.map((c) => ({
      id: `contract-${c.id}`,
      type: "contract" as const,
      title: `Contract ${c.status.replace("_", " ")}`,
      description: `${c.type} - ${getPropertyById(c.propertyId)?.reference || "property"}`,
      date: new Date(c.createdAt),
      icon: FileText,
      status: c.status,
    })),
    ...contactTasks
      .filter((t) => t.status === "completed")
      .map((t) => ({
        id: `task-${t.id}`,
        type: "task" as const,
        title: "Task completed",
        description: t.title,
        date: new Date(t.completedAt || t.createdAt),
        icon: CheckCircle2,
        status: t.status,
      })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(date.toISOString())
  }

  const handleScheduleVisit = () => {
    router.push(`/dashboard/visits/new?contactId=${id}`)
  }

  const handleCreateDeal = () => {
    router.push(`/dashboard/pipeline/new?contactId=${id}`)
  }

  const handleCreateContract = () => {
    router.push(`/dashboard/contracts/new?contactId=${id}`)
  }

  const handleCreateTask = () => {
    addTask({
      title: `Follow up with ${contact.firstName} ${contact.lastName}`,
      description: "",
      assignedTo: "u1",
      relatedTo: { type: "contact", id: contact.id },
      priority: "medium",
      status: "todo",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      completedAt: null,
    })
  }

  // Calculate stats
  const totalDealsValue = contactDeals.reduce((sum, d) => sum + (d.priceOffered || 0), 0)
  const completedVisits = contactVisits.filter((v) => v.status === "completed").length
  const signedContracts = contactContracts.filter((c) => c.status === "signed").length
  const pendingTasks = contactTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description={`Contact since ${formatDate(contact.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge className={cn(scoreColors.bg, scoreColors.text, "border", scoreColors.border, "gap-1")}>
              <Sparkles className="h-3 w-3" />
              {leadScore.total} - {leadScore.label}
            </Badge>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" size="sm">
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Header Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-card-foreground">
                        {contact.firstName} {contact.lastName}
                      </h2>
                      <Badge className={cn(typeStyles[contact.type], "capitalize")}>{contact.type}</Badge>
                      <Badge variant="outline" className={cn(statusStyles[contact.status], "capitalize")}>
                        {contact.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Source: {contact.source}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Last contact: {formatDate(contact.lastContactAt)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {contact.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                    <p className="text-sm text-card-foreground">{contact.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-card-foreground">{contactDeals.length}</div>
                  <p className="text-xs text-muted-foreground">Deals</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-card-foreground">{completedVisits}</div>
                  <p className="text-xs text-muted-foreground">Visits</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-card-foreground">{signedContracts}</div>
                  <p className="text-xs text-muted-foreground">Contracts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-card-foreground">{pendingTasks}</div>
                  <p className="text-xs text-muted-foreground">Open Tasks</p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Tabs */}
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="timeline" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="visits" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Visits</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {contactVisits.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="deals" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Deals</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {contactDeals.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">Tasks</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {pendingTasks}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="emails" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Emails</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {contactEmails.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {timeline.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No activity yet for this contact</p>
                    ) : (
                      <div className="space-y-6">
                        {timeline.slice(0, 10).map((item, index) => (
                          <div key={item.id} className="flex gap-4">
                            <div className="relative">
                              <div
                                className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-full",
                                  item.type === "contract" && item.status === "signed"
                                    ? "bg-emerald-100"
                                    : item.type === "deal"
                                      ? "bg-blue-100"
                                      : "bg-muted",
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    "h-5 w-5",
                                    item.type === "contract" && item.status === "signed"
                                      ? "text-emerald-600"
                                      : item.type === "deal"
                                        ? "text-blue-600"
                                        : "text-muted-foreground",
                                  )}
                                />
                              </div>
                              {index < timeline.length - 1 && (
                                <div className="absolute left-5 top-10 h-full w-px bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <p className="font-medium text-card-foreground">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(item.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visits" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Property Visits</CardTitle>
                    <Button size="sm" onClick={handleScheduleVisit}>
                      <Plus className="h-4 w-4 mr-1" />
                      Schedule Visit
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {contactVisits.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No visits scheduled for this contact</p>
                    ) : (
                      <div className="space-y-4">
                        {contactVisits.map((visit) => {
                          const property = getPropertyById(visit.propertyId)
                          return (
                            <div
                              key={visit.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{property?.address.street}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {visit.date} at {visit.startTime}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={visit.status === "completed" ? "default" : "secondary"}
                                  className={
                                    visit.status === "completed"
                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                      : ""
                                  }
                                >
                                  {visit.status}
                                </Badge>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/dashboard/properties/${visit.propertyId}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deals" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Deals</CardTitle>
                    <Button size="sm" onClick={handleCreateDeal}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Deal
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {contactDeals.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No deals for this contact</p>
                    ) : (
                      <div className="space-y-4">
                        {contactDeals.map((deal) => {
                          const property = getPropertyById(deal.propertyId)
                          return (
                            <div
                              key={deal.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                            >
                              <div>
                                <p className="font-medium">{property?.address.street}</p>
                                <p className="text-sm text-muted-foreground">
                                  {deal.type === "sale" ? "Sale" : "Rental"} |{" "}
                                  {deal.priceOffered
                                    ? `Offered: €${deal.priceOffered.toLocaleString("de-DE")}`
                                    : "No offer yet"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {deal.status}
                                </Badge>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/dashboard/pipeline?deal=${deal.id}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Tasks</CardTitle>
                    <Button size="sm" onClick={handleCreateTask}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Task
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {contactTasks.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No tasks for this contact</p>
                    ) : (
                      <div className="space-y-4">
                        {contactTasks.map((task) => {
                          const priorityColor =
                            task.priority === "urgent"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "high"
                                ? "bg-orange-100 text-orange-700"
                                : task.priority === "medium"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-muted text-muted-foreground"
                          return (
                            <div
                              key={task.id}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-lg border",
                                task.status === "completed" ? "bg-muted/20 opacity-60" : "bg-muted/30",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center",
                                    task.status === "completed" ? "bg-emerald-100" : "bg-muted",
                                  )}
                                >
                                  {task.status === "completed" ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <p className={cn("font-medium", task.status === "completed" && "line-through")}>
                                    {task.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={cn(priorityColor, "capitalize")}>{task.priority}</Badge>
                                <Badge variant="outline" className="capitalize">
                                  {task.status.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emails" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Email History</CardTitle>
                    <Button size="sm" asChild>
                      <Link href="/dashboard/email">
                        <Mail className="h-4 w-4 mr-1" />
                        Compose
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {contactEmails.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No emails with this contact</p>
                    ) : (
                      <div className="space-y-3">
                        {contactEmails.slice(0, 10).map((email) => (
                          <div
                            key={email.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border",
                              email.status === "unread" ? "bg-primary/5 border-primary/20" : "bg-muted/30",
                            )}
                          >
                            <div
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                email.folder === "sent" ? "bg-blue-100" : "bg-emerald-100",
                              )}
                            >
                              <Mail
                                className={cn(
                                  "h-4 w-4",
                                  email.folder === "sent" ? "text-blue-600" : "text-emerald-600",
                                )}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium truncate">
                                  {email.folder === "sent" ? `To: ${email.to[0]?.name}` : `From: ${email.from.name}`}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {new Date(email.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm truncate">{email.subject}</p>
                              <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {/* AI Suggestions - Most Important */}
            <ContactAISuggestions
              contact={contact}
              deals={deals}
              visits={visits}
              tasks={tasks}
              emails={emails}
              properties={properties}
            />

            {/* Lead Score */}
            <ContactLeadScore
              contact={contact}
              deals={contactDeals}
              visits={contactVisits}
              tasks={contactTasks}
              emails={contactEmails}
            />

            {/* Activity Timeline - Always Visible */}
            <ContactActivityTimeline
              visits={contactVisits}
              deals={contactDeals}
              tasks={contactTasks}
              contracts={contactContracts}
              emails={contactEmails}
              getPropertyById={getPropertyById}
              maxItems={10}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleScheduleVisit}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Visit
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleCreateDeal}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Create Deal
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/dashboard/contracts/new?contactId=${id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Contract
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleCreateTask}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
