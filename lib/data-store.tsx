"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  contacts as initialContacts,
  properties as initialProperties,
  deals as initialDeals,
  visits as initialVisits,
  tasks as initialTasks,
  contracts as initialContracts,
  commissions as initialCommissions,
  invoices as initialInvoices,
  campaigns as initialCampaigns,
  emails as initialEmails,
  emailAccounts as initialEmailAccounts,
  operationalDocuments as initialOperationalDocuments,
  commercialDocuments as initialCommercialDocuments,
  type Contact,
  type Property,
  type Deal,
  type Visit,
  type Task,
  type Contract,
  type Commission,
  type Invoice,
  type MarketingCampaign,
  type Email,
  type EmailAccount,
  type OperationalDocument,
  type CommercialDocument,
} from "@/lib/mock-data"
import type { Inspection } from "@/lib/inspections"
import { INSPECTIONS_STORAGE_KEY } from "@/lib/inspections"

export type PhotoToolGeneration = {
  id: string
  createdAt: string
  tool: string
  prompt: string
  images: Array<{ url: string; content_type?: string; file_name?: string; width?: number; height?: number }>
  propertyId?: string | null
  contactId?: string | null
  note?: string | null
}

const PHOTO_TOOLS_STORAGE_KEY = "re_photo_tools_generations_v1"
const TASKS_STORAGE_KEY = "re_tasks_v1"

interface DataStore {
  // Session (server-backed mode)
  currentUserId: string | null
  currentAgencyId: string | null

  // Data
  contacts: Contact[]
  properties: Property[]
  deals: Deal[]
  visits: Visit[]
  tasks: Task[]
  contracts: Contract[]
  operationalDocuments: OperationalDocument[]
  marketingDocuments: CommercialDocument[]
  commissions: Commission[]
  invoices: Invoice[]
  campaigns: MarketingCampaign[]
  emails: Email[]
  emailAccounts: EmailAccount[]
  inspections: Inspection[]
  photoGenerations: PhotoToolGeneration[]

  // Contact actions
  addContact: (contact: Omit<Contact, "id" | "createdAt">) => Contact
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void

  // Property actions
  addProperty: (property: Omit<Property, "id" | "createdAt">) => Property
  updateProperty: (id: string, updates: Partial<Property>) => void
  deleteProperty: (id: string) => void

  // Deal actions
  addDeal: (deal: Omit<Deal, "id" | "createdAt">) => Deal
  updateDeal: (id: string, updates: Partial<Deal>) => void
  deleteDeal: (id: string) => void
  moveDealToStage: (id: string, status: Deal["status"]) => void

  // Visit actions
  addVisit: (visit: Omit<Visit, "id">) => Visit
  updateVisit: (id: string, updates: Partial<Visit>) => void
  deleteVisit: (id: string) => void

  // Task actions
  addTask: (task: Omit<Task, "id" | "createdAt">) => Task
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  refreshTasks: () => Promise<void>

  // Contract actions
  addContract: (contract: Omit<Contract, "id" | "createdAt">) => Contract
  updateContract: (id: string, updates: Partial<Contract>) => void
  deleteContract: (id: string) => void

  // Operational document actions
  addOperationalDocument: (doc: Omit<OperationalDocument, "id" | "createdAt">) => OperationalDocument
  updateOperationalDocument: (id: string, updates: Partial<OperationalDocument>) => void
  deleteOperationalDocument: (id: string) => void

  // Marketing document actions
  addMarketingDocument: (doc: Omit<CommercialDocument, "id" | "createdAt">) => CommercialDocument
  upsertMarketingDocument: (doc: CommercialDocument) => void
  updateMarketingDocument: (id: string, updates: Partial<CommercialDocument>) => void
  deleteMarketingDocument: (id: string) => void

  // Commission actions
  addCommission: (commission: Omit<Commission, "id" | "createdAt">) => Commission
  updateCommission: (id: string, updates: Partial<Commission>) => void
  markCommissionPaid: (id: string) => void

  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Invoice
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  markInvoicePaid: (id: string) => void
  sendInvoice: (id: string) => void

  // Marketing campaigns
  addCampaign: (campaign: Omit<MarketingCampaign, "id" | "createdAt">) => MarketingCampaign
  updateCampaign: (id: string, updates: Partial<MarketingCampaign>) => void
  deleteCampaign: (id: string) => void

  // Email actions
  addEmail: (email: Omit<Email, "id">) => Email
  updateEmail: (id: string, updates: Partial<Email>) => void
  deleteEmail: (id: string) => void
  markEmailRead: (id: string) => void
  markEmailUnread: (id: string) => void
  starEmail: (id: string) => void
  unstarEmail: (id: string) => void
  archiveEmail: (id: string) => void
  addEmailAccount: (account: Omit<EmailAccount, "id">) => EmailAccount
  removeEmailAccount: (id: string) => void

