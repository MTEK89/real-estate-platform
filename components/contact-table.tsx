"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useDataStore } from "@/lib/data-store"
import { calculateLeadScore, getScoreColor } from "@/lib/lead-scoring"
import { MoreHorizontal, Mail, Phone, Calendar, Zap, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

export function ContactTable() {
  const { contacts, deals, visits, tasks, emails, getEmailsByContactId } = useDataStore()

  // Calculate lead scores for all contacts
  const contactsWithScores = useMemo(() => {
    return contacts.map((contact) => {
      const contactDeals = deals.filter((d) => d.buyerId === contact.id)
      const contactVisits = visits.filter((v) => v.contactId === contact.id)
      const contactTasks = tasks.filter(
        (t) =>
          (t.relatedTo?.type === "contact" && t.relatedTo.id === contact.id) ||
          contactDeals.some((d) => t.relatedTo?.type === "deal" && t.relatedTo.id === d.id),
      )
      const contactEmails = getEmailsByContactId(contact.id)

      const score = calculateLeadScore(contact, contactDeals, contactVisits, contactTasks, contactEmails)

      return {
        ...contact,
        score,
        dealsCount: contactDeals.length,
        visitsCount: contactVisits.length,
      }
    })
  }, [contacts, deals, visits, tasks, emails, getEmailsByContactId])

  // Sort by score descending
  const sortedContacts = useMemo(() => {
    return [...contactsWithScores].sort((a, b) => b.score.total - a.score.total)
  }, [contactsWithScores])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getRecencyIndicator = (lastContactAt: string | null) => {
    if (!lastContactAt) return { icon: TrendingDown, color: "text-red-500", label: "No contact" }

    const daysSince = Math.floor((new Date().getTime() - new Date(lastContactAt).getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince <= 3) return { icon: TrendingUp, color: "text-emerald-500", label: "Recent" }
    if (daysSince <= 7) return { icon: Minus, color: "text-amber-500", label: "This week" }
    return { icon: TrendingDown, color: "text-red-500", label: "Overdue" }
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox />
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="w-[100px]">
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                Score
              </span>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedContacts.map((contact) => {
            const colors = getScoreColor(contact.score.grade)
            const recency = getRecencyIndicator(contact.lastContactAt)
            const RecencyIcon = recency.icon

            return (
              <TableRow key={contact.id} className={contact.score.grade === "A" ? "bg-emerald-50/30" : ""}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {contact.firstName[0]}
                        {contact.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="font-medium text-card-foreground hover:underline"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                              colors.bg,
                              colors.text,
                            )}
                          >
                            {contact.score.total}
                          </div>
                          <Badge variant="outline" className={cn("text-xs", colors.bg, colors.text, colors.border)}>
                            {contact.score.grade}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium">{contact.score.label}</p>
                          {contact.score.insights.map((insight, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground">
                              {insight}
                            </p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Badge className={cn(typeStyles[contact.type], "capitalize")}>{contact.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(statusStyles[contact.status], "capitalize")}>
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {contact.dealsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {contact.visitsCount}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <RecencyIcon className={cn("h-4 w-4", recency.color)} />
                    <span className="text-muted-foreground text-sm">{formatDate(contact.lastContactAt)}</span>
                  </div>
                </TableCell>
	                <TableCell>
	                  <div className="flex items-center gap-1">
	                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Email composer coming soon.")}>
	                      <Mail className="h-4 w-4" />
	                    </Button>
	                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Call action coming soon.")}>
	                      <Phone className="h-4 w-4" />
	                    </Button>
	                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
	                      <DropdownMenuContent align="end">
	                        <DropdownMenuItem asChild>
	                          <Link href={`/dashboard/contacts/${contact.id}`}>View Details</Link>
	                        </DropdownMenuItem>
	                        <DropdownMenuItem asChild>
	                          <Link href={`/dashboard/contacts/${contact.id}`}>Edit Contact</Link>
	                        </DropdownMenuItem>
	                        <DropdownMenuItem onClick={() => toast.info("Visit scheduling from contact coming soon.")}>
	                          <Calendar className="mr-2 h-4 w-4" />
	                          Schedule Visit
	                        </DropdownMenuItem>
	                        <DropdownMenuSeparator />
	                        <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Delete contact coming soon.")}>
	                          Delete
	                        </DropdownMenuItem>
	                      </DropdownMenuContent>
	                    </DropdownMenu>
	                  </div>
	                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
