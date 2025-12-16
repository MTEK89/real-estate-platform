"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Building2,
  Users,
  TrendingUp,
  FileText,
  Calendar,
  CheckSquare,
  ArrowRight,
  Command,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { contacts, properties, deals, visits, contracts, tasks } from "@/lib/mock-data"

interface SearchResult {
  id: string
  type: "contact" | "property" | "deal" | "visit" | "contract" | "task"
  title: string
  subtitle: string
  href: string
}

const typeConfig = {
  contact: { icon: Users, label: "Contact", color: "text-sky-500" },
  property: { icon: Building2, label: "Property", color: "text-emerald-500" },
  deal: { icon: TrendingUp, label: "Deal", color: "text-amber-500" },
  visit: { icon: Calendar, label: "Visit", color: "text-purple-500" },
  contract: { icon: FileText, label: "Contract", color: "text-rose-500" },
  task: { icon: CheckSquare, label: "Task", color: "text-cyan-500" },
}

function searchAllEntities(query: string): SearchResult[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const results: SearchResult[] = []

  // Search contacts
  contacts.forEach((contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase()
    if (fullName.includes(q) || contact.email?.toLowerCase().includes(q) || contact.phone?.includes(q)) {
      results.push({
        id: contact.id,
        type: "contact",
        title: `${contact.firstName} ${contact.lastName}`,
        subtitle: `${contact.type} · ${contact.email || contact.phone || "No contact info"}`,
        href: `/dashboard/contacts/${contact.id}`,
      })
    }
  })

  // Search properties
  properties.forEach((property) => {
    if (
      property.reference.toLowerCase().includes(q) ||
      property.address.street.toLowerCase().includes(q) ||
      property.address.city.toLowerCase().includes(q)
    ) {
      results.push({
        id: property.id,
        type: "property",
        title: property.address.street,
        subtitle: `${property.reference} · ${property.address.city} · €${property.price.toLocaleString("de-DE")}`,
        href: `/dashboard/properties/${property.id}`,
      })
    }
  })

  // Search deals
  deals.forEach((deal) => {
    const property = properties.find((p) => p.id === deal.propertyId)
    const contact = contacts.find((c) => c.id === deal.buyerId)
    const searchText =
      `${property?.reference || ""} ${property?.address.street || ""} ${contact?.firstName || ""} ${contact?.lastName || ""}`.toLowerCase()

    if (searchText.includes(q) || deal.id.toLowerCase().includes(q)) {
      results.push({
        id: deal.id,
        type: "deal",
        title: property?.address.street || `Deal #${deal.id}`,
        subtitle: `${deal.status} · ${contact ? `${contact.firstName} ${contact.lastName}` : "Unknown buyer"}`,
        href: `/dashboard/pipeline`,
      })
    }
  })

  // Search visits
  visits.forEach((visit) => {
    const property = properties.find((p) => p.id === visit.propertyId)
    const contact = contacts.find((c) => c.id === visit.contactId)

    if (
      property?.address.street.toLowerCase().includes(q) ||
      contact?.firstName.toLowerCase().includes(q) ||
      contact?.lastName.toLowerCase().includes(q)
    ) {
      results.push({
        id: visit.id,
        type: "visit",
        title: `Visit at ${property?.address.street || "Unknown property"}`,
        subtitle: `${visit.date} · ${contact?.firstName} ${contact?.lastName}`,
        href: `/dashboard/visits`,
      })
    }
  })

  // Search contracts
  contracts.forEach((contract) => {
    const property = properties.find((p) => p.id === contract.propertyId)
    const contact = contacts.find((c) => c.id === contract.contactId)

    if (
      property?.reference.toLowerCase().includes(q) ||
      contract.type.toLowerCase().includes(q) ||
      contact?.firstName.toLowerCase().includes(q) ||
      contact?.lastName.toLowerCase().includes(q)
    ) {
      results.push({
        id: contract.id,
        type: "contract",
        title: `${contract.type.charAt(0).toUpperCase() + contract.type.slice(1)} Contract`,
        subtitle: `${property?.reference || "Unknown property"} · ${contact?.firstName} ${contact?.lastName}`,
        href: `/dashboard/contracts`,
      })
    }
  })

  // Search tasks
  tasks.forEach((task) => {
    if (task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q)) {
      results.push({
        id: task.id,
        type: "task",
        title: task.title,
        subtitle: `${task.priority} priority · Due ${new Date(task.dueDate).toLocaleDateString()}`,
        href: `/dashboard/tasks`,
      })
    }
  })

  return results.slice(0, 10) // Limit results
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    setResults(searchAllEntities(query))
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }

      if (!open) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : i))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => (i > 0 ? i - 1 : i))
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault()
        router.push(results[selectedIndex].href)
        setOpen(false)
        setQuery("")
      } else if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    },
    [open, results, selectedIndex, router],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const navigateToResult = (result: SearchResult) => {
    router.push(result.href)
    setOpen(false)
    setQuery("")
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative w-64 justify-start bg-muted/50 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
          <VisuallyHidden>
            <DialogTitle>Search</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts, properties, deals, tasks..."
              className="flex h-12 w-full border-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {query && (
            <ScrollArea className="max-h-80">
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => {
                    const config = typeConfig[result.type]
                    const Icon = config.icon

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => navigateToResult(result)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
                </div>
              )}
            </ScrollArea>
          )}

          {!query && (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Quick Links</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
                  { label: "Contacts", href: "/dashboard/contacts", icon: Users },
                  { label: "Pipeline", href: "/dashboard/pipeline", icon: TrendingUp },
                  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
                  { label: "Visits", href: "/dashboard/visits", icon: Calendar },
                  { label: "Contracts", href: "/dashboard/contracts", icon: FileText },
                ].map((link) => (
                  <button
                    key={link.href}
                    onClick={() => {
                      router.push(link.href)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors"
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