  // Inspection actions
  addInspection: (inspection: Omit<Inspection, "id" | "createdAt" | "updatedAt">) => Inspection
  saveInspection: (inspection: Inspection) => void
  deleteInspection: (id: string) => void

  // Photo tools
  addPhotoGeneration: (generation: Omit<PhotoToolGeneration, "id" | "createdAt">) => PhotoToolGeneration
  getPhotoGenerationsByPropertyId: (propertyId: string) => PhotoToolGeneration[]
  getPhotoGenerationsByContactId: (contactId: string) => PhotoToolGeneration[]

  // Helpers
  getContactById: (id: string) => Contact | undefined
  getPropertyById: (id: string) => Property | undefined
  getDealById: (id: string) => Deal | undefined
  getVisitById: (id: string) => Visit | undefined
  getTaskById: (id: string) => Task | undefined
  getContractById: (id: string) => Contract | undefined
  getInspectionById: (id: string) => Inspection | undefined
  getTasksByDealId: (dealId: string) => Task[]
  getVisitsByPropertyId: (propertyId: string) => Visit[]
  getDealsByContactId: (contactId: string) => Deal[]
  getCommissionsByDealId: (dealId: string) => Commission[]
  getInvoicesByContactId: (contactId: string) => Invoice[]
  getCampaignById: (id: string) => MarketingCampaign | undefined
  getEmailsByContactId: (contactId: string) => Email[]
  getUnreadEmailCount: () => number
  getPendingTaskCount: () => number
  getUpcomingVisitsToday: () => Visit[]
}

const DataStoreContext = createContext<DataStore | null>(null)

