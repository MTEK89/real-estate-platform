"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
  Users,
  Calendar,
  FileText,
  ClipboardCheck,
  Settings,
  TrendingUp,
  ChevronDown,
  LogOut,
  Bell,
  Megaphone,
  DollarSign,
  CheckSquare,
  BarChart3,
  Mail,
  Sparkles,
  Calculator,
  MessageCircle,
  Wand2,
  Camera,
  Stamp,
  PenLine,
  Images,
  Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/lib/data-store"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

const navigationGroups = [
  {
    label: "Home",
    items: [
      { name: "Today", href: "/dashboard", icon: Sparkles, description: "AI Command Center" },
      { name: "AI Agent", href: "/dashboard/agent", icon: Bot, description: "Chat with your assistant", badge: "new" },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "CRM",
    items: [
      { name: "Pipeline", href: "/dashboard/pipeline", icon: TrendingUp },
      { name: "Properties", href: "/dashboard/properties", icon: Building2 },
      { name: "Contacts", href: "/dashboard/contacts", icon: Users },
      { name: "Visits", href: "/dashboard/visits", icon: Calendar },
      { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Documents",
    items: [
      { name: "Contracts", href: "/dashboard/contracts", icon: FileText },
      { name: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
      { name: "Inspections", href: "/dashboard/inspections", icon: ClipboardCheck },
      { name: "Finance", href: "/dashboard/finance", icon: DollarSign },
      { name: "Estimation", href: "/dashboard/valuation", icon: Calculator },
    ],
  },
  {
    label: "Media",
    items: [
      { name: "Gallery", href: "/dashboard/gallery", icon: Images },
    ],
  },
  {
    label: "AI Studio",
    items: [
      { name: "AI Photo Tools", href: "/dashboard/tools/prompt-master", icon: Wand2 },
      { name: "AI Headshots", href: "/dashboard/tools/headshot", icon: Camera },
      { name: "Watermark Photos", href: "/dashboard/tools/watermark", icon: Stamp },
      { name: "PDF Writer", href: "/dashboard/tools/pdf-writer", icon: PenLine },
    ],
  },
  {
    label: "Communicate",
    items: [
      { name: "Email", href: "/dashboard/email", icon: Mail, badge: true },
      { name: "Messages", href: "/dashboard/messages", icon: MessageCircle },
    ],
  },
]

const bottomNavigation = [{ name: "Settings", href: "/dashboard/settings", icon: Settings }]

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { getUnreadEmailCount } = useDataStore()
  const unreadCount = getUnreadEmailCount()
  const [mounted, setMounted] = useState(false)
  const [agencyName, setAgencyName] = useState<string>("")
  const [profile, setProfile] = useState<{ firstName: string; lastName: string; role: string; email: string | null } | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null)

  // Prevent hydration mismatch with Radix UI dropdown
  useEffect(() => {
    setMounted(true)
    setSupabase(getSupabaseBrowserClient())
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/v1/settings")
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || "Failed to load settings")
        if (cancelled) return

        setAgencyName(typeof json?.agency?.name === "string" ? json.agency.name : "")
        setProfile({
          firstName: typeof json?.profile?.firstName === "string" ? json.profile.firstName : "Agent",
          lastName: typeof json?.profile?.lastName === "string" ? json.profile.lastName : "User",
          role: typeof json?.profile?.role === "string" ? json.profile.role : "agent",
          email: typeof json?.profile?.email === "string" ? json.profile.email : null,
        })
      } catch {
        // ignore: fall back to placeholders
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const displayAgencyName = agencyName || "Your Agency"
  const displayFirst = profile?.firstName || "Agent"
  const displayLast = profile?.lastName || "User"
  const displayRole = (profile?.role || "agent").replace(/_/g, " ")
  const initials = `${displayFirst[0] ?? ""}${displayLast[0] ?? ""}`.toUpperCase()

  const onSignOut = async () => {
    try {
      await supabase?.auth.signOut()
    } finally {
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <aside className="flex h-dvh w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo / Agency */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{displayAgencyName}</span>
          <span className="text-xs text-sidebar-foreground/60">Real Estate</span>
        </div>
      </div>

      {/* Main Navigation - Grouped */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigationGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                const isFeatured = "featured" in item && item.featured
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : isFeatured
                          ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4", isFeatured && !isActive && "text-emerald-500")} />
                      {item.name}
                    </span>
                    {item.badge && unreadCount > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 px-1.5 bg-primary text-primary-foreground">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </div>

      {/* User Menu */}
      <div className="border-t border-sidebar-border p-3">
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 h-auto hover:bg-sidebar-accent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt={displayFirst} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-sidebar-foreground">
                    {displayFirst} {displayLast}
                  </span>
                  <span className="text-xs text-sidebar-foreground/60 capitalize">{displayRole}</span>
                </div>
                <ChevronDown className="ml-auto h-4 w-4 text-sidebar-foreground/60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => void onSignOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium text-sidebar-foreground">
                {displayFirst} {displayLast}
              </span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{displayRole}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
