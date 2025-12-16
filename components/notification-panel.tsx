"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useDataStore } from "@/lib/data-store"
import { generateFollowUpSuggestions } from "@/lib/follow-up-engine"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Mail, Calendar, AlertTriangle, Clock, CheckCircle2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  id: string
  type: "urgent" | "followup" | "visit" | "task" | "email"
  title: string
  description: string
  time: string
  read: boolean
  link?: string
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set())

  const { deals, emails, visits, tasks, contacts, properties, getContactById, getPropertyById, getUnreadEmailCount } =
    useDataStore()

  // Generate notifications from various sources
  const notifications = useMemo(() => {
    const notifs: Notification[] = []

    // AI Follow-up suggestions as notifications
    const suggestions = generateFollowUpSuggestions(deals, emails, visits, tasks, contacts, properties)

    suggestions.slice(0, 5).forEach((s, idx) => {
      const deal = deals.find((d) => d.id === s.dealId)
      const contact = deal ? getContactById(deal.buyerId) : null

      notifs.push({
        id: `suggestion-${s.id}`,
        type: s.priority === "urgent" ? "urgent" : "followup",
        title: s.priority === "urgent" ? "Urgent Follow-up Needed" : "Follow-up Suggestion",
        description: contact ? `${contact.firstName} ${contact.lastName}: ${s.reason}` : s.reason,
        time: `${s.daysSinceLastContact}d ago`,
        read: readNotifications.has(`suggestion-${s.id}`),
        link: "/dashboard/pipeline",
      })
    })

    // Unread emails
    const unreadEmails = emails.filter((e) => e.status === "unread" && e.folder === "inbox").slice(0, 3)
    unreadEmails.forEach((email) => {
      notifs.push({
        id: `email-${email.id}`,
        type: "email",
        title: "New Email",
        description: `${email.from.name}: ${email.subject}`,
        time: new Date(email.date).toLocaleDateString(),
        read: readNotifications.has(`email-${email.id}`),
        link: "/dashboard/email",
      })
    })

    // Today's visits
    const today = new Date().toISOString().split("T")[0]
    const todaysVisits = visits.filter(
      (v) => v.date === today && (v.status === "scheduled" || v.status === "confirmed"),
    )
    todaysVisits.forEach((visit) => {
      const contact = getContactById(visit.contactId)
      const property = getPropertyById(visit.propertyId)
      notifs.push({
        id: `visit-${visit.id}`,
        type: "visit",
        title: "Upcoming Visit",
        description: `${contact?.firstName} ${contact?.lastName} at ${visit.startTime} - ${property?.address.street}`,
        time: visit.startTime,
        read: readNotifications.has(`visit-${visit.id}`),
        link: "/dashboard/visits",
      })
    })

    // Urgent tasks
    const urgentTasks = tasks
      .filter((t) => (t.status === "todo" || t.status === "in_progress") && t.priority === "urgent")
      .slice(0, 3)
    urgentTasks.forEach((task) => {
      notifs.push({
        id: `task-${task.id}`,
        type: "task",
        title: "Urgent Task",
        description: task.title,
        time: task.dueDate,
        read: readNotifications.has(`task-${task.id}`),
        link: "/dashboard/tasks",
      })
    })

    return notifs
  }, [deals, emails, visits, tasks, contacts, properties, readNotifications, getContactById, getPropertyById])

  const unreadCount = notifications.filter((n) => !n.read).length
  const urgentNotifications = notifications.filter((n) => n.type === "urgent" || n.type === "task")
  const activityNotifications = notifications.filter(
    (n) => n.type === "followup" || n.type === "email" || n.type === "visit",
  )

  const markAsRead = (id: string) => {
    setReadNotifications((prev) => new Set([...prev, id]))
  }

  const markAllAsRead = () => {
    setReadNotifications(new Set(notifications.map((n) => n.id)))
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "followup":
        return <Sparkles className="h-4 w-4 text-amber-500" />
      case "visit":
        return <Calendar className="h-4 w-4 text-blue-500" />
      case "task":
        return <CheckCircle2 className="h-4 w-4 text-purple-500" />
      case "email":
        return <Mail className="h-4 w-4 text-emerald-500" />
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-transparent">
              All
            </TabsTrigger>
            <TabsTrigger value="urgent" className="data-[state=active]:bg-transparent">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Urgent
              {urgentNotifications.filter((n) => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                  {urgentNotifications.filter((n) => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-transparent">
              Activity
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <TabsContent value="all" className="m-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      icon={getIcon(notif.type)}
                      onRead={() => markAsRead(notif.id)}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="urgent" className="m-0">
              {urgentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No urgent items</p>
                </div>
              ) : (
                <div className="divide-y">
                  {urgentNotifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      icon={getIcon(notif.type)}
                      onRead={() => markAsRead(notif.id)}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="m-0">
              {activityNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y">
                  {activityNotifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      icon={getIcon(notif.type)}
                      onRead={() => markAsRead(notif.id)}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function NotificationItem({
  notification,
  icon,
  onRead,
  onClose,
}: {
  notification: Notification
  icon: React.ReactNode
  onRead: () => void
  onClose: () => void
}) {
  const handleClick = () => {
    onRead()
    onClose()
  }

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.read && "bg-primary/5",
      )}
      onClick={handleClick}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium", !notification.read && "font-semibold")}>{notification.title}</p>
          {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{notification.description}</p>
        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
      </div>
    </div>
  )

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>
  }

  return content
}