function generateId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [visits, setVisits] = useState<Visit[]>(initialVisits)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [contracts, setContracts] = useState<Contract[]>(initialContracts)
  const [operationalDocuments, setOperationalDocuments] = useState<OperationalDocument[]>(initialOperationalDocuments)
  const [marketingDocuments, setMarketingDocuments] = useState<CommercialDocument[]>(initialCommercialDocuments)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(initialCampaigns)
  const [emails, setEmails] = useState<Email[]>(initialEmails)
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>(initialEmailAccounts)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [photoGenerations, setPhotoGenerations] = useState<PhotoToolGeneration[]>([])
  const [persistenceMode, setPersistenceMode] = useState<"unknown" | "server" | "local">("unknown")

  const jsonHeaders = useMemo(() => ({ "Content-Type": "application/json" }) as const, [])

  // Prefer server-backed persistence when available (demo default).
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const boot = await fetch("/api/v1/bootstrap")
        if (boot.status === 401) {
          router.replace("/login")
          return
        }
        if (boot.status === 409) {
          router.replace("/onboarding")
          return
        }
        if (!boot.ok) throw new Error("bootstrap failed")

        const bootJson = (await boot.json()) as { userId?: string; agencyId?: string }
        if (!cancelled) {
          setCurrentUserId(bootJson.userId ?? null)
          setCurrentAgencyId(bootJson.agencyId ?? null)
        }

        const [cRes, pRes, tRes, vRes, ctRes, comRes, invRes, inspRes, opRes, mdRes] = await Promise.all([
          fetch("/api/v1/contacts", { credentials: "include" }),
          fetch("/api/v1/properties", { credentials: "include" }),
          fetch("/api/v1/tasks", { credentials: "include" }),
          fetch("/api/v1/visits", { credentials: "include" }),
          fetch("/api/v1/contracts", { credentials: "include" }),
          fetch("/api/v1/commissions", { credentials: "include" }),
          fetch("/api/v1/invoices", { credentials: "include" }),
          fetch("/api/v1/inspections", { credentials: "include" }),
          fetch("/api/v1/operational-documents", { credentials: "include" }),
          fetch("/api/v1/marketing-documents", { credentials: "include" }),
        ])

        // Log which endpoints failed and parse responses
        const endpoints = [
          { name: "contacts", res: cRes },
          { name: "properties", res: pRes },
          { name: "tasks", res: tRes },
          { name: "visits", res: vRes },
          { name: "contracts", res: ctRes },
          { name: "commissions", res: comRes, optional: true },
          { name: "invoices", res: invRes },
          { name: "inspections", res: inspRes },
          { name: "operational-documents", res: opRes },
          { name: "marketing-documents", res: mdRes },
        ]

        const failedEndpoints = endpoints.filter((e) => !e.res.ok).map((e) => e.name)
        const criticalFailed = failedEndpoints.filter((name) => !endpoints.find((e) => e.name === name && e.optional))

        if (criticalFailed.length > 0) {
          console.warn("[DataStore] Failed to fetch from critical endpoints:", criticalFailed)
          throw new Error(`data fetch failed: ${criticalFailed.join(", ")}`)
        }
        if (failedEndpoints.length > 0) {
          console.warn("[DataStore] Failed to fetch from optional endpoints:", failedEndpoints)
        }

        // Parse responses, handling both success and failure
        const parseJson = async (res: Response) => {
          if (!res.ok) return []
          try {
            const data = await res.json()
            return Array.isArray(data) ? data : []
          } catch {
            return []
          }
        }

        const [c, p, t, v, ct, com, inv, insp, op, md] = await Promise.all([
          parseJson(cRes),
          parseJson(pRes),
          parseJson(tRes),
          parseJson(vRes),
          parseJson(ctRes),
          parseJson(comRes),
          parseJson(invRes),
          parseJson(inspRes),
          parseJson(opRes),
          parseJson(mdRes),
        ])

        if (cancelled) return
        if (Array.isArray(c)) setContacts(c as Contact[])
        if (Array.isArray(p)) setProperties(p as Property[])
        if (Array.isArray(t)) setTasks(t as Task[])
        if (Array.isArray(v)) setVisits(v as Visit[])
        if (Array.isArray(ct)) setContracts(ct as Contract[])
        if (Array.isArray(com)) setCommissions(com as Commission[])
        if (Array.isArray(inv)) setInvoices(inv as Invoice[])
        if (Array.isArray(insp)) setInspections(insp as Inspection[])
        if (Array.isArray(op)) setOperationalDocuments(op as OperationalDocument[])
        if (Array.isArray(md)) setMarketingDocuments(md as CommercialDocument[])
        setPersistenceMode("server")
      } catch {
        // In production, we don't silently fall back to local mock data.
        // If server persistence isn't available, keep local mode as a last resort.
        if (!cancelled) setPersistenceMode("local")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  // Load inspections from localStorage (only when server persistence is unavailable).
  useEffect(() => {
    if (persistenceMode !== "local") return
    try {
      const raw = window.localStorage.getItem(INSPECTIONS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setInspections(parsed as Inspection[])
    } catch {
      // Ignore corrupt local storage
    }
  }, [persistenceMode])

  // Load tasks from localStorage (only when server persistence is unavailable).
  useEffect(() => {
    if (persistenceMode !== "local") return
    try {
      const raw = window.localStorage.getItem(TASKS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setTasks(parsed as Task[])
      }
    } catch {
      // Ignore corrupt local storage
    }
  }, [persistenceMode])

  // Load photo generations from localStorage once
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PHOTO_TOOLS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setPhotoGenerations(parsed as PhotoToolGeneration[])
      }
    } catch {
      // Ignore corrupt local storage
    }
  }, [])

  // Persist inspections to localStorage (only in local mode).
  useEffect(() => {
    if (persistenceMode !== "local") return
    try {
      window.localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(inspections))
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [inspections, persistenceMode])

  // Persist tasks to localStorage
  useEffect(() => {
    if (persistenceMode === "server") return
    try {
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [tasks, persistenceMode])

  // Persist photo generations to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(PHOTO_TOOLS_STORAGE_KEY, JSON.stringify(photoGenerations))
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [photoGenerations])

  const createTaskInternal = useCallback(
    (task: Task) => {
      setTasks((prev) => [...prev, task])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/tasks", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(task),
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updateTaskInternal = useCallback(
    (id: string, updates: Partial<Task>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/tasks/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(updates),
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const deleteTaskInternal = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/tasks/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const refreshTasks = useCallback(async () => {
    if (persistenceMode !== "server") return
    try {
      const res = await fetch("/api/v1/tasks")
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setTasks(data as Task[])
    } catch {
      // ignore
    }
  }, [persistenceMode])

  const createContactInternal = useCallback(
    (contact: Contact) => {
      setContacts((prev) => [...prev, contact])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/contacts", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(contact),
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updateContactInternal = useCallback(
    (id: string, updates: Partial<Contact>) => {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/contacts/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(updates),
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const deleteContactInternal = useCallback(
    (id: string) => {
      setContacts((prev) => prev.filter((c) => c.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/contacts/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const createPropertyInternal = useCallback(
    (property: Property) => {
      setProperties((prev) => [...prev, property])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/properties", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(property),
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updatePropertyInternal = useCallback(
    (id: string, updates: Partial<Property>) => {
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/properties/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(updates),
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const deletePropertyInternal = useCallback(
    (id: string) => {
      setProperties((prev) => prev.filter((p) => p.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/properties/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const createVisitInternal = useCallback(
    (visit: Visit) => {
      setVisits((prev) => [...prev, visit])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/visits", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(visit),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<Visit>) : null))
        .then((serverVisit) => {
          if (!serverVisit) return
          setVisits((prev) => prev.map((v) => (v.id === visit.id ? serverVisit : v)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updateVisitInternal = useCallback(
    (id: string, updates: Partial<Visit>) => {
      setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/visits/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(updates),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<Visit>) : null))
        .then((serverVisit) => {
          if (!serverVisit) return
          setVisits((prev) => prev.map((v) => (v.id === id ? serverVisit : v)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const deleteVisitInternal = useCallback(
    (id: string) => {
      setVisits((prev) => prev.filter((v) => v.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/visits/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const createContractInternal = useCallback(
    (contract: Contract) => {
      setContracts((prev) => [...prev, contract])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/contracts", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(contract),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<Contract>) : null))
        .then((serverContract) => {
          if (!serverContract) return
          setContracts((prev) => prev.map((c) => (c.id === contract.id ? serverContract : c)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updateContractInternal = useCallback(
    (id: string, updates: Partial<Contract>) => {
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/contracts/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(updates),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<Contract>) : null))
        .then((serverContract) => {
          if (!serverContract) return
          setContracts((prev) => prev.map((c) => (c.id === id ? serverContract : c)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const deleteContractInternal = useCallback(
    (id: string) => {
      setContracts((prev) => prev.filter((c) => c.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/contracts/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const createInvoiceInternal = useCallback(
    (invoice: Invoice) => {
      setInvoices((prev) => [...prev, invoice])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/invoices", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(invoice),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<Invoice>) : null))
        .then((serverInvoice) => {
          if (!serverInvoice) return
          setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? serverInvoice : i)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updateCommissionInternal = useCallback(
    (id: string, updates: Partial<Commission>) => {
      setCommissions((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/commissions/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(updates),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<Commission>) : null))
        .then((serverCommission) => {
          if (!serverCommission) return
          setCommissions((prev) => prev.map((c) => (c.id === id ? serverCommission : c)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updateInvoiceInternal = useCallback(
    (id: string, updates: Partial<Invoice>) => {
      setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/invoices/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(updates),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<Invoice>) : null))
        .then((serverInvoice) => {
          if (!serverInvoice) return
          setInvoices((prev) => prev.map((i) => (i.id === id ? serverInvoice : i)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const deleteInvoiceInternal = useCallback(
    (id: string) => {
      setInvoices((prev) => prev.filter((i) => i.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/invoices/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const createOperationalDocumentInternal = useCallback(
    (doc: OperationalDocument) => {
      setOperationalDocuments((prev) => [doc, ...prev])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/operational-documents", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(doc),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<OperationalDocument>) : null))
        .then((serverDoc) => {
          if (!serverDoc) return
          setOperationalDocuments((prev) => prev.map((d) => (d.id === doc.id ? serverDoc : d)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updateOperationalDocumentInternal = useCallback(
    (id: string, updates: Partial<OperationalDocument>) => {
      setOperationalDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/operational-documents/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(updates),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<OperationalDocument>) : null))
        .then((serverDoc) => {
          if (!serverDoc) return
          setOperationalDocuments((prev) => prev.map((d) => (d.id === id ? serverDoc : d)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const deleteOperationalDocumentInternal = useCallback(
    (id: string) => {
      setOperationalDocuments((prev) => prev.filter((d) => d.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/operational-documents/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const createMarketingDocumentInternal = useCallback(
    (doc: CommercialDocument) => {
      setMarketingDocuments((prev) => [doc, ...prev])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/marketing-documents", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          ...doc,
          propertyId: doc.propertyId || null,
          fileUrl: doc.fileUrl,
          generatedAt: doc.generatedAt,
        }),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<CommercialDocument>) : null))
        .then((serverDoc) => {
          if (!serverDoc) return
          setMarketingDocuments((prev) => prev.map((d) => (d.id === doc.id ? serverDoc : d)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const updateMarketingDocumentInternal = useCallback(
    (id: string, updates: Partial<CommercialDocument>) => {
      setMarketingDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/marketing-documents/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({
          ...updates,
          propertyId: updates.propertyId === undefined ? undefined : updates.propertyId || null,
          fileUrl: updates.fileUrl,
          generatedAt: updates.generatedAt,
        }),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<CommercialDocument>) : null))
        .then((serverDoc) => {
          if (!serverDoc) return
          setMarketingDocuments((prev) => prev.map((d) => (d.id === id ? serverDoc : d)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const deleteMarketingDocumentInternal = useCallback(
    (id: string) => {
      setMarketingDocuments((prev) => prev.filter((d) => d.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/marketing-documents/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const pendingInspectionSavesRef = useRef<Record<string, number>>({})

  const createInspectionInternal = useCallback(
    (inspection: Inspection) => {
      setInspections((prev) => [inspection, ...prev])

      if (persistenceMode !== "server") return
      void fetch("/api/v1/inspections", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(inspection),
      })
        .then(async (r) => (r.ok ? (r.json() as Promise<Inspection>) : null))
        .then((serverInspection) => {
          if (!serverInspection) return
          setInspections((prev) => prev.map((i) => (i.id === inspection.id ? serverInspection : i)))
        })
        .catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  const saveInspectionInternal = useCallback(
    (inspection: Inspection) => {
      setInspections((prev) => prev.map((i) => (i.id === inspection.id ? inspection : i)))

      if (persistenceMode !== "server") return

      const existingTimer = pendingInspectionSavesRef.current[inspection.id]
      if (existingTimer) window.clearTimeout(existingTimer)

      pendingInspectionSavesRef.current[inspection.id] = window.setTimeout(() => {
        void fetch(`/api/v1/inspections/${inspection.id}`, {
          method: "PATCH",
          headers: jsonHeaders,
          body: JSON.stringify({
            type: inspection.type,
            status: inspection.status,
            propertyId: inspection.propertyId,
            landlordId: inspection.landlordId,
            tenantId: inspection.tenantId,
            scheduledDate: inspection.scheduledDate,
            startedAt: inspection.startedAt,
            completedAt: inspection.completedAt,
            rooms: inspection.rooms,
            meters: inspection.meters,
            keys: inspection.keys,
            generalNotes: inspection.generalNotes,
            createdAt: inspection.createdAt,
            updatedAt: inspection.updatedAt,
          }),
        })
          .then(async (r) => (r.ok ? (r.json() as Promise<Inspection>) : null))
          .then((serverInspection) => {
            if (!serverInspection) return
            setInspections((prev) => prev.map((i) => (i.id === inspection.id ? serverInspection : i)))
          })
          .catch(() => {})
      }, 600)
    },
    [jsonHeaders, persistenceMode],
  )

  const deleteInspectionInternal = useCallback(
    (id: string) => {
      setInspections((prev) => prev.filter((i) => i.id !== id))

      if (persistenceMode !== "server") return
      void fetch(`/api/v1/inspections/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      }).catch(() => {})
    },
    [jsonHeaders, persistenceMode],
  )

  // Contact actions
  const addContact = useCallback((contact: Omit<Contact, "id" | "createdAt">): Contact => {
    const newContact: Contact = {
      ...contact,
      id: generateId("c"),
      createdAt: new Date().toISOString(),
    }
    createContactInternal(newContact)
    return newContact
  }, [createContactInternal])

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    updateContactInternal(id, updates)
  }, [updateContactInternal])

  const deleteContact = useCallback((id: string) => {
    deleteContactInternal(id)
  }, [deleteContactInternal])

  // Property actions
  const addProperty = useCallback((property: Omit<Property, "id" | "createdAt">): Property => {
    const newProperty: Property = {
      ...property,
      id: generateId("p"),
      createdAt: new Date().toISOString(),
    }
    createPropertyInternal(newProperty)
    return newProperty
  }, [createPropertyInternal])

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    updatePropertyInternal(id, updates)
  }, [updatePropertyInternal])

  const deleteProperty = useCallback((id: string) => {
    deletePropertyInternal(id)
  }, [deletePropertyInternal])

  // Deal actions
  const addDeal = useCallback(
    (deal: Omit<Deal, "id" | "createdAt">): Deal => {
      const newDeal: Deal = {
        ...deal,
        id: generateId("d"),
        createdAt: new Date().toISOString(),
      }
      setDeals((prev) => [...prev, newDeal])

      const contact = contacts.find((c) => c.id === deal.buyerId)
      if (contact) {
        const taskTitle =
          deal.status === "lead"
            ? `Contact ${contact.firstName} ${contact.lastName} about new deal`
            : `Follow up with ${contact.firstName} ${contact.lastName}`

        const newTask: Task = {
          id: generateId("t"),
          title: taskTitle,
          description: `New ${deal.type} deal created. Follow up required.`,
          assignedTo: deal.assignedTo,
          relatedTo: { type: "deal", id: newDeal.id },
          priority: "medium",
          status: "todo",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          completedAt: null,
          createdAt: new Date().toISOString(),
        }
        createTaskInternal(newTask)
      }

      return newDeal
    },
    [contacts, createTaskInternal],
  )

  const updateDeal = useCallback((id: string, updates: Partial<Deal>) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }, [])

  const deleteDeal = useCallback((id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id))
    setTasks((prev) => prev.filter((t) => !(t.relatedTo?.type === "deal" && t.relatedTo.id === id)))
  }, [])

  const moveDealToStage = useCallback(
    (id: string, status: Deal["status"]) => {
      const deal = deals.find((d) => d.id === id)
      if (!deal) return

      setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))

      const contact = contacts.find((c) => c.id === deal.buyerId)
      if (contact) {
        let taskTitle = ""
        let taskPriority: Task["priority"] = "medium"

        switch (status) {
          case "visit":
            taskTitle = `Schedule property visit with ${contact.firstName} ${contact.lastName}`
            break
          case "offer":
            taskTitle = `Review offer from ${contact.firstName} ${contact.lastName}`
            taskPriority = "high"
            break
          case "negotiation":
            taskTitle = `Negotiate terms with ${contact.firstName} ${contact.lastName}`
            taskPriority = "high"
            break
          case "contract":
            taskTitle = `Prepare contract for ${contact.firstName} ${contact.lastName}`
            taskPriority = "urgent"
            break
          case "notary":
            taskTitle = `Schedule notary appointment for ${contact.firstName} ${contact.lastName}`
            taskPriority = "urgent"
            break
          case "closed":
            taskTitle = `Complete closing documentation for ${contact.firstName} ${contact.lastName}`
            break
        }

        if (taskTitle) {
          const newTask: Task = {
            id: generateId("t"),
            title: taskTitle,
            description: `Deal moved to ${status} stage`,
            assignedTo: deal.assignedTo,
            relatedTo: { type: "deal", id },
            priority: taskPriority,
            status: "todo",
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            completedAt: null,
            createdAt: new Date().toISOString(),
          }
          createTaskInternal(newTask)
        }
      }
    },
    [deals, contacts, createTaskInternal],
  )

  // Visit actions
  const addVisit = useCallback(
    (visit: Omit<Visit, "id">): Visit => {
      const newVisit: Visit = {
        ...visit,
        id: generateId("v"),
      }
      createVisitInternal(newVisit)

      const contact = contacts.find((c) => c.id === visit.contactId)
      const property = properties.find((p) => p.id === visit.propertyId)

      if (contact && property) {
        const newTask: Task = {
          id: generateId("t"),
          title: `Property visit: ${property.reference} with ${contact.firstName}`,
          description: `Visit scheduled for ${visit.date} at ${visit.startTime}`,
          assignedTo: visit.agentId,
          relatedTo: { type: "visit", id: newVisit.id },
          priority: "high",
          status: "todo",
          dueDate: visit.date,
          completedAt: null,
          createdAt: new Date().toISOString(),
        }
        createTaskInternal(newTask)
      }

      return newVisit
    },
    [contacts, properties, createTaskInternal, createVisitInternal],
  )

  const updateVisit = useCallback((id: string, updates: Partial<Visit>) => {
    updateVisitInternal(id, updates)
  }, [updateVisitInternal])

  const deleteVisit = useCallback((id: string) => {
    deleteVisitInternal(id)
    setTasks((prev) => prev.filter((t) => !(t.relatedTo?.type === "visit" && t.relatedTo.id === id)))
  }, [deleteVisitInternal])

  // Task actions
  const addTask = useCallback((task: Omit<Task, "id" | "createdAt">): Task => {
    const newTask: Task = {
      ...task,
      id: generateId("t"),
      createdAt: new Date().toISOString(),
    }
    createTaskInternal(newTask)
    return newTask
  }, [createTaskInternal])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateTaskInternal(id, updates)
  }, [updateTaskInternal])

  const deleteTask = useCallback((id: string) => {
    deleteTaskInternal(id)
  }, [deleteTaskInternal])

  const completeTask = useCallback((id: string) => {
    updateTaskInternal(id, { status: "completed", completedAt: new Date().toISOString() })
  }, [updateTaskInternal])

  // Contract actions
  const addContract = useCallback((contract: Omit<Contract, "id" | "createdAt">): Contract => {
    const newContract: Contract = {
      ...contract,
      id: generateId("ct"),
      createdAt: new Date().toISOString(),
    }
    createContractInternal(newContract)
    return newContract
  }, [createContractInternal])

  const updateContract = useCallback((id: string, updates: Partial<Contract>) => {
    updateContractInternal(id, updates)
  }, [updateContractInternal])

  const deleteContract = useCallback((id: string) => {
    deleteContractInternal(id)
  }, [deleteContractInternal])

  // Operational document actions
  const addOperationalDocument = useCallback(
    (doc: Omit<OperationalDocument, "id" | "createdAt">): OperationalDocument => {
      const newDoc: OperationalDocument = {
        ...doc,
        id: generateId("od"),
        createdAt: new Date().toISOString(),
      }
      createOperationalDocumentInternal(newDoc)
      return newDoc
    },
    [createOperationalDocumentInternal],
  )

  const updateOperationalDocument = useCallback(
    (id: string, updates: Partial<OperationalDocument>) => {
      updateOperationalDocumentInternal(id, updates)
    },
    [updateOperationalDocumentInternal],
  )

  const deleteOperationalDocument = useCallback(
    (id: string) => {
      deleteOperationalDocumentInternal(id)
    },
    [deleteOperationalDocumentInternal],
  )

  // Marketing document actions
  const addMarketingDocument = useCallback(
    (doc: Omit<CommercialDocument, "id" | "createdAt">): CommercialDocument => {
      const newDoc: CommercialDocument = {
        ...doc,
        id: generateId("md"),
        createdAt: new Date().toISOString(),
      }
      createMarketingDocumentInternal(newDoc)
      return newDoc
    },
    [createMarketingDocumentInternal],
  )

  const upsertMarketingDocument = useCallback((doc: CommercialDocument) => {
    setMarketingDocuments((prev) => {
      const index = prev.findIndex((d) => d.id === doc.id)
      if (index === -1) return [doc, ...prev]
      const next = [...prev]
      next[index] = doc
      return next
    })
  }, [])

  const updateMarketingDocument = useCallback(
    (id: string, updates: Partial<CommercialDocument>) => {
      updateMarketingDocumentInternal(id, updates)
    },
    [updateMarketingDocumentInternal],
  )

  const deleteMarketingDocument = useCallback(
    (id: string) => {
      deleteMarketingDocumentInternal(id)
    },
    [deleteMarketingDocumentInternal],
  )

  // Commission actions
  const addCommission = useCallback((commission: Omit<Commission, "id" | "createdAt">): Commission => {
    const newCommission: Commission = {
      ...commission,
      id: generateId("com"),
      createdAt: new Date().toISOString(),
    }
    setCommissions((prev) => [...prev, newCommission])
    return newCommission
  }, [])

  const updateCommission = useCallback((id: string, updates: Partial<Commission>) => {
    updateCommissionInternal(id, updates)
  }, [updateCommissionInternal])

  const markCommissionPaid = useCallback((id: string) => {
    updateCommissionInternal(id, { status: "paid", paidAt: new Date().toISOString() })
  }, [updateCommissionInternal])

  // Invoice actions
  const addInvoice = useCallback((invoice: Omit<Invoice, "id" | "createdAt">): Invoice => {
    const newInvoice: Invoice = {
      ...invoice,
      id: generateId("inv"),
      createdAt: new Date().toISOString(),
    }
    createInvoiceInternal(newInvoice)
    return newInvoice
  }, [createInvoiceInternal])

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    updateInvoiceInternal(id, updates)
  }, [updateInvoiceInternal])

  const markInvoicePaid = useCallback((id: string) => {
    updateInvoiceInternal(id, { status: "paid", paidAt: new Date().toISOString() })
  }, [updateInvoiceInternal])

  const sendInvoice = useCallback((id: string) => {
    updateInvoiceInternal(id, { status: "sent" })
  }, [updateInvoiceInternal])

  // Campaign actions
  const addCampaign = useCallback((campaign: Omit<MarketingCampaign, "id" | "createdAt">): MarketingCampaign => {
    const newCampaign: MarketingCampaign = {
      ...campaign,
      id: generateId("mc"),
      createdAt: new Date().toISOString(),
    }
    setCampaigns((prev) => [newCampaign, ...prev])
    return newCampaign
  }, [])

  const updateCampaign = useCallback((id: string, updates: Partial<MarketingCampaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }, [])

  const deleteCampaign = useCallback((id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // Email actions
  const addEmail = useCallback((email: Omit<Email, "id">): Email => {
    const newEmail: Email = {
      ...email,
      id: generateId("em"),
    }
    setEmails((prev) => [newEmail, ...prev])
    return newEmail
  }, [])

  const updateEmail = useCallback((id: string, updates: Partial<Email>) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }, [])

  const deleteEmail = useCallback((id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const markEmailRead = useCallback((id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, status: "read", readAt: new Date().toISOString() } : e)))
  }, [])

  const markEmailUnread = useCallback((id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, status: "unread", readAt: null } : e)))
  }, [])

  const starEmail = useCallback((id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: true } : e)))
  }, [])

  const unstarEmail = useCallback((id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: false } : e)))
  }, [])

  const archiveEmail = useCallback((id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, folder: "archived", status: "archived" } : e)))
  }, [])

  const addEmailAccount = useCallback((account: Omit<EmailAccount, "id">): EmailAccount => {
    const newAccount: EmailAccount = {
      ...account,
      id: generateId("ea"),
    }
    setEmailAccounts((prev) => [...prev, newAccount])
    return newAccount
  }, [])

  const removeEmailAccount = useCallback((id: string) => {
    setEmailAccounts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // Inspection actions
  const addInspection = useCallback((inspection: Omit<Inspection, "id" | "createdAt" | "updatedAt">): Inspection => {
    const now = new Date().toISOString()
    const newInspection: Inspection = {
      ...inspection,
      id: generateId("insp"),
      createdAt: now,
      updatedAt: now,
    }
    createInspectionInternal(newInspection)
    return newInspection
  }, [createInspectionInternal])

  const saveInspection = useCallback((inspection: Inspection) => {
    const next: Inspection = { ...inspection, updatedAt: new Date().toISOString() }
    saveInspectionInternal(next)
  }, [saveInspectionInternal])

  const deleteInspection = useCallback((id: string) => {
    deleteInspectionInternal(id)
  }, [deleteInspectionInternal])

  const addPhotoGeneration = useCallback((generation: Omit<PhotoToolGeneration, "id" | "createdAt">) => {
    const newGen: PhotoToolGeneration = {
      ...generation,
      id: generateId("pg"),
      createdAt: new Date().toISOString(),
    }
    setPhotoGenerations((prev) => [newGen, ...prev].slice(0, 200))
    return newGen
  }, [])

  const getPhotoGenerationsByPropertyId = useCallback(
    (propertyId: string) => photoGenerations.filter((g) => g.propertyId === propertyId),
    [photoGenerations],
  )

  const getPhotoGenerationsByContactId = useCallback(
    (contactId: string) => photoGenerations.filter((g) => g.contactId === contactId),
    [photoGenerations],
  )

  // Helper functions
  const getContactById = useCallback((id: string) => contacts.find((c) => c.id === id), [contacts])
  const getPropertyById = useCallback((id: string) => properties.find((p) => p.id === id), [properties])
  const getDealById = useCallback((id: string) => deals.find((d) => d.id === id), [deals])
  const getVisitById = useCallback((id: string) => visits.find((v) => v.id === id), [visits])
  const getTaskById = useCallback((id: string) => tasks.find((t) => t.id === id), [tasks])
  const getContractById = useCallback((id: string) => contracts.find((c) => c.id === id), [contracts])
  const getInspectionById = useCallback((id: string) => inspections.find((i) => i.id === id), [inspections])

  const getTasksByDealId = useCallback(
    (dealId: string) => tasks.filter((t) => t.relatedTo?.type === "deal" && t.relatedTo.id === dealId),
    [tasks],
  )

  const getVisitsByPropertyId = useCallback(
    (propertyId: string) => visits.filter((v) => v.propertyId === propertyId),
    [visits],
  )

  const getDealsByContactId = useCallback((contactId: string) => deals.filter((d) => d.buyerId === contactId), [deals])

  const getCommissionsByDealId = useCallback(
    (dealId: string) => commissions.filter((c) => c.dealId === dealId),
    [commissions],
  )

  const getInvoicesByContactId = useCallback(
    (contactId: string) => invoices.filter((i) => i.contactId === contactId),
    [invoices],
  )

  const getCampaignById = useCallback((id: string) => campaigns.find((c) => c.id === id), [campaigns])

  const getEmailsByContactId = useCallback(
    (contactId: string) => {
      const contact = contacts.find((c) => c.id === contactId)
      if (!contact) return []
      return emails.filter(
        (e) =>
          e.from.email === contact.email ||
          e.to.some((t) => t.email === contact.email) ||
          (e.relatedTo?.type === "contact" && e.relatedTo.id === contactId),
      )
    },
    [emails, contacts],
  )

  const getUnreadEmailCount = useCallback(() => {
    return emails.filter((e) => e.status === "unread" && e.folder === "inbox").length
  }, [emails])

  const getPendingTaskCount = useCallback(() => {
    return tasks.filter((t) => t.status === "todo" || t.status === "in_progress").length
  }, [tasks])

  const getUpcomingVisitsToday = useCallback(() => {
    const today = new Date().toISOString().split("T")[0]
    return visits.filter((v) => v.date === today && (v.status === "scheduled" || v.status === "confirmed"))
  }, [visits])

  const value: DataStore = {
    currentUserId,
    currentAgencyId,
    contacts,
    properties,
    deals,
    visits,
    tasks,
    contracts,
    operationalDocuments,
    marketingDocuments,
    commissions,
    invoices,
    campaigns,
    emails,
    emailAccounts,
    inspections,
    photoGenerations,
    addContact,
    updateContact,
    deleteContact,
    addProperty,
    updateProperty,
    deleteProperty,
    addDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage,
    addVisit,
    updateVisit,
    deleteVisit,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addContract,
    updateContract,
    deleteContract,
    addOperationalDocument,
    updateOperationalDocument,
    deleteOperationalDocument,
    addMarketingDocument,
    upsertMarketingDocument,
    updateMarketingDocument,
    deleteMarketingDocument,
    addCommission,
    updateCommission,
    markCommissionPaid,
    addInvoice,
    updateInvoice,
    markInvoicePaid,
    sendInvoice,

    addCampaign,
    updateCampaign,
    deleteCampaign,
    addEmail,
    updateEmail,
    deleteEmail,
    markEmailRead,
    markEmailUnread,
    starEmail,
    unstarEmail,
    archiveEmail,
    addEmailAccount,
    removeEmailAccount,
    addInspection,
    saveInspection,
    deleteInspection,
    addPhotoGeneration,
    getPhotoGenerationsByPropertyId,
    getPhotoGenerationsByContactId,
    getContactById,
    getPropertyById,
    getDealById,
    getVisitById,
    getTaskById,
    getContractById,
    getInspectionById,
    getTasksByDealId,
    getVisitsByPropertyId,
    getDealsByContactId,
    getCommissionsByDealId,
    getInvoicesByContactId,
    getCampaignById,
    getEmailsByContactId,
    getUnreadEmailCount,
    getPendingTaskCount,
    getUpcomingVisitsToday,

    refreshTasks,
  }

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
}

export function useDataStore() {
  const context = useContext(DataStoreContext)
  if (!context) {
    throw new Error("useDataStore must be used within a DataStoreProvider")
  }
  return context
}
