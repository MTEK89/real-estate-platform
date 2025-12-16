"use client"

import type React from "react"

import { useEffect, useState, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useDataStore } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Mail,
  Search,
  Star,
  StarOff,
  Archive,
  Trash2,
  Reply,
  Forward,
  MoreHorizontal,
  Send,
  Inbox,
  Plus,
  Sparkles,
  Loader2,
  Settings,
  Link2,
  User,
  Building2,
  Flame,
  Clock,
  AlertCircle,
  Globe,
  Phone,
  Home,
  Euro,
  MapPin,
  Eye,
  Zap,
  CalendarPlus,
  StickyNote,
  RefreshCw,
  Filter,
  PanelRight,
  MailOpen,
  CheckCheck,
  List,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Printer,
  ExternalLink,
  AlertOctagon,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Email } from "@/lib/mock-data"
import { extractEmailLeadInsights } from "@/lib/email-intelligence"
import Link from "next/link"

// Email templates for quick responses
const EMAIL_TEMPLATES = [
  {
    id: "available",
    label: "Je suis disponible",
    subject: "Re: Visite",
    body: "Bonjour,\n\nJe suis disponible pour une visite. Quelles sont vos disponibilités cette semaine ?\n\nCordialement,\n{{agentName}}\n{{agencyName}}\n{{agentPhone}}",
  },
  {
    id: "property-details",
    label: "Détails du bien",
    subject: "Détails du bien - {{property}}",
    body: "Bonjour,\n\nVoici les informations détaillées concernant le bien qui vous intéresse :\n\n[Insérer les détails]\n\nN'hésitez pas à me contacter pour organiser une visite.\n\nCordialement,\n{{agentName}}",
  },
  {
    id: "schedule-visit",
    label: "Proposer une visite",
    subject: "Proposition de visite",
    body: "Bonjour,\n\nJe vous propose les créneaux suivants pour une visite :\n\n- [Date 1]\n- [Date 2]\n- [Date 3]\n\nMerci de me confirmer votre disponibilité.\n\nCordialement,\n{{agentName}}",
  },
  {
    id: "thank-visit",
    label: "Merci pour la visite",
    subject: "Suite à notre visite",
    body: "Bonjour,\n\nJe tenais à vous remercier pour votre visite aujourd'hui. J'espère que le bien a répondu à vos attentes.\n\nN'hésitez pas à me faire part de vos impressions et questions.\n\nCordialement,\n{{agentName}}",
  },
  {
    id: "follow-up",
    label: "Relance",
    subject: "Suivi de votre recherche",
    body: "Bonjour,\n\nJe me permets de revenir vers vous concernant votre projet immobilier. Avez-vous eu le temps de réfléchir à notre dernière conversation ?\n\nJe reste à votre disposition.\n\nCordialement,\n{{agentName}}",
  },
]

// Smart folder definitions
type SmartFolder = "today" | "all" | "hot-leads" | "pending-response" | "needs-followup" | "portals" | "sent" | "archived"
type TodayQueue = "now" | "waiting" | "fyi"

