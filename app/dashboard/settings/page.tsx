"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { defaultBrandConfig, brandThemes, type BrandTheme } from "@/lib/pdf/config/brand-config"
import type { BrandConfig } from "@/lib/pdf/types"
import { Building2, User, Bell, Shield, Palette, Globe, CreditCard, Users, FileText, Upload, Check, Database, Copy, RefreshCw } from "lucide-react"

type SettingsPayload = {
  agency: { id: string; name: string; settings: Record<string, any> } | null
  profile: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    role: string
    settings: Record<string, any>
  } | null
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [payload, setPayload] = useState<SettingsPayload | null>(null)

  // Branding state
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(defaultBrandConfig)
  const [selectedTheme, setSelectedTheme] = useState<BrandTheme | "custom">("professional")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Profile / Agency state (Lux go-live basics)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [agencyName, setAgencyName] = useState("")

  // Agency settings (stored under agencies.settings)
  const [vatNumber, setVatNumber] = useState("")
  const [rcsNumber, setRcsNumber] = useState("")
  const [invoicePrefix, setInvoicePrefix] = useState("INV")
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("1")
  const [iban, setIban] = useState("")
  const [bic, setBic] = useState("")
  const [timezone, setTimezone] = useState("Europe/Luxembourg")
  const [currency, setCurrency] = useState("EUR")
  const [language, setLanguage] = useState("fr")

  // Auto-sync agency identity into PDF branding defaults (without overwriting user edits).
  const lastAutoIdentityRef = useRef<{ agencyName: string; email: string }>({ agencyName: "", email: "" })

  // Team
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; userId: string; role: string; profile: any }>>([])
  const [teamInvites, setTeamInvites] = useState<Array<{ id: string; email: string; role: string; status: string; created_at: string; accepted_at: string | null }>>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"agent" | "manager" | "admin">("agent")
  const [isInviting, setIsInviting] = useState(false)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)

  // Data/Supabase setup state
  const [setupStatus, setSetupStatus] = useState<{
    ok: boolean
    missing: string[]
    adminConfigured: boolean
    fal?: { configured: boolean; model: string }
    error?: string
  } | null>(null)
  const [isCheckingSetup, setIsCheckingSetup] = useState(false)
  const [schemaSql, setSchemaSql] = useState<string | null>(null)
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  // Handle logo upload
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }
    if (file.size > 1024 * 1024) {
      alert("File size must be less than 1MB")
      return
    }

    // PDF rendering is most reliable with PNG/JPEG. SVG and WEBP frequently won't render in react-pdf.
    // Convert SVG/WEBP uploads to PNG client-side before saving.
    if (file.type === "image/svg+xml" || file.type === "image/webp") {
      const url = URL.createObjectURL(file)
      const img = new window.Image()
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          // Default logo box for PDFs (similar to header constraints); keep it reasonably sized.
          const targetW = 600
          const targetH = 200
          canvas.width = targetW
          canvas.height = targetH

          const ctx = canvas.getContext("2d")
          if (!ctx) throw new Error("No canvas context")

          ctx.clearRect(0, 0, targetW, targetH)

          const iw = img.naturalWidth || targetW
          const ih = img.naturalHeight || targetH
          const scale = Math.min(targetW / iw, targetH / ih)
          const dw = Math.max(1, Math.round(iw * scale))
          const dh = Math.max(1, Math.round(ih * scale))
          const dx = Math.round((targetW - dw) / 2)
          const dy = Math.round((targetH - dh) / 2)
          ctx.drawImage(img, dx, dy, dw, dh)

          const pngDataUrl = canvas.toDataURL("image/png")
          setLogoPreview(pngDataUrl)
          setBrandConfig((prev) => ({ ...prev, logo: pngDataUrl }))
        } catch {
          alert("Failed to process logo. Please upload a PNG or JPG.")
        } finally {
          URL.revokeObjectURL(url)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        alert("Failed to load logo. Please upload a PNG or JPG.")
      }
      img.src = url
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setLogoPreview(base64)
      setBrandConfig((prev) => ({ ...prev, logo: base64 }))
    }
    reader.readAsDataURL(file)
  }, [])

  const savedLogoLen = useMemo(() => {
    const logo = (payload as any)?.agency?.settings?.pdf_branding?.logo
    return typeof logo === "string" ? logo.length : 0
  }, [payload])

  // Handle theme selection
  const handleThemeSelect = useCallback((theme: BrandTheme | "custom") => {
    setSelectedTheme(theme)
    if (theme !== "custom" && brandThemes[theme]) {
      setBrandConfig((prev) => ({
        ...prev,
        colors: brandThemes[theme],
      }))
    }
  }, [])

  // Handle color change
  const handleColorChange = useCallback((colorKey: keyof BrandConfig["colors"], value: string) => {
    setSelectedTheme("custom")
    setBrandConfig((prev) => ({
      ...prev,
      colors: { ...prev.colors, [colorKey]: value },
    }))
  }, [])

  // Handle save brand config
  const handleSaveBrandConfig = useCallback(async () => {
    setIsSaving(true)
    try {
      const agencySettings: Record<string, unknown> = {
        vat_number: vatNumber || null,
        rcs_number: rcsNumber || null,
        invoice_prefix: invoicePrefix || "INV",
        next_invoice_number: Number.parseInt(nextInvoiceNumber || "1", 10) || 1,
        iban: iban || null,
        bic: bic || null,
        timezone,
        currency,
        language,
        pdf_branding: {
          ...brandConfig,
          // Ensure reasonable defaults for PDFs.
          agencyName: brandConfig.agencyName || agencyName,
          email: brandConfig.email || email,
        },
      }

      const res = await fetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency: { name: agencyName || undefined, settings: agencySettings },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Save failed")

      setPayload(data)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      toast.success("Branding saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setIsSaving(false)
    }
  }, [agencyName, vatNumber, rcsNumber, invoicePrefix, nextInvoiceNumber, iban, bic, timezone, currency, language, brandConfig])

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { firstName, lastName, phone: phone || null },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Save failed")

      setPayload(data)
      toast.success("Profile saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setIsSaving(false)
    }
  }, [firstName, lastName, phone])

  const handleSaveAgency = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency: {
            name: agencyName,
            settings: {
              vat_number: vatNumber || null,
              rcs_number: rcsNumber || null,
              invoice_prefix: invoicePrefix || "INV",
              next_invoice_number: Number.parseInt(nextInvoiceNumber || "1", 10) || 1,
              iban: iban || null,
              bic: bic || null,
              timezone,
              currency,
              language,
              pdf_branding: {
                ...brandConfig,
                agencyName: brandConfig.agencyName || agencyName,
                email: brandConfig.email || email,
              },
            },
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Save failed")

      setPayload(data)
      toast.success("Agency saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setIsSaving(false)
    }
  }, [agencyName, vatNumber, rcsNumber, invoicePrefix, nextInvoiceNumber, iban, bic, timezone, currency, language, brandConfig])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/v1/settings")
        const data = (await res.json().catch(() => null)) as SettingsPayload | null
        if (!res.ok || !data) throw new Error((data as any)?.error || "Failed to load settings")
        if (cancelled) return
        setPayload(data)

        if (data.profile) {
          setFirstName(data.profile.firstName || "")
          setLastName(data.profile.lastName || "")
          setEmail(data.profile.email || "")
          setPhone(data.profile.phone || "")
        }

        if (data.agency) {
          setAgencyName(data.agency.name || "")
          const s = (data.agency.settings || {}) as Record<string, any>
          setVatNumber(s.vat_number || "")
          setRcsNumber(s.rcs_number || "")
          setInvoicePrefix(s.invoice_prefix || "INV")
          setNextInvoiceNumber(String(s.next_invoice_number ?? "1"))
          setIban(s.iban || "")
          setBic(s.bic || "")
          setTimezone(s.timezone || "Europe/Luxembourg")
          setCurrency(s.currency || "EUR")
          setLanguage(s.language || "fr")

          const branding = s.pdf_branding as BrandConfig | undefined
          if (branding) {
            setBrandConfig(branding)
            setLogoPreview((branding as any).logo || null)
          }
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load settings")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const loadTeam = useCallback(async () => {
    setIsLoadingTeam(true)
    try {
      const [mRes, iRes] = await Promise.all([fetch("/api/v1/team/members"), fetch("/api/v1/team/invitations")])
      const members = await mRes.json().catch(() => [])
      const invites = await iRes.json().catch(() => [])
      if (mRes.ok && Array.isArray(members)) setTeamMembers(members)
      if (iRes.ok && Array.isArray(invites)) setTeamInvites(invites)
    } finally {
      setIsLoadingTeam(false)
    }
  }, [])

  useEffect(() => {
    void loadTeam()
  }, [loadTeam])

  const inviteMember = useCallback(async () => {
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    try {
      const res = await fetch("/api/v1/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Invite failed")
      toast.success("Invite sent")
      setInviteEmail("")
      await loadTeam()
    } catch (e: any) {
      toast.error(e?.message || "Invite failed")
    } finally {
      setIsInviting(false)
    }
  }, [inviteEmail, inviteRole, loadTeam])

  const updateMemberRole = useCallback(async (memberId: string, role: "admin" | "manager" | "agent") => {
    try {
      const res = await fetch("/api/v1/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Update failed")
      if (Array.isArray(data)) setTeamMembers(data)
      toast.success("Role updated")
    } catch (e: any) {
      toast.error(e?.message || "Update failed")
    }
  }, [])

  const removeMember = useCallback(async (memberId: string) => {
    try {
      const res = await fetch(`/api/v1/team/members?memberId=${encodeURIComponent(memberId)}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Remove failed")
      toast.success("Member removed")
      await loadTeam()
    } catch (e: any) {
      toast.error(e?.message || "Remove failed")
    }
  }, [loadTeam])

  // Keep PDF brand identity aligned with the agency + user email by default.
  useEffect(() => {
    if (!agencyName && !email) return

    setBrandConfig((prev) => {
      const last = lastAutoIdentityRef.current
      const nextAgencyName = agencyName || last.agencyName
      const nextEmail = email || last.email

      const shouldUpdateAgencyName =
        !prev.agencyName || prev.agencyName === defaultBrandConfig.agencyName || prev.agencyName === last.agencyName
      const shouldUpdateEmail = !prev.email || prev.email === last.email

      const updated = {
        ...prev,
        agencyName: shouldUpdateAgencyName ? nextAgencyName : prev.agencyName,
        email: shouldUpdateEmail ? nextEmail : prev.email,
      }

      lastAutoIdentityRef.current = { agencyName: nextAgencyName, email: nextEmail }
      return updated
    })
  }, [agencyName, email])

  const displayInitials = useMemo(() => {
    const a = (firstName || "A")[0]
    const b = (lastName || "U")[0]
    return `${a}${b}`.toUpperCase()
  }, [firstName, lastName])

  const loadSetupStatus = useCallback(async () => {
    setIsCheckingSetup(true)
    try {
      const res = await fetch("/api/v1/setup/status")
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Setup check failed")
      setSetupStatus(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Setup check failed"
      setSetupStatus({ ok: false, missing: [], adminConfigured: false, error: msg })
    } finally {
      setIsCheckingSetup(false)
    }
  }, [])

  useEffect(() => {
    void loadSetupStatus()
  }, [loadSetupStatus])

  const loadSchemaSql = useCallback(async () => {
    setIsLoadingSchema(true)
    try {
      const res = await fetch("/api/v1/setup/schema")
      const data = await res.json()
      if (!res.ok) throw new Error("Failed to load schema SQL")
      setSchemaSql(data.sql || "")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load schema SQL")
    } finally {
      setIsLoadingSchema(false)
    }
  }, [])

  const copySchemaSql = useCallback(async () => {
    if (!schemaSql) return
    try {
      await navigator.clipboard.writeText(schemaSql)
      toast.success("Schema SQL copied")
    } catch {
      toast.error("Failed to copy")
    }
  }, [schemaSql])

  const seedDemoData = useCallback(async () => {
    setIsSeeding(true)
    try {
      const res = await fetch("/api/v1/setup/seed?scope=full", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Seeding failed")
      toast.success(
        `Seeded ${Number(data?.contacts ?? 0)} contacts, ${Number(data?.properties ?? 0)} properties, ${Number(data?.tasks ?? 0)} tasks`,
      )
      await loadSetupStatus()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seeding failed")
    } finally {
      setIsSeeding(false)
    }
  }, [loadSetupStatus])

  return (
    <div className="flex flex-col">
      <DashboardHeader title="Settings" description="Manage your account and agency settings" />

      <div className="flex-1 p-6">
        <Tabs defaultValue="profile" className="w-full">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1">
                <TabsTrigger value="profile" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="agency" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <Building2 className="h-4 w-4" />
                  Agency
                </TabsTrigger>
                <TabsTrigger value="team" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <Users className="h-4 w-4" />
                  Team
                </TabsTrigger>
                <TabsTrigger value="notifications" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="appearance" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="branding" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <FileText className="h-4 w-4" />
                  PDF Branding
                </TabsTrigger>
                <TabsTrigger value="billing" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </TabsTrigger>
                <TabsTrigger value="data" className="w-full justify-start gap-2 data-[state=active]:bg-muted">
                  <Database className="h-4 w-4" />
                  Data
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-3xl">
              <TabsContent value="profile" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information and profile picture.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={"/placeholder.svg"} alt={firstName || "User"} />
                        <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                          {displayInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm" disabled>
                          Change Photo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. 1MB max.</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Luxembourg)</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+352 621 123 456" disabled={isLoading} />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => void handleSaveProfile()} disabled={isSaving || isLoading}>
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agency" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Agency Settings</CardTitle>
                    <CardDescription>Manage your agency details and branding.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="agencyName">Agency Name</Label>
                      <Input id="agencyName" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} disabled={isLoading} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="vat">VAT Number (LU)</Label>
                        <Input id="vat" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="LU12345678" disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rcs">RCS Number (Luxembourg)</Label>
                        <Input id="rcs" value={rcsNumber} onChange={(e) => setRcsNumber(e.target.value)} placeholder="B123456" disabled={isLoading} />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="invoicePrefix">Invoice prefix</Label>
                        <Input id="invoicePrefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV" disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextInvoice">Next invoice number</Label>
                        <Input id="nextInvoice" value={nextInvoiceNumber} onChange={(e) => setNextInvoiceNumber(e.target.value)} placeholder="1" disabled={isLoading} />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="iban">IBAN</Label>
                        <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="LU…" disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bic">BIC</Label>
                        <Input id="bic" value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BCEELULL" disabled={isLoading} />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Europe/Luxembourg">Europe/Luxembourg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => void handleSaveAgency()} disabled={isSaving || isLoading}>
                        Save Agency Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team and their permissions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {teamMembers.length ? (
                      teamMembers.map((member) => {
                        const name = member.profile
                          ? `${member.profile.firstName || ""} ${member.profile.lastName || ""}`.trim() || member.profile.email
                          : member.userId

                        return (
                          <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-muted-foreground">{member.profile?.email || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Select value={member.role} onValueChange={(v) => void updateMemberRole(member.id, v as any)}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void removeMember(member.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                        )
                      })
                    ) : (
                      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                        {isLoadingTeam ? "Loading team…" : "No team members found."}
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="text-sm font-medium">Invite a teammate</div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <Label htmlFor="inviteEmail">Email</Label>
                          <Input id="inviteEmail" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@agency.com" />
                        </div>
                        <div>
                          <Label htmlFor="inviteRole">Role</Label>
                          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                            <SelectTrigger id="inviteRole">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={() => void inviteMember()} disabled={isInviting || !inviteEmail.trim()}>
                          <Users className="mr-2 h-4 w-4" />
                          {isInviting ? "Inviting…" : "Send invite"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The invitee receives an email and will be added to your agency after accepting.
                      </p>
                    </div>

                    {teamInvites.length ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Pending invitations</div>
                        <div className="space-y-2">
                          {teamInvites.slice(0, 8).map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                              <div className="min-w-0">
                                <div className="truncate font-medium">{inv.email}</div>
                                <div className="text-xs text-muted-foreground">
                                  Role: {inv.role} • Status: {inv.status}
                                </div>
                              </div>
                              <Badge variant="secondary">{inv.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose how you want to receive notifications.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { id: "new-lead", label: "New Lead", description: "When a new lead is captured" },
                      { id: "visit-confirmed", label: "Visit Confirmed", description: "When a visit is confirmed" },
                      { id: "offer-received", label: "Offer Received", description: "When an offer is submitted" },
                      { id: "contract-signed", label: "Contract Signed", description: "When a contract is signed" },
                      { id: "deal-closed", label: "Deal Closed", description: "When a deal is closed" },
                    ].map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{notification.label}</p>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`${notification.id}-email`} className="text-sm text-muted-foreground">
                              Email
                            </Label>
                            <Switch id={`${notification.id}-email`} defaultChecked />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`${notification.id}-push`} className="text-sm text-muted-foreground">
                              Push
                            </Label>
                            <Switch id={`${notification.id}-push`} defaultChecked />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your password and security preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex justify-end">
                      <Button>Update Password</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <div className="grid grid-cols-3 gap-4">
                        {["Light", "Dark", "System"].map((theme) => (
                          <label
                            key={theme}
                            className="flex items-center justify-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <input
                              type="radio"
                              name="theme"
                              value={theme.toLowerCase()}
                              defaultChecked={theme === "Light"}
                              className="sr-only"
                            />
                            <Globe className="h-4 w-4" />
                            <span>{theme}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Compact Mode</p>
                        <p className="text-sm text-muted-foreground">Show more content in less space</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branding" className="mt-0 space-y-6">
                {/* Agency Identity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agency Identity</CardTitle>
                    <CardDescription>
                      Configure your agency branding for PDF documents. This information will appear on all generated
                      contracts and documents.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
	                    {/* Logo Upload */}
	                    <div className="space-y-2">
	                      <Label>Agency Logo</Label>
	                      <div className="flex items-center gap-4">
                        <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30">
                          {logoPreview || brandConfig.logo ? (
                            <img
                              src={logoPreview || brandConfig.logo}
                              alt="Agency logo"
                              className="h-20 w-20 object-contain"
                            />
                          ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                          <Button variant="outline" size="sm" asChild>
                            <label htmlFor="logo-upload" className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Logo
                            </label>
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG or JPG recommended (SVG/WEBP will be converted). Max 1MB. Recommended: 200x60px
                          </p>
	                          {savedLogoLen > 0 ? (
	                            <p className="text-xs text-emerald-600 mt-2">Logo is saved and will be used in PDFs.</p>
	                          ) : (
	                            <p className="text-xs text-amber-600 mt-2">
	                              Logo not saved yet. Click “Save Branding” at the bottom of this tab.
	                            </p>
	                          )}
	                        </div>
	                      </div>
	                    </div>

                    <Separator />

                    {/* Agency Details */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="agencyName">Agency Name</Label>
                        <Input
                          id="agencyName"
                          value={brandConfig.agencyName}
                          onChange={(e) => setBrandConfig((prev) => ({ ...prev, agencyName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">RCS (Luxembourg)</Label>
                        <Input
                          id="registrationNumber"
                          value={brandConfig.legal.rcs}
                          onChange={(e) =>
                            setBrandConfig((prev) => ({ ...prev, legal: { ...prev.legal, rcs: e.target.value } }))
                          }
                          placeholder="B123456"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Business Address</Label>
                      <Input
                        id="address"
                        value={brandConfig.address}
                        onChange={(e) => setBrandConfig((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={brandConfig.phone}
                          onChange={(e) => setBrandConfig((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={brandConfig.email}
                          onChange={(e) => setBrandConfig((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={brandConfig.website}
                          onChange={(e) => setBrandConfig((prev) => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Brand Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Colors</CardTitle>
                    <CardDescription>
                      Choose a preset theme or customize individual colors for your documents.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Theme Presets */}
                    <div className="space-y-2">
                      <Label>Color Theme</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {(["professional", "modern", "luxury", "eco", "custom"] as const).map((theme) => (
                          <label
                            key={theme}
                            className="flex flex-col items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <input
                              type="radio"
                              name="colorTheme"
                              value={theme}
                              checked={selectedTheme === theme}
                              onChange={() => handleThemeSelect(theme)}
                              className="sr-only"
                            />
                            <div className="flex gap-1">
                              {theme !== "custom" && brandThemes[theme] ? (
                                <>
                                  <div
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: brandThemes[theme].primary }}
                                  />
                                  <div
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: brandThemes[theme].secondary }}
                                  />
                                </>
                              ) : (
                                <>
                                  <div
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: brandConfig.colors.primary }}
                                  />
                                  <div
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: brandConfig.colors.secondary }}
                                  />
                                </>
                              )}
                            </div>
                            <span className="text-xs font-medium capitalize">{theme}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Custom Color Pickers */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="colorPrimary">Primary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="colorPrimary"
                            value={brandConfig.colors.primary}
                            onChange={(e) => handleColorChange("primary", e.target.value)}
                            className="h-10 w-14 rounded border cursor-pointer"
                          />
                          <Input
                            value={brandConfig.colors.primary}
                            onChange={(e) => handleColorChange("primary", e.target.value)}
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="colorSecondary">Secondary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="colorSecondary"
                            value={brandConfig.colors.secondary}
                            onChange={(e) => handleColorChange("secondary", e.target.value)}
                            className="h-10 w-14 rounded border cursor-pointer"
                          />
                          <Input
                            value={brandConfig.colors.secondary}
                            onChange={(e) => handleColorChange("secondary", e.target.value)}
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="colorHighlight">Highlight Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="colorHighlight"
                            value={brandConfig.colors.highlight}
                            onChange={(e) => handleColorChange("highlight", e.target.value)}
                            className="h-10 w-14 rounded border cursor-pointer"
                          />
                          <Input
                            value={brandConfig.colors.highlight}
                            onChange={(e) => handleColorChange("highlight", e.target.value)}
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Legal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Information</CardTitle>
                    <CardDescription>
                      Luxembourg legal information. This appears in document footers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyType">Company Type</Label>
                        <Select
                          value={brandConfig.legal.companyType}
                          onValueChange={(value) =>
                            setBrandConfig((prev) => ({ ...prev, legal: { ...prev.legal, companyType: value } }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SARL">SARL / Sàrl</SelectItem>
                            <SelectItem value="SARL-S">Sàrl-S</SelectItem>
                            <SelectItem value="SA">SA</SelectItem>
                            <SelectItem value="SCS">SCS</SelectItem>
                            <SelectItem value="SCSP">SCSp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vatNumber">VAT Number (TVA)</Label>
                        <Input
                          id="vatNumber"
                          value={brandConfig.legal.vatNumber || ""}
                          onChange={(e) =>
                            setBrandConfig((prev) => ({ ...prev, legal: { ...prev.legal, vatNumber: e.target.value } }))
                          }
                          placeholder="LU12345678"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="rcs">RCS (Luxembourg)</Label>
                        <Input
                          id="rcs"
                          value={brandConfig.legal.rcs}
                          onChange={(e) =>
                            setBrandConfig((prev) => ({ ...prev, legal: { ...prev.legal, rcs: e.target.value } }))
                          }
                          placeholder="B123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estPermit">Autorisation d'établissement (optional)</Label>
                        <Input
                          id="estPermit"
                          value={brandConfig.legal.establishmentPermit || ""}
                          onChange={(e) =>
                            setBrandConfig((prev) => ({
                              ...prev,
                              legal: { ...prev.legal, establishmentPermit: e.target.value },
                            }))
                          }
                          placeholder="Number / reference"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="insuranceNumber">Professional Insurance (optional)</Label>
                      <Input
                        id="insuranceNumber"
                        value={brandConfig.legal.insuranceNumber}
                        onChange={(e) =>
                          setBrandConfig((prev) => ({
                            ...prev,
                            legal: { ...prev.legal, insuranceNumber: e.target.value },
                          }))
                        }
                        placeholder="Insurer + policy number"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Preview & Save */}
                <Card>
                  <CardHeader>
                    <CardTitle>Document Preview</CardTitle>
                    <CardDescription>Preview how your branding will appear on generated documents.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Mock Header Preview */}
                    <div
                      className="rounded-lg border p-4 mb-4"
                      style={{ borderColor: brandConfig.colors.primary + "40" }}
                    >
                      <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          {logoPreview || brandConfig.logo ? (
                            <img src={logoPreview || brandConfig.logo} alt="Logo" className="h-10 object-contain" />
                          ) : (
                            <div
                              className="h-10 w-20 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: brandConfig.colors.primary }}
                            >
                              LOGO
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm" style={{ color: brandConfig.colors.primary }}>
                              {brandConfig.agencyName || "Your Agency Name"}
                            </p>
                            <p className="text-xs text-muted-foreground">{brandConfig.address || "Agency Address"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm" style={{ color: brandConfig.colors.primary }}>
                            MANDAT DE VENTE
                          </p>
                          <p className="text-xs text-muted-foreground">Référence: MAN-2025-001</p>
                        </div>
                      </div>
                      <div
                        className="text-center py-6 rounded"
                        style={{ backgroundColor: brandConfig.colors.highlight + "20" }}
                      >
                        <p className="text-sm text-muted-foreground">Document content area</p>
                      </div>
                      <div
                        className="flex justify-between text-xs pt-3 mt-3 border-t"
                        style={{ color: brandConfig.colors.muted }}
                      >
                        <span>
                          {brandConfig.legal.companyType || "—"} - RCS: {brandConfig.legal.rcs || "B123456"} - TVA:{" "}
                          {brandConfig.legal.vatNumber || "LU12345678"}
                        </span>
                        <span>Page 1 sur 4</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setBrandConfig(defaultBrandConfig)}>
                        Reset to Defaults
                      </Button>
                      <Button onClick={handleSaveBrandConfig} disabled={isSaving}>
                        {isSaving ? (
                          "Saving..."
                        ) : saveSuccess ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Saved!
                          </>
                        ) : (
                          "Save Brand Configuration"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing & Subscription</CardTitle>
                    <CardDescription>Manage your subscription and payment methods.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Professional Plan</p>
                          <p className="text-sm text-muted-foreground">€99/month, billed monthly</p>
                        </div>
                        <Button variant="outline">Change Plan</Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-4">Payment Method</h4>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-14 items-center justify-center rounded bg-muted">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Visa ending in 4242</p>
                            <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-4">Billing History</h4>
                      <div className="space-y-2">
                        {[
                          { date: "Jan 1, 2025", amount: "€99.00", status: "Paid" },
                          { date: "Dec 1, 2024", amount: "€99.00", status: "Paid" },
                          { date: "Nov 1, 2024", amount: "€99.00", status: "Paid" },
                        ].map((invoice, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <span className="text-sm">{invoice.date}</span>
                            <span className="text-sm font-medium">{invoice.amount}</span>
                            <span className="text-sm text-emerald-600">{invoice.status}</span>
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Supabase Setup</CardTitle>
                    <CardDescription>Check database schema status, copy SQL, and seed mock data into your workspace.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={loadSetupStatus} disabled={isCheckingSetup}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {isCheckingSetup ? "Checking..." : "Check Status"}
                      </Button>
                      <Button variant="outline" onClick={loadSchemaSql} disabled={isLoadingSchema}>
                        {isLoadingSchema ? "Loading SQL..." : "Load Schema SQL"}
                      </Button>
                      <Button
                        onClick={seedDemoData}
                        disabled={isSeeding || (setupStatus ? !setupStatus.adminConfigured : false)}
                      >
                        {isSeeding ? "Seeding..." : "Seed Demo Data"}
                      </Button>
                    </div>

                    {setupStatus && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Status</p>
                          <span className={setupStatus.ok ? "text-emerald-600" : "text-amber-600"}>
                            {setupStatus.ok ? "OK" : "Needs setup"}
                          </span>
                        </div>
                        {setupStatus.error && <p className="text-sm text-destructive">{setupStatus.error}</p>}
                        {!setupStatus.adminConfigured && (
                          <p className="text-sm text-muted-foreground">
                            Demo seeding requires `SUPABASE_SERVICE_ROLE_KEY` in server environment.
                          </p>
                        )}
                        {setupStatus.missing?.length > 0 && (
                          <div className="text-sm">
                            <p className="font-medium">Missing tables:</p>
                            <ul className="list-disc pl-5 text-muted-foreground">
                              {setupStatus.missing.map((t) => (
                                <li key={t}>{t}</li>
                              ))}
                            </ul>
                            <p className="mt-2 text-muted-foreground">
                              Fix: open Supabase SQL Editor and run the SQL from `supabase/schema.sql` (use “Load Schema
                              SQL” above).
                            </p>
                          </div>
                        )}
                        {setupStatus.ok && (
                          <p className="text-sm text-muted-foreground">
                            Schema is installed. You can now use the app + MCP tools safely.
                          </p>
                        )}
                      </div>
                    )}

                    {schemaSql !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Schema SQL</p>
                          <Button variant="outline" size="sm" onClick={copySchemaSql} disabled={!schemaSql}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <pre className="max-h-80 overflow-auto rounded-md border bg-muted/20 p-3 text-xs whitespace-pre-wrap">
                          {schemaSql || "No SQL loaded"}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fal AI Setup</CardTitle>
                    <CardDescription>
                      Enable real image generations in AI Photo Tools by setting a server-side Fal key.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Status</p>
                        <span
                          className={
                            setupStatus?.fal?.configured ? "text-emerald-600" : "text-amber-600"
                          }
                        >
                          {setupStatus?.fal?.configured ? "Configured" : "Missing FAL_KEY"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Model: <span className="font-mono text-xs">{setupStatus?.fal?.model || "fal-ai/gemini-25-flash-image/edit"}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Add this to <span className="font-mono text-xs">.env.local</span> then restart{" "}
                        <span className="font-mono text-xs">npm run dev</span>.
                      </p>
                      <pre className="rounded-md border bg-muted/20 p-3 text-xs whitespace-pre-wrap">
FAL_KEY="YOUR_FAL_KEY"
                      </pre>
                      <p className="text-xs text-muted-foreground">
                        For production, set the same env var in your hosting provider (do not commit secrets).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