export default function EmailPage() {
  const {
    emails,
    emailAccounts,
    contacts,
    properties,
    deals,
    visits,
    tasks,
    markEmailRead,
    markEmailUnread,
    starEmail,
    unstarEmail,
    archiveEmail,
    deleteEmail,
    addEmail,
    addEmailAccount,
    removeEmailAccount,
    getContactById,
    addContact,
    updateContact,
    updateEmail,
    addTask,
    currentUserId,
  } = useDataStore()

  const [agentName, setAgentName] = useState<string>("Agent")
  const [agentPhone, setAgentPhone] = useState<string>("")
  const [agencyName, setAgencyName] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/v1/settings")
        const json = await res.json().catch(() => ({}))
        if (!res.ok) return
        if (cancelled) return
        const first = typeof json?.profile?.firstName === "string" ? json.profile.firstName : ""
        const last = typeof json?.profile?.lastName === "string" ? json.profile.lastName : ""
        setAgentName([first, last].filter(Boolean).join(" ") || "Agent")
        setAgentPhone(typeof json?.profile?.phone === "string" ? json.profile.phone : "")
        setAgencyName(typeof json?.agency?.name === "string" ? json.agency.name : "")
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const fillTemplate = (body: string) => {
    let out = body
      .replaceAll("{{agentName}}", agentName)
      .replaceAll("{{agencyName}}", agencyName)
      .replaceAll("{{agentPhone}}", agentPhone)
    // Collapse any leftover blank lines when optional fields are empty.
    out = out.replace(/\n{3,}/g, "\n\n")
    return out.trimEnd()
  }

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFolder, setActiveFolder] = useState<SmartFolder>("today")
  const [activeTodayQueue, setActiveTodayQueue] = useState<TodayQueue>("now")
  const [composeOpen, setComposeOpen] = useState(false)
  const [replyMode, setReplyMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const [quickNote, setQuickNote] = useState("")
  const [pendingAIDraft, setPendingAIDraft] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable")
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([])
  const [leadFirstName, setLeadFirstName] = useState("")
  const [leadLastName, setLeadLastName] = useState("")
  const [leadPhone, setLeadPhone] = useState("")
  const [leadBudgetEur, setLeadBudgetEur] = useState("")
  const [leadPropertyRef, setLeadPropertyRef] = useState("")
  const [leadReason, setLeadReason] = useState("")
  const [leadNotes, setLeadNotes] = useState("")
  const [isCreatingLead, setIsCreatingLead] = useState(false)

  // Compose state
  const [composeTo, setComposeTo] = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeBody, setComposeBody] = useState("")
  const [selectedContact, setSelectedContact] = useState<string>("")
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [aiTone, setAiTone] = useState<string>("professional")
  const [aiContext, setAiContext] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Connect account state
  const [connectProvider, setConnectProvider] = useState<"gmail" | "outlook" | "imap">("gmail")
  const [connectEmail, setConnectEmail] = useState("")

  // Get contact context for selected email
  const selectedEmailContext = useMemo(() => {
    if (!selectedEmail?.relatedTo) return null

    if (selectedEmail.relatedTo.type === "contact") {
      const contact = contacts.find((c) => c.id === selectedEmail.relatedTo?.id)
      if (!contact) return null

      // Get all related data for this contact
      const contactDeals = deals.filter((d) => d.contactId === contact.id)
      const contactVisits = visits.filter((v) => v.contactId === contact.id)
      const contactEmails = emails.filter((e) => e.relatedTo?.type === "contact" && e.relatedTo.id === contact.id)
      const contactTasks = tasks.filter((t) => t.relatedTo?.id === contact.id)

      // Get interested properties
      const interestedPropertyIds = contactDeals.map((d) => d.propertyId)
      const interestedProperties = properties.filter((p) => interestedPropertyIds.includes(p.id))

      return {
        contact,
        deals: contactDeals,
        visits: contactVisits,
        emails: contactEmails,
        tasks: contactTasks,
        properties: interestedProperties,
      }
    }
    return null
  }, [selectedEmail, contacts, deals, visits, emails, tasks, properties])

  const linkedContact = useMemo(() => {
    if (!selectedEmail?.relatedTo) return null
    if (selectedEmail.relatedTo.type !== "contact") return null
    return contacts.find((c) => c.id === selectedEmail.relatedTo?.id) || null
  }, [selectedEmail, contacts])

  // Smart categorized emails
  const categorizedEmails = useMemo(() => {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return {
      all: emails.filter((e) => e.folder === "inbox"),
      hotLeads: emails.filter((e) => {
        if (e.folder !== "inbox") return false
        // Hot leads: unread, starred, or from contacts with active deals
        const isUnread = e.status === "unread"
        const isStarred = e.starred
        const isFromActiveContact =
          e.relatedTo?.type === "contact" && deals.some((d) => d.contactId === e.relatedTo?.id && d.stage !== "closed")
        return isUnread || isStarred || isFromActiveContact
      }),
      pendingResponse: emails.filter((e) => {
        if (e.folder !== "inbox") return false
        // Pending: received within 3 days and not replied to
        const emailDate = new Date(e.receivedAt)
        return emailDate >= threeDaysAgo && e.status === "unread"
      }),
      needsFollowup: emails.filter((e) => {
        if (e.folder !== "inbox") return false
        // Needs follow-up: read but older than 7 days with no recent outgoing
        const emailDate = new Date(e.receivedAt)
        return emailDate <= sevenDaysAgo && e.status === "read"
      }),
      portals: emails.filter((e) => {
        if (e.folder !== "inbox") return false
        // Portals: from immotop, athome, or other portals
        const portalDomains = ["immotop.lu", "athome.lu", "immobilier.lu", "wortimmo.lu"]
        return portalDomains.some((domain) => e.from.email.includes(domain))
      }),
      sent: emails.filter((e) => e.folder === "sent"),
      archived: emails.filter((e) => e.folder === "archived"),
    }
  }, [emails, deals])

  const filteredEmails = useMemo(() => {
    let folderEmails: Email[] = []

    switch (activeFolder) {
      case "hot-leads":
        folderEmails = categorizedEmails.hotLeads
        break
      case "pending-response":
        folderEmails = categorizedEmails.pendingResponse
        break
      case "needs-followup":
        folderEmails = categorizedEmails.needsFollowup
        break
      case "portals":
        folderEmails = categorizedEmails.portals
        break
      case "sent":
        folderEmails = categorizedEmails.sent
        break
      case "archived":
        folderEmails = categorizedEmails.archived
        break
      default:
        folderEmails = categorizedEmails.all
    }

    if (!searchQuery) return folderEmails

    return folderEmails.filter(
      (email) =>
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.preview.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [activeFolder, categorizedEmails, searchQuery])

  const todayThreads = useMemo(() => {
    const portalDomains = ["immotop.lu", "athome.lu", "immobilier.lu", "wortimmo.lu"]

    const normalizeSubject = (subject: string) => {
      let s = subject.trim()
      // Strip common reply/forward prefixes repeatedly
      // Examples: "Re:", "Fwd:", "AW:", "TR:"
      // Keep it simple for mock-local threading.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const next = s.replace(/^\s*(re|fw|fwd|aw|tr)\s*:\s*/i, "")
        if (next === s) break
        s = next
      }
      return s
    }

    const getCounterpart = (email: Email) => {
      if (email.folder === "sent") {
        return {
          name: email.to?.[0]?.name || email.to?.[0]?.email || "Client",
          email: email.to?.[0]?.email || "unknown@email",
        }
      }
      return { name: email.from.name, email: email.from.email }
    }

    const groups = new Map<
      string,
      {
        id: string
        subject: string
        normalizedSubject: string
        counterpartName: string
        counterpartEmail: string
        emails: Email[]
      }
    >()

    for (const email of emails) {
      if (email.folder === "drafts") continue
      if (email.folder === "archived") continue
      const counterpart = getCounterpart(email)
      const normalized = normalizeSubject(email.subject)
      const key = `${counterpart.email.toLowerCase()}|${normalized.toLowerCase()}`
      const existing = groups.get(key)
      if (existing) {
        existing.emails.push(email)
      } else {
        groups.set(key, {
          id: key,
          subject: normalized || email.subject,
          normalizedSubject: normalized,
          counterpartName: counterpart.name,
          counterpartEmail: counterpart.email,
          emails: [email],
        })
      }
    }

    const now = Date.now()
    const ageLabel = (iso: string) => {
      const t = new Date(iso).getTime()
      const diffMins = Math.max(0, Math.floor((now - t) / (1000 * 60)))
      if (diffMins < 60) return `${diffMins}m`
      const diffHrs = Math.floor(diffMins / 60)
      if (diffHrs < 24) return `${diffHrs}h`
      const diffDays = Math.floor(diffHrs / 24)
      return `${diffDays}j`
    }

    return Array.from(groups.values())
      .map((g) => {
        const sorted = [...g.emails].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
        const latest = sorted[0]
        const latestInbound = sorted.find((e) => e.folder === "inbox") || latest
        const unreadCount = g.emails.filter((e) => e.folder === "inbox" && e.status === "unread").length
        const isPortal = portalDomains.some((d) => latestInbound.from.email.includes(d))

        const contact =
          contacts.find((c) => (c.email || "").toLowerCase() === g.counterpartEmail.toLowerCase()) || null
        const openTasks = contact
          ? tasks.filter(
              (t) =>
                t.relatedTo?.type === "contact" &&
                t.relatedTo.id === contact.id &&
                (t.status === "todo" || t.status === "in_progress"),
            )
          : []

        const dueSoonMs = now + 24 * 60 * 60 * 1000
        const hasOverdueTask = openTasks.some((t) => new Date(t.dueDate).getTime() < now)
        const hasDueSoonTask = openTasks.some((t) => new Date(t.dueDate).getTime() <= dueSoonMs)

        const insights = extractEmailLeadInsights(latestInbound)
        const actionableText = `${latestInbound.subject}\n${latestInbound.preview}\n${latestInbound.body}`
        const looksActionable =
          /(\?|question|visite|visit|viewing|interested|intéress|budget|€|eur|parking|rdv|rendez-vous)/i.test(
            actionableText,
          )

        let queue: TodayQueue = "fyi"
        if (latest.folder === "sent") queue = "waiting"
        else if (unreadCount > 0) queue = "now"
        else if (hasOverdueTask || hasDueSoonTask) queue = "now"
        else if (looksActionable) queue = "now"

        let priorityScore = 0
        if (queue === "now") priorityScore += 6
        if (unreadCount > 0) priorityScore += 3
        if (isPortal) priorityScore += 3
        if (hasOverdueTask) priorityScore += 4
        if (hasDueSoonTask) priorityScore += 2
        if (insights.intent === "sell") priorityScore += 4
        if (insights.intent === "buy" || insights.intent === "rent") priorityScore += 2
        if (insights.budgetEur && insights.budgetEur >= 700000) priorityScore += 2
        if (/urgent|asap|rapid|immédiat|vite/i.test(actionableText)) priorityScore += 3

        const priority =
          priorityScore >= 10 ? "high" : priorityScore >= 6 ? "medium" : "low"

        const slaText =
          queue === "now" && latestInbound.folder === "inbox"
            ? (() => {
                const dueMins = isPortal ? 5 : 60
                const dueAt = new Date(latestInbound.receivedAt).getTime() + dueMins * 60 * 1000
                const minsLeft = Math.floor((dueAt - now) / (60 * 1000))
                if (minsLeft <= 0) return "En retard"
                if (minsLeft < 60) return `dans ${minsLeft}m`
                return `dans ${Math.floor(minsLeft / 60)}h`
              })()
            : ageLabel(latestInbound.receivedAt)

        const aiParts: string[] = []
        if (insights.intent !== "unknown") aiParts.push(`intention:${insights.intent}`)
        if (insights.budgetEur) aiParts.push(`budget ${insights.budgetEur.toLocaleString("fr-LU")}€`)
        if (insights.propertyReference) aiParts.push(insights.propertyReference)
        aiParts.push(insights.reason)

        return {
          id: g.id,
          subject: g.subject,
          counterpartName: g.counterpartName,
          counterpartEmail: g.counterpartEmail,
          emails: sorted,
          latest,
          latestInbound,
          unreadCount,
          isPortal,
          contact,
          openTasksCount: openTasks.length,
          queue,
          priority,
          priorityScore,
          slaText,
          aiLine: aiParts.filter(Boolean).join(" • "),
          insights,
        }
      })
      .sort((a, b) => {
        if (a.queue !== b.queue) return a.queue === "now" ? -1 : b.queue === "now" ? 1 : 0
        if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore
        return new Date(b.latestInbound.receivedAt).getTime() - new Date(a.latestInbound.receivedAt).getTime()
      })
  }, [emails, contacts, tasks])

  const todayCounts = useMemo(() => {
    return {
      now: todayThreads.filter((t) => t.queue === "now").length,
      waiting: todayThreads.filter((t) => t.queue === "waiting").length,
      fyi: todayThreads.filter((t) => t.queue === "fyi").length,
    }
  }, [todayThreads])

  const filteredTodayThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = todayThreads.filter((t) => t.queue === activeTodayQueue)
    if (!q) return base
    return base.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.counterpartName.toLowerCase().includes(q) ||
        t.counterpartEmail.toLowerCase().includes(q) ||
        t.aiLine.toLowerCase().includes(q),
    )
  }, [todayThreads, activeTodayQueue, searchQuery])

  const visibleEmailIds = useMemo(() => filteredEmails.map((e) => e.id), [filteredEmails])

  const selectedEmails = useMemo(
    () => emails.filter((e) => selectedEmailIds.includes(e.id)),
    [emails, selectedEmailIds],
  )

  const selectedThread = useMemo(() => {
    if (!selectedEmail) return null
    return todayThreads.find((t) => t.emails.some((e) => e.id === selectedEmail.id)) || null
  }, [selectedEmail, todayThreads])

  const threadMessages = useMemo(() => {
    if (!selectedEmail) return []
    const list = selectedThread?.emails?.length ? selectedThread.emails : [selectedEmail]
    return [...list].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime())
  }, [selectedEmail, selectedThread])

  const defaultExpandedMessageIds = useMemo(() => {
    if (threadMessages.length === 0) return []
    const last = threadMessages[threadMessages.length - 1]?.id
    const prev = threadMessages.length > 1 ? threadMessages[threadMessages.length - 2]?.id : null
    return [prev, last].filter(Boolean) as string[]
  }, [threadMessages])

  const [expandedMessageIds, setExpandedMessageIds] = useState<string[]>([])

  useEffect(() => {
    setExpandedMessageIds(defaultExpandedMessageIds)
  }, [selectedEmail?.id, defaultExpandedMessageIds])

  const selectedVisibleCount = useMemo(() => {
    if (visibleEmailIds.length === 0) return 0
    const set = new Set(selectedEmailIds)
    return visibleEmailIds.reduce((acc, id) => (set.has(id) ? acc + 1 : acc), 0)
  }, [selectedEmailIds, visibleEmailIds])

  const masterChecked: boolean | "indeterminate" =
    selectedVisibleCount === 0 ? false : selectedVisibleCount === visibleEmailIds.length ? true : "indeterminate"

  const anyUnreadSelected = useMemo(() => selectedEmails.some((e) => e.status === "unread"), [selectedEmails])
  const anyUnstarredSelected = useMemo(() => selectedEmails.some((e) => !e.starred), [selectedEmails])

  const setAllVisibleSelected = (next: boolean) => {
    setSelectedEmailIds((prev) => {
      const prevSet = new Set(prev)
      for (const id of visibleEmailIds) prevSet.delete(id)
      if (next) for (const id of visibleEmailIds) prevSet.add(id)
      return Array.from(prevSet)
    })
  }

  const setRowSelected = (id: string, next: boolean) => {
    setSelectedEmailIds((prev) => {
      const set = new Set(prev)
      if (next) set.add(id)
      else set.delete(id)
      return Array.from(set)
    })
  }

  const clearSelection = () => setSelectedEmailIds([])

  const bulkArchive = () => {
    for (const id of selectedEmailIds) archiveEmail(id)
    clearSelection()
  }

  const bulkDelete = () => {
    const deletingSelected = selectedEmail ? selectedEmailIds.includes(selectedEmail.id) : false
    for (const id of selectedEmailIds) deleteEmail(id)
    if (deletingSelected) setSelectedEmail(null)
    clearSelection()
  }

  const bulkMarkReadToggle = () => {
    for (const id of selectedEmailIds) {
      const email = emails.find((e) => e.id === id)
      if (!email) continue
      if (anyUnreadSelected) markEmailRead(id)
      else markEmailUnread(id)
    }
    clearSelection()
  }

  const bulkStarToggle = () => {
    for (const id of selectedEmailIds) {
      const email = emails.find((e) => e.id === id)
      if (!email) continue
      if (anyUnstarredSelected) starEmail(id)
      else unstarEmail(id)
    }
    clearSelection()
  }

  const readerEmailIds = useMemo(() => {
    if (activeFolder === "today") return filteredTodayThreads.map((t) => t.latestInbound.id)
    return filteredEmails.map((e) => e.id)
  }, [activeFolder, filteredTodayThreads, filteredEmails])

  const selectedEmailIndex = useMemo(() => {
    if (!selectedEmail) return -1
    return readerEmailIds.indexOf(selectedEmail.id)
  }, [readerEmailIds, selectedEmail])

  const canGoPrev = selectedEmailIndex > 0
  const canGoNext = selectedEmailIndex >= 0 && selectedEmailIndex < readerEmailIds.length - 1

  const goPrev = () => {
    if (!canGoPrev) return
    const id = readerEmailIds[selectedEmailIndex - 1]
    const email = emails.find((e) => e.id === id)
    if (email) handleSelectEmail(email)
  }

  const goNext = () => {
    if (!canGoNext) return
    const id = readerEmailIds[selectedEmailIndex + 1]
    const email = emails.find((e) => e.id === id)
    if (email) handleSelectEmail(email)
  }

  const rangeLabel = useMemo(() => {
    if (!selectedEmail || selectedEmailIndex < 0 || readerEmailIds.length === 0) return "0"
    return `${selectedEmailIndex + 1} sur ${readerEmailIds.length}`
  }, [readerEmailIds.length, selectedEmail, selectedEmailIndex])

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email)
    if (email.status === "unread") {
      markEmailRead(email.id)
    }
    if (!email.relatedTo) {
      const fromEmail = email.from.email.toLowerCase()
      const matched = contacts.find((c) => (c.email || "").toLowerCase() === fromEmail)
      if (matched) {
        const relatedTo = { type: "contact" as const, id: matched.id }
        updateEmail(email.id, { relatedTo })
        setSelectedEmail({ ...email, relatedTo })
      }
    }
  }

  const applyComposeLinkDefaults = (email: Email, opts?: { force?: boolean }) => {
    const force = opts?.force ?? false

    let contactId = ""
    let propertyId = ""

    if (email.relatedTo?.type === "contact") {
      contactId = email.relatedTo.id
    } else if (email.relatedTo?.type === "property") {
      propertyId = email.relatedTo.id
    } else if (email.relatedTo?.type === "deal") {
      const deal = deals.find((d) => d.id === email.relatedTo?.id)
      if (deal) {
        // Deal shape differs in mock data; support both.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyDeal = deal as any
        contactId = anyDeal.contactId || anyDeal.buyerId || ""
        propertyId = anyDeal.propertyId || ""
      }
    }

    if (!propertyId) {
      const insights = extractEmailLeadInsights(email)
      if (insights.propertyReference) {
        const p = properties.find((pp) => pp.reference === insights.propertyReference)
        if (p) propertyId = p.id
      }
    }

    if ((force || !selectedContact) && contactId) setSelectedContact(contactId)
    if ((force || !selectedProperty) && propertyId) setSelectedProperty(propertyId)
  }

  const draftWithAIForEmail = (email: Email, contactId?: string) => {
    const to = email.folder === "sent" ? email.to?.[0]?.email || "" : email.from.email
    setSelectedEmail(email)
    setReplyMode(true)
    setComposeTo(to)
    setComposeSubject(`Re: ${email.subject}`)
    setComposeBody("")
    setAiContext(`Répondre à: ${email.subject}`)
    applyComposeLinkDefaults(email, { force: true })
    if (contactId) setSelectedContact(contactId)
    setComposeOpen(true)
    setPendingAIDraft(true)
  }

  const proposeVisitSlotsForEmail = (email: Email, contactId?: string) => {
    const to = email.folder === "sent" ? email.to?.[0]?.email || "" : email.from.email
    const start = new Date()
    const slot1 = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    const slot2 = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000)
    const slot3 = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toLocaleDateString("fr-LU", { weekday: "long", day: "numeric", month: "short" })

    setSelectedEmail(email)
    setReplyMode(true)
    setComposeTo(to)
    setComposeSubject(`Re: ${email.subject}`)
    setComposeBody(
      fillTemplate(
        `Bonjour,\n\nJe vous propose 3 créneaux pour une visite :\n\n- ${fmt(slot1)} à 18:00\n- ${fmt(slot2)} à 12:30\n- ${fmt(slot3)} à 17:15\n\nQuel créneau vous convient ?\n\nCordialement,\n{{agentName}}`,
      ),
    )
    applyComposeLinkDefaults(email, { force: true })
    if (contactId) setSelectedContact(contactId)
    setComposeOpen(true)
  }

  const scheduleFollowUp = (hours: number) => {
    if (!selectedEmail) return
    const counterpartEmail =
      selectedEmail.folder === "sent" ? selectedEmail.to?.[0]?.email || "" : selectedEmail.from.email
    const counterpartName =
      selectedEmail.folder === "sent" ? selectedEmail.to?.[0]?.name || "Client" : selectedEmail.from.name

    const contact =
      selectedThread?.contact ||
      (selectedEmail.relatedTo?.type === "contact" ? contacts.find((c) => c.id === selectedEmail.relatedTo?.id) : null) ||
      contacts.find((c) => (c.email || "").toLowerCase() === counterpartEmail.toLowerCase()) ||
      null

    addTask({
      title: `Relance: ${contact ? `${contact.firstName} ${contact.lastName}` : counterpartName}`,
      description: `Relance suite à l’email: ${selectedEmail.subject}\n\nDestinataire: ${counterpartName} <${counterpartEmail}>`,
      assignedTo: currentUserId ?? "u1",
      relatedTo: contact ? { type: "contact", id: contact.id } : null,
      priority: "medium",
      status: "todo",
      dueDate: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
      completedAt: null,
    })
  }

  const draftFollowUpWithAI = () => {
    if (!selectedEmail) return
    const to = selectedEmail.folder === "sent" ? selectedEmail.to?.[0]?.email || "" : selectedEmail.from.email
    const contactId =
      selectedThread?.contact?.id || (selectedEmail.relatedTo?.type === "contact" ? selectedEmail.relatedTo.id : undefined)
    setReplyMode(true)
    setComposeTo(to)
    setComposeSubject(`Re: ${selectedEmail.subject}`)
    setComposeBody("")
    setAiContext(`Relance (follow-up) concernant: ${selectedEmail.subject}`)
    applyComposeLinkDefaults(selectedEmail, { force: true })
    setSelectedContact(contactId || selectedContact || "")
    setComposeOpen(true)
    setPendingAIDraft(true)
  }

  const handleSelectTodayThread = (thread: (typeof todayThreads)[number]) => {
    setSelectedEmail(thread.latestInbound)
    for (const e of thread.emails) {
      if (e.folder === "inbox" && e.status === "unread") markEmailRead(e.id)
    }
    if (!thread.latestInbound.relatedTo && thread.contact) {
      updateEmail(thread.latestInbound.id, { relatedTo: { type: "contact", id: thread.contact.id } })
      setSelectedEmail({ ...thread.latestInbound, relatedTo: { type: "contact", id: thread.contact.id } })
    }
  }

  const leadInsights = useMemo(() => {
    if (!selectedEmail) return null
    if (selectedEmail.relatedTo?.type === "contact") return null
    return extractEmailLeadInsights(selectedEmail)
  }, [selectedEmail])

  const inferredProperty = useMemo(() => {
    if (!leadInsights?.propertyReference) return null
    return properties.find((p) => p.reference === leadInsights.propertyReference) || null
  }, [leadInsights, properties])

  useEffect(() => {
    if (!leadInsights) return
    setLeadFirstName(leadInsights.suggestedFirstName)
    setLeadLastName(leadInsights.suggestedLastName)
    setLeadPhone(leadInsights.phone || "")
    setLeadBudgetEur(leadInsights.budgetEur ? String(leadInsights.budgetEur) : "")
    setLeadPropertyRef(leadInsights.propertyReference || "")
    setLeadReason(leadInsights.reason)
    setLeadNotes(leadInsights.notes)
  }, [leadInsights])

  const createLeadFromSelectedEmail = async (opts?: { draftWithAI?: boolean }) => {
    if (!selectedEmail || !leadInsights) return
    if (isCreatingLead) return
    setIsCreatingLead(true)
    try {
      const budgetN = Number.parseInt(leadBudgetEur.replace(/[^\d]/g, ""), 10)
      const budgetTag = Number.isFinite(budgetN) && budgetN > 0 ? `budget:${budgetN}` : null

      const newContact = addContact({
        type: leadInsights.intent === "sell" ? "seller" : "lead",
        firstName: leadFirstName.trim() || leadInsights.suggestedFirstName,
        lastName: leadLastName.trim() || leadInsights.suggestedLastName,
        email: leadInsights.fromEmail,
        phone: leadPhone.trim() || null,
        source: "Email",
        status: "new",
        assignedTo: currentUserId ?? "u1",
        tags: Array.from(
          new Set(
            [
              ...leadInsights.tags,
              budgetTag,
              leadPropertyRef.trim() ? `property:${leadPropertyRef.trim()}` : null,
              leadInsights.intent !== "unknown" ? `intent:${leadInsights.intent}` : null,
              "source:email",
            ].filter(Boolean) as string[],
          ),
        ),
        notes: leadNotes.trim() || leadInsights.notes,
        lastContactAt: null,
      })

      updateEmail(selectedEmail.id, { relatedTo: { type: "contact", id: newContact.id } })
      setSelectedEmail({ ...selectedEmail, relatedTo: { type: "contact", id: newContact.id } })

      addTask({
        title: `Reply to ${newContact.firstName} ${newContact.lastName}`,
        description: `Inbound email: ${selectedEmail.subject}\n\n${leadReason}`.trim(),
        assignedTo: currentUserId ?? "u1",
        relatedTo: { type: "contact", id: newContact.id },
        priority: "high",
        status: "todo",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        completedAt: null,
      })

      if (opts?.draftWithAI) {
        setSelectedContact(newContact.id)
        setReplyMode(true)
        setComposeTo(leadInsights.fromEmail)
        setComposeSubject(`Re: ${selectedEmail.subject}`)
        setComposeBody("")
        setAiContext(`Répondre à: ${selectedEmail.subject}`)
        setComposeOpen(true)
        setPendingAIDraft(true)
      }
    } finally {
      setIsCreatingLead(false)
    }
  }

  const handleReply = () => {
    if (!selectedEmail) return
    applyComposeLinkDefaults(selectedEmail, { force: true })
    setReplyMode(true)
    setComposeTo(selectedEmail.from.email)
    setComposeSubject(`Re: ${selectedEmail.subject}`)
    setComposeBody("")
    setComposeOpen(true)
  }

  const handleUseTemplate = (template: (typeof EMAIL_TEMPLATES)[0]) => {
    if (!selectedEmail) return
    applyComposeLinkDefaults(selectedEmail, { force: true })
    setReplyMode(true)
    setComposeTo(selectedEmail.from.email)
    setComposeSubject(template.subject.replace("{{property}}", ""))
    setComposeBody(fillTemplate(template.body))
    setComposeOpen(true)
  }

  const handleAIDraft = async () => {
    setIsGenerating(true)
    try {
      const contact = selectedContact ? contacts.find((c) => c.id === selectedContact) : null
      const property = selectedProperty ? properties.find((p) => p.id === selectedProperty) : null

      const response = await fetch("/api/ai/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: aiContext || composeSubject,
          tone: aiTone,
          originalEmail: replyMode && selectedEmail ? selectedEmail.body : null,
          contactName: contact ? `${contact.firstName} ${contact.lastName}` : null,
          propertyInfo: property
            ? `${property.reference} - ${property.address.street}, ${property.address.city}`
            : null,
        }),
      })

      const data = await response.json()
      if (data.draft) {
        setComposeBody(data.draft)
      }
    } catch (error) {
      console.error("Failed to generate draft:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (!pendingAIDraft) return
    if (!composeOpen) return
    if (isGenerating) return
    setPendingAIDraft(false)
    void handleAIDraft()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAIDraft, composeOpen])

  useEffect(() => {
    if (!composeOpen) return
    if (!selectedEmail) return
    applyComposeLinkDefaults(selectedEmail, { force: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composeOpen, selectedEmail?.id])

  const handleDraftWithAIReply = () => {
    if (!selectedEmail) return
    applyComposeLinkDefaults(selectedEmail, { force: true })
    setReplyMode(true)
    setComposeTo(selectedEmail.from.email)
    setComposeSubject(`Re: ${selectedEmail.subject}`)
    setComposeBody("")
    setAiContext(`Répondre à: ${selectedEmail.subject}`)
    setComposeOpen(true)
    setPendingAIDraft(true)
  }

  const handleSendEmail = () => {
    if (!composeTo || !composeSubject) return

    const relatedTo =
      selectedContact
        ? ({ type: "contact", id: selectedContact } as const)
        : selectedProperty
          ? ({ type: "property", id: selectedProperty } as const)
          : selectedEmail?.relatedTo
            ? selectedEmail.relatedTo
            : undefined

    addEmail({
      from: { name: "Sarah Johnson", email: "sarah.johnson@propflow.com" },
      to: [{ name: composeTo.split("@")[0], email: composeTo }],
      subject: composeSubject,
      body: composeBody,
      preview: composeBody.substring(0, 100) + "...",
      status: "sent",
      folder: "sent",
      starred: false,
      relatedTo,
      receivedAt: new Date().toISOString(),
      readAt: null,
    })

    setComposeOpen(false)
    setComposeTo("")
    setComposeSubject("")
    setComposeBody("")
    setSelectedContact("")
    setSelectedProperty("")
    setReplyMode(false)
  }

  const handleConnectAccount = () => {
    addEmailAccount({
      email: connectEmail,
      provider: connectProvider,
      name: `${connectProvider.charAt(0).toUpperCase() + connectProvider.slice(1)} Account`,
      connected: true,
      lastSyncedAt: new Date().toISOString(),
    })
    setConnectEmail("")
    setSettingsOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday) {
      return date.toLocaleTimeString("fr-LU", { hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleDateString("fr-LU", { month: "short", day: "numeric" })
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return date.toLocaleDateString("fr-LU", { day: "numeric", month: "short" })
  }

  const smartFolders: { id: SmartFolder; label: string; icon: React.ReactNode; count: number; color?: string }[] = [
    { id: "today", label: "Today", icon: <Zap className="h-4 w-4" />, count: todayCounts.now, color: "text-primary" },
    { id: "all", label: "Inbox", icon: <Inbox className="h-4 w-4" />, count: categorizedEmails.all.length },
    {
      id: "hot-leads",
      label: "Leads Chauds",
      icon: <Flame className="h-4 w-4" />,
      count: categorizedEmails.hotLeads.length,
      color: "text-red-500",
    },
    {
      id: "pending-response",
      label: "En attente",
      icon: <Clock className="h-4 w-4" />,
      count: categorizedEmails.pendingResponse.length,
      color: "text-amber-500",
    },
    {
      id: "needs-followup",
      label: "À relancer",
      icon: <AlertCircle className="h-4 w-4" />,
      count: categorizedEmails.needsFollowup.length,
      color: "text-orange-500",
    },
    {
      id: "portals",
      label: "Portails",
      icon: <Globe className="h-4 w-4" />,
      count: categorizedEmails.portals.length,
      color: "text-blue-500",
    },
    { id: "sent", label: "Envoyés", icon: <Send className="h-4 w-4" />, count: categorizedEmails.sent.length },
    {
      id: "archived",
      label: "Archivés",
      icon: <Archive className="h-4 w-4" />,
      count: categorizedEmails.archived.length,
    },
  ]

  const sidebarFolders = useMemo(() => {
    // Sidebar is the mailbox / main views.
    return smartFolders.filter((f) => f.id === "today" || f.id === "all" || f.id === "sent" || f.id === "archived")
  }, [smartFolders])

  const showInboxTabs = activeFolder !== "sent" && activeFolder !== "archived" && activeFolder !== "today"

  return (
    <>
      <div className="flex h-full flex-col bg-muted/20">
        <DashboardHeader title="Email" description="Gérez vos communications avec vos clients" />

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Gmail-like sidebar */}
          <aside className="w-64 border-r bg-background/80 p-3">
            <div className="space-y-2">
              <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start gap-2 rounded-full shadow-sm">
                    <Plus className="h-4 w-4" />
                    Composer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{replyMode ? "Répondre" : "Nouvel Email"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Lier à un contact</Label>
                        <Select value={selectedContact} onValueChange={setSelectedContact}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner (optionnel)" />
                          </SelectTrigger>
                          <SelectContent>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.firstName} {contact.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Lier à un bien</Label>
                        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner (optionnel)" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.reference} - {property.address.street}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>À</Label>
                      <Input
                        placeholder="destinataire@email.com"
                        value={composeTo}
                        onChange={(e) => setComposeTo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Objet</Label>
                      <Input
                        placeholder="Objet de l'email"
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Message</Label>
                        <div className="flex items-center gap-2">
                          <Select value={aiTone} onValueChange={setAiTone}>
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professionnel</SelectItem>
                              <SelectItem value="friendly">Amical</SelectItem>
                              <SelectItem value="formal">Formel</SelectItem>
                              <SelectItem value="casual">Décontracté</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={handleAIDraft} disabled={isGenerating}>
                            {isGenerating ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            IA
                          </Button>
                        </div>
                      </div>
                      <Input
                        placeholder="Contexte pour l'IA (ex: 'Remercier pour la visite')"
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        className="mb-2"
                      />
                      <Textarea
                        placeholder="Rédigez votre message..."
                        value={composeBody}
                        onChange={(e) => setComposeBody(e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setComposeOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleSendEmail} disabled={!composeTo || !composeSubject}>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="pt-2">
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Boîtes
                </p>
                <nav className="space-y-1">
                  {sidebarFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setActiveFolder(folder.id)
                        setSelectedEmail(null)
                        clearSelection()
                        if (folder.id === "today") setActiveTodayQueue("now")
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-full px-3 py-2 text-sm transition-colors",
                        activeFolder === folder.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
                      )}
                    >
                      <span className={cn("flex items-center gap-2", folder.color && folder.color)}>
                        {folder.icon}
                        {folder.label}
                      </span>
                      {folder.count > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                          {folder.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main area */}
          <div className="flex flex-1 min-h-0 flex-col bg-background">
            {/* Top toolbar (Gmail-ish) */}
            <div className="flex items-center gap-3 border-b bg-background/80 px-4 py-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les emails"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-full bg-muted/40 pl-9"
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" title="Actualiser">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" title="Filtres">
                <Filter className="h-4 w-4" />
              </Button>
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" title="Comptes">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Comptes Email</DialogTitle>
                    <DialogDescription>Connectez et gérez vos comptes email</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Comptes connectés</Label>
                      {emailAccounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun compte connecté</p>
                      ) : (
                        <div className="space-y-2">
                          {emailAccounts.map((account) => (
                            <div key={account.id} className="flex items-center justify-between rounded-lg border p-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    account.connected ? "bg-emerald-500" : "bg-red-500",
                                  )}
                                />
                                <div>
                                  <p className="text-sm font-medium">{account.email}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{account.provider}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removeEmailAccount(account.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 border-t pt-4">
                      <Label>Connecter un nouveau compte</Label>
                      <Select
                        value={connectProvider}
                        onValueChange={(v) => setConnectProvider(v as typeof connectProvider)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le fournisseur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gmail">Gmail</SelectItem>
                          <SelectItem value="outlook">Outlook</SelectItem>
                          <SelectItem value="imap">IMAP (Personnalisé)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Adresse email"
                        value={connectEmail}
                        onChange={(e) => setConnectEmail(e.target.value)}
                      />
                      <Button onClick={handleConnectAccount} disabled={!connectEmail} className="w-full">
                        <Link2 className="mr-2 h-4 w-4" />
                        Connecter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                title="Assistant"
                onClick={() => setAssistantOpen(true)}
                disabled={!selectedEmail}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Email List */}
              <div
                className={cn(
                  "border-r bg-background flex flex-col min-h-0",
                  selectedEmail ? "hidden w-[420px]" : "flex-1 w-full",
                )}
              >
                {activeFolder === "today" ? (
                  <div className="border-b bg-background/80 px-4 py-3 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">Today</p>
                        <p className="text-xs text-muted-foreground">Inbox d’actions • triage en 10s</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={activeTodayQueue === "now" ? "default" : "secondary"}
                          className="rounded-full"
                        >
                          Now {todayCounts.now}
                        </Badge>
                        <Badge
                          variant={activeTodayQueue === "waiting" ? "default" : "secondary"}
                          className="rounded-full"
                        >
                          Waiting {todayCounts.waiting}
                        </Badge>
                        <Badge
                          variant={activeTodayQueue === "fyi" ? "default" : "secondary"}
                          className="rounded-full"
                        >
                          FYI {todayCounts.fyi}
                        </Badge>
                      </div>
                    </div>
                    <ToggleGroup
                      type="single"
                      value={activeTodayQueue}
                      onValueChange={(v) => v && setActiveTodayQueue(v as TodayQueue)}
                      variant="outline"
                      size="sm"
                      className="w-full overflow-x-auto rounded-full bg-background"
                    >
                      <ToggleGroupItem value="now" className="rounded-full">
                        À faire
                      </ToggleGroupItem>
                      <ToggleGroupItem value="waiting" className="rounded-full">
                        En attente
                      </ToggleGroupItem>
                      <ToggleGroupItem value="fyi" className="rounded-full">
                        FYI
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                ) : (
                  <div className="border-b bg-background/80">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Checkbox
                        checked={masterChecked}
                        onCheckedChange={(v) => setAllVisibleSelected(v === true)}
                        aria-label="Sélectionner tout"
                      />
                      {selectedEmailIds.length > 0 ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            title="Archiver"
                            onClick={bulkArchive}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            title="Supprimer"
                            onClick={bulkDelete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            title={anyUnreadSelected ? "Marquer comme lu" : "Marquer comme non lu"}
                            onClick={bulkMarkReadToggle}
                          >
                            {anyUnreadSelected ? (
                              <CheckCheck className="h-4 w-4" />
                            ) : (
                              <MailOpen className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            title={anyUnstarredSelected ? "Ajouter aux favoris" : "Retirer des favoris"}
                            onClick={bulkStarToggle}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {selectedEmailIds.length} sélectionné(s)
                            </span>
                            <Button variant="ghost" size="sm" onClick={clearSelection}>
                              Effacer
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="ml-auto flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <List className="h-4 w-4" />
                                {density === "compact" ? "Compact" : "Confort"}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDensity("comfortable")}>Confort</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDensity("compact")}>Compact</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>

                    {showInboxTabs ? (
                      <div className="px-3 pb-2">
                        <ToggleGroup
                          type="single"
                          value={activeFolder}
                          onValueChange={(v) => v && setActiveFolder(v as SmartFolder)}
                          variant="outline"
                          size="sm"
                          className="w-full overflow-x-auto rounded-full bg-background"
                        >
                          <ToggleGroupItem value="all" className="rounded-full">
                            <span className="truncate">Principal</span>
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                              {categorizedEmails.all.length}
                            </Badge>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="hot-leads" className="rounded-full">
                            <span className="truncate">Leads</span>
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                              {categorizedEmails.hotLeads.length}
                            </Badge>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="pending-response" className="rounded-full">
                            <span className="truncate">À répondre</span>
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                              {categorizedEmails.pendingResponse.length}
                            </Badge>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="needs-followup" className="rounded-full">
                            <span className="truncate">À relancer</span>
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                              {categorizedEmails.needsFollowup.length}
                            </Badge>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="portals" className="rounded-full">
                            <span className="truncate">Portails</span>
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                              {categorizedEmails.portals.length}
                            </Badge>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    ) : null}
                  </div>
                )}

                <ScrollArea className="flex-1 min-h-0">
                  <div className="pr-3">
                    {activeFolder === "today" ? (
                      filteredTodayThreads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <Zap className="h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-4 text-sm font-medium">Rien dans cette file</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Essayez une autre file (À faire / En attente / FYI) ou recherchez.
                          </p>
                        </div>
                      ) : (
                        filteredTodayThreads.map((thread) => {
                          const priorityDot =
                            thread.priority === "high"
                              ? "bg-red-500"
                              : thread.priority === "medium"
                                ? "bg-amber-500"
                                : "bg-emerald-500"

                          const isOverdue = thread.slaText === "En retard"
                          const actionText = `${thread.latestInbound.subject} ${thread.latestInbound.preview}`
                          const looksLikeVisit = /visite|visit|viewing|rdv|rendez-vous/i.test(actionText)

                          const primaryAction = !thread.contact
                            ? { label: "Créer lead", fn: () => { handleSelectTodayThread(thread); setAssistantOpen(true) } }
                            : looksLikeVisit
                              ? {
                                  label: "Proposer visite",
                                  fn: () => proposeVisitSlotsForEmail(thread.latestInbound, thread.contact?.id || undefined),
                                }
                              : {
                                  label: "Draft IA",
                                  fn: () => draftWithAIForEmail(thread.latestInbound, thread.contact?.id || undefined),
                                }

                          return (
                            <div
                              key={thread.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleSelectTodayThread(thread)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  handleSelectTodayThread(thread)
                                }
                              }}
                              className={cn(
                                "group flex w-full items-start justify-between gap-4 border-b px-4 py-3 text-left hover:bg-muted/50",
                                thread.unreadCount > 0 && "bg-primary/[0.02]",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn("h-2.5 w-2.5 rounded-full", priorityDot)} />
                                  <span className={cn("truncate text-sm", thread.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                                    {thread.counterpartName}
                                  </span>
                                  {thread.insights.propertyReference ? (
                                    <Badge variant="outline" className="h-6 rounded-full">
                                      {thread.insights.propertyReference}
                                    </Badge>
                                  ) : null}
                                  {thread.insights.budgetEur ? (
                                    <Badge variant="secondary" className="h-6 rounded-full">
                                      {thread.insights.budgetEur.toLocaleString("fr-LU")}€
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={cn("truncate text-sm", thread.unreadCount > 0 ? "font-medium" : "")}>
                                    {thread.subject}
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{thread.aiLine}</p>
                              </div>

                              <div className="flex shrink-0 flex-col items-end gap-2">
                                <span className={cn("text-xs", isOverdue ? "text-red-600" : "text-muted-foreground")}>
                                  {thread.slaText}
                                </span>
                                <Button
                                  size="sm"
                                  variant={primaryAction.label === "Créer lead" ? "default" : "secondary"}
                                  className="h-7 rounded-full"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    primaryAction.fn()
                                  }}
                                >
                                  {primaryAction.label}
                                </Button>
                              </div>
                            </div>
                          )
                        })
                      )
                    ) : filteredEmails.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Mail className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-sm font-medium">Aucun email</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Changez de dossier ou affinez votre recherche.
                        </p>
                      </div>
                    ) : (
                      filteredEmails.map((email) => {
                        const hasAttachmentHint =
                          /attach|pièce jointe|attachment|pdf/i.test(email.subject) ||
                          /attach|pièce jointe|attachment|pdf/i.test(email.preview)
                        return (
                          <div
                            key={email.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectEmail(email)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                handleSelectEmail(email)
                              }
                            }}
                            className={cn(
                              "group flex w-full flex-col gap-1 border-b px-2 text-left transition-colors hover:bg-muted/50",
                              selectedEmail?.id === email.id && "bg-muted/50 ring-1 ring-inset ring-primary/10",
                              density === "compact" ? "py-2" : "py-3",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex items-center gap-2 pt-0.5">
                                <div
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                >
                                  <Checkbox
                                    checked={selectedEmailIds.includes(email.id)}
                                    onCheckedChange={(v) => setRowSelected(email.id, v === true)}
                                    aria-label="Sélectionner l'email"
                                  />
                                </div>
                                <button
                                  type="button"
                                  className={cn(
                                    "opacity-0 transition-opacity group-hover:opacity-100",
                                    email.starred && "opacity-100",
                                  )}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    email.starred ? unstarEmail(email.id) : starEmail(email.id)
                                  }}
                                  aria-label={email.starred ? "Retirer des favoris" : "Ajouter aux favoris"}
                                >
                                  <Star
                                    className={cn(
                                      "h-4 w-4",
                                      email.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                                    )}
                                  />
                                </button>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {email.status === "unread" && <span className="h-2 w-2 rounded-full bg-primary" />}
                                    <span
                                      className={cn(
                                        "truncate text-sm",
                                        email.status === "unread" ? "font-semibold" : "font-medium",
                                      )}
                                    >
                                      {email.folder === "sent" ? email.to[0]?.name : email.from.name}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {formatDate(email.receivedAt)}
                                  </span>
                                </div>
                                <span className={cn("truncate text-sm", email.status === "unread" ? "font-medium" : "")}>
                                  {email.subject}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs text-muted-foreground",
                                    density === "compact" ? "truncate" : "line-clamp-2",
                                  )}
                                >
                                  {email.preview}
                                </span>
                                {hasAttachmentHint && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="h-6 rounded-full px-2 text-xs">
                                      PDF
                                    </Badge>
                                  </div>
                                )}
                                {email.relatedTo && (
                                  <div className="mt-1 flex items-center gap-1">
                                    {email.relatedTo.type === "contact" && <User className="h-3 w-3 text-blue-500" />}
                                    {email.relatedTo.type === "property" && (
                                      <Building2 className="h-3 w-3 text-emerald-500" />
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {email.relatedTo.type === "contact"
                                        ? contacts.find((c) => c.id === email.relatedTo?.id)?.firstName
                                        : properties.find((p) => p.id === email.relatedTo?.id)?.reference}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Email Content + Context Panel */}
              <div className={cn("flex flex-1 min-h-0", !selectedEmail && "hidden")}>
          {/* Email Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedEmail ? (
              <>
                {/* Reader toolbar */}
                <div className="flex items-center gap-1 border-b bg-background/80 px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setSelectedEmail(null)}
                    title="Retour"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => archiveEmail(selectedEmail.id)}
                    title="Archiver"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                      deleteEmail(selectedEmail.id)
                      setSelectedEmail(null)
                    }}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full" title="Signaler comme spam">
                    <AlertOctagon className="h-4 w-4" />
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{rangeLabel}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={goPrev}
                      disabled={!canGoPrev}
                      title="Précédent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={goNext}
                      disabled={!canGoNext}
                      title="Suivant"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
	                  </div>
	                </div>

                {/* Next action strip */}
                <div className="border-b bg-muted/20 px-4 py-3">
                  <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next action</p>
                      {(() => {
                        const inferredQueue =
                          selectedThread?.queue ||
                          (selectedEmail.folder === "sent"
                            ? ("waiting" as const)
                            : selectedEmail.status === "unread"
                              ? ("now" as const)
                              : ("fyi" as const))
                        const label =
                          inferredQueue === "waiting"
                            ? "Waiting on client — plan a follow-up"
                            : inferredQueue === "now"
                              ? "Needs action — reply now"
                              : "FYI — no action required"
                        const detail = selectedThread?.aiLine || (leadInsights ? leadInsights.reason : "")
                        return (
                          <>
                            <p className="truncate text-sm font-medium">{label}</p>
                            <p className="truncate text-xs text-muted-foreground">{detail}</p>
                          </>
                        )
                      })()}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {(() => {
                        const inferredQueue =
                          selectedThread?.queue ||
                          (selectedEmail.folder === "sent"
                            ? ("waiting" as const)
                            : selectedEmail.status === "unread"
                              ? ("now" as const)
                              : ("fyi" as const))

                        if (inferredQueue === "waiting") {
                          return (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" className="h-8 rounded-full">
                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                    Relance
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => scheduleFollowUp(24)}>Dans 24h</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => scheduleFollowUp(48)}>Dans 48h</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => scheduleFollowUp(72)}>Dans 72h</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 rounded-full"
                                onClick={draftFollowUpWithAI}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Draft IA
                              </Button>
                            </>
                          )
                        }

                        if (inferredQueue === "now") {
                          return (
                            <>
                              <Button size="sm" className="h-8 rounded-full" onClick={handleReply}>
                                <Reply className="mr-2 h-4 w-4" />
                                Répondre
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 rounded-full"
                                onClick={handleDraftWithAIReply}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Draft IA
                              </Button>
                            </>
                          )
                        }

                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full bg-transparent"
                            onClick={() => archiveEmail(selectedEmail.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archiver
                          </Button>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* Conversation (scrollable) */}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-5">
                    <div className="mx-auto w-full max-w-3xl space-y-4">
                      {/* Thread header */}
                      <div className="border-b pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-xl font-semibold">{selectedEmail.subject}</h2>
                          <Badge variant="outline" className="h-6 rounded-full">
                            {selectedEmail.folder === "inbox"
                              ? "Inbox"
                              : selectedEmail.folder === "sent"
                                ? "Envoyés"
                                : selectedEmail.folder === "drafts"
                                  ? "Brouillons"
                                  : "Archivés"}
                          </Badge>
                          <Badge variant="secondary" className="h-6 rounded-full">
                            Conversation • {threadMessages.length}
                          </Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {linkedContact ? (
                            <Button asChild size="sm" variant="secondary" className="h-7 rounded-full">
                              <Link href={`/dashboard/contacts/${linkedContact.id}`} className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                {linkedContact.firstName} {linkedContact.lastName}
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-full bg-transparent"
                              disabled={!leadInsights || isCreatingLead}
                              onClick={() => void createLeadFromSelectedEmail()}
                            >
                              <User className="mr-2 h-3.5 w-3.5" />
                              Créer un contact
                            </Button>
                          )}
                          {leadInsights?.budgetEur && (
                            <Badge variant="outline" className="h-7 gap-1 rounded-full">
                              <Euro className="h-3.5 w-3.5" />
                              {leadInsights.budgetEur.toLocaleString("fr-LU")} €
                            </Badge>
                          )}
                          {leadInsights?.propertyReference && (
                            <Badge variant="outline" className="h-7 gap-1 rounded-full">
                              <Home className="h-3.5 w-3.5" />
                              {leadInsights.propertyReference}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quick replies */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground mr-1">Réponses rapides:</span>
                        {EMAIL_TEMPLATES.map((template) => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs whitespace-nowrap bg-transparent rounded-full"
                            onClick={() => handleUseTemplate(template)}
                          >
                            <Zap className="mr-1 h-3 w-3" />
                            {template.label}
                          </Button>
                        ))}
                      </div>

                      {/* Messages */}
                      <div className="space-y-3">
                        {threadMessages.map((m) => {
                          const isExpanded = expandedMessageIds.includes(m.id)
                          const isSent = m.folder === "sent"
                          const initials = (m.from.name || "—")
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)

                          return (
                            <Card key={m.id} className="rounded-2xl">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold truncate">
                                          {m.from.name}{" "}
                                          <span className="text-xs font-normal text-muted-foreground">
                                            &lt;{m.from.email}&gt;
                                          </span>
                                        </p>
                                        {isSent ? (
                                          <Badge variant="secondary" className="h-5 rounded-full">
                                            Envoyé
                                          </Badge>
                                        ) : null}
                                        {m.status === "unread" ? (
                                          <Badge variant="outline" className="h-5 rounded-full">
                                            Non lu
                                          </Badge>
                                        ) : null}
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">
                                        À: {m.to?.map((t) => t.email).join(", ") || "—"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-muted-foreground">{formatDate(m.receivedAt)}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 rounded-full"
                                      onClick={() =>
                                        setExpandedMessageIds((prev) =>
                                          prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                                        )
                                      }
                                    >
                                      {isExpanded ? "Réduire" : "Ouvrir"}
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-3">
                                  {isExpanded ? (
                                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">{m.body}</div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{m.preview}</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Reply Actions */}
                <div className="border-t bg-background/80 p-3">
                  <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
                    <Button variant="outline" className="bg-transparent rounded-full" onClick={handleReply}>
                      <Reply className="mr-2 h-4 w-4" />
                      Répondre
                    </Button>
                    <Button variant="outline" className="bg-transparent rounded-full" onClick={() => {}}>
                      <Forward className="mr-2 h-4 w-4" />
                      Transférer
                    </Button>
                    <Button variant="secondary" className="rounded-full" onClick={handleDraftWithAIReply}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Draft with AI
                    </Button>
                    <div className="ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full" title="Plus">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setQuickNoteOpen(true)}>
                            <StickyNote className="mr-2 h-4 w-4" />
                            Ajouter une note
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Planifier une visite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center">
                <Mail className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">Sélectionnez un email</p>
              </div>
            )}
          </div>

          {/* Context / Assistant Panel */}
          {selectedEmail && assistantOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setAssistantOpen(false)} />
              <div className="fixed inset-y-0 right-0 z-50 w-[420px] border-l bg-background shadow-xl flex flex-col min-h-0">
                <div className="flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    {selectedEmailContext ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    {selectedEmailContext ? "Contexte Client" : "Assistant"}
                  </h3>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setAssistantOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-4">
                  {selectedEmailContext ? (
                    <>
                      {/* Contact Info */}
                      <Card>
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
                            <span className="truncate">
                              {selectedEmailContext.contact.firstName} {selectedEmailContext.contact.lastName}
                            </span>
                            <Button asChild size="sm" variant="outline" className="h-7 bg-transparent">
                              <Link href={`/dashboard/contacts/${selectedEmailContext.contact.id}`}>Ouvrir</Link>
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          {selectedEmailContext.contact.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {selectedEmailContext.contact.phone}
                            </div>
                          )}
                          {selectedEmailContext.contact.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {selectedEmailContext.contact.email}
                            </div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {selectedEmailContext.contact.type === "buyer"
                              ? "Acheteur"
                              : selectedEmailContext.contact.type === "seller"
                                ? "Vendeur"
                                : "Contact"}
                          </Badge>
                        </CardContent>
                      </Card>

                  {/* Active Deals */}
                  {selectedEmailContext.deals.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Dossiers actifs</h4>
                      {selectedEmailContext.deals.map((deal) => {
                        const property = properties.find((p) => p.id === deal.propertyId)
                        return (
                          <Card key={deal.id} className="mb-2">
                            <CardContent className="p-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{property?.reference}</span>
                                <Badge
                                  variant={
                                    deal.stage === "lead"
                                      ? "secondary"
                                      : deal.stage === "visit"
                                        ? "outline"
                                        : deal.stage === "offer"
                                          ? "default"
                                          : "default"
                                  }
                                  className="text-xs"
                                >
                                  {deal.stage}
                                </Badge>
                              </div>
                              {property && (
                                <p className="text-xs text-muted-foreground">
                                  {property.address.street}, {property.address.city}
                                </p>
                              )}
                              <p className="text-xs font-medium text-primary">{deal.value.toLocaleString("fr-LU")} €</p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Recent Visits */}
                  {selectedEmailContext.visits.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Visites</h4>
                      {selectedEmailContext.visits.slice(0, 3).map((visit) => {
                        const property = properties.find((p) => p.id === visit.propertyId)
                        return (
                          <div key={visit.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{property?.reference}</p>
                              <p className="text-xs text-muted-foreground">{formatRelativeDate(visit.date)}</p>
                            </div>
                            <Badge
                              variant={
                                visit.status === "completed"
                                  ? "default"
                                  : visit.status === "scheduled"
                                    ? "outline"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {visit.status === "completed"
                                ? "Fait"
                                : visit.status === "scheduled"
                                  ? "Planifié"
                                  : "Annulé"}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Email History */}
                  {selectedEmailContext.emails.length > 1 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                        Historique ({selectedEmailContext.emails.length} emails)
                      </h4>
                      {selectedEmailContext.emails
                        .filter((e) => e.id !== selectedEmail.id)
                        .slice(0, 5)
                        .map((email) => (
                          <button
                            key={email.id}
                            onClick={() => handleSelectEmail(email)}
                            className="w-full text-left py-2 border-b last:border-0 hover:bg-muted/50 rounded"
                          >
                            <p className="text-xs font-medium truncate">{email.subject}</p>
                            <p className="text-xs text-muted-foreground">{formatRelativeDate(email.receivedAt)}</p>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Properties of Interest */}
                  {selectedEmailContext.properties.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Biens d'intérêt</h4>
                      {selectedEmailContext.properties.map((property) => (
                        <Card key={property.id} className="mb-2">
                          <CardContent className="p-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <Home className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">{property.reference}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {property.address.city}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-primary">
                              <Euro className="h-3 w-3" />
                              {property.price.toLocaleString("fr-LU")} €
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                    </>
                  ) : (
                    <Card className="border-dashed">
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-medium">Capture du lead (auto)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-3">
                        <div className="rounded-lg border bg-background/70 p-3">
                          <p className="text-xs text-muted-foreground">Aucun contact lié à cet email.</p>
                          <p className="mt-1 text-sm font-medium">{selectedEmail.from.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedEmail.from.email}</p>
                          {inferredProperty && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <Home className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Bien détecté:</span>
                              <span className="font-medium">{inferredProperty.reference}</span>
                            </div>
                          )}
                        </div>

                        {leadInsights && (
                          <div className="grid gap-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Prénom</Label>
                                <Input value={leadFirstName} onChange={(e) => setLeadFirstName(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Nom</Label>
                                <Input value={leadLastName} onChange={(e) => setLeadLastName(e.target.value)} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Téléphone</Label>
                              <Input
                                value={leadPhone}
                                onChange={(e) => setLeadPhone(e.target.value)}
                                placeholder="+352 …"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Budget (€)</Label>
                                <Input
                                  inputMode="numeric"
                                  value={leadBudgetEur}
                                  onChange={(e) => setLeadBudgetEur(e.target.value)}
                                  placeholder="450000"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Référence</Label>
                                <Input
                                  value={leadPropertyRef}
                                  onChange={(e) => setLeadPropertyRef(e.target.value)}
                                  placeholder="PROP-001"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Raison</Label>
                              <Input value={leadReason} onChange={(e) => setLeadReason(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Note (CRM)</Label>
                              <Textarea
                                value={leadNotes}
                                onChange={(e) => setLeadNotes(e.target.value)}
                                className="min-h-[120px]"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button onClick={() => void createLeadFromSelectedEmail()} disabled={isCreatingLead}>
                                {isCreatingLead ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <User className="mr-2 h-4 w-4" />
                                )}
                                Créer le contact + lier l’email
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => void createLeadFromSelectedEmail({ draftWithAI: true })}
                                disabled={isCreatingLead}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Créer + Draft with AI
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {leadInsights.tags.slice(0, 6).map((t) => (
                                <Badge key={t} variant="outline" className="text-xs">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
            </>
          )}
        </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Note Dialog */}
      <Dialog open={quickNoteOpen} onOpenChange={setQuickNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une note rapide</DialogTitle>
            <DialogDescription>
              Cette note sera associée au contact {selectedEmailContext?.contact?.firstName}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Votre note..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickNoteOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                const contact = selectedEmailContext?.contact
                if (contact && quickNote.trim()) {
                  const stamp = new Date().toLocaleString("fr-LU")
                  const appended = `${contact.notes ? `${contact.notes.trim()}\n\n` : ""}[${stamp}] ${quickNote.trim()}`
                  updateContact(contact.id, { notes: appended, lastContactAt: new Date().toISOString() })
                }
                setQuickNote("")
                setQuickNoteOpen(false)
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
