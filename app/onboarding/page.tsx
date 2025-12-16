"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export default function OnboardingPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null)
  const [agencyName, setAgencyName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient())
  }, [])

  useEffect(() => {
    // If already onboarded, send to dashboard.
    ;(async () => {
      try {
        const res = await fetch("/api/v1/bootstrap")
        if (res.ok) {
          const data = await res.json()
          if (data?.agencyId) router.replace("/dashboard")
        }
      } catch {
        // ignore
      }
    })()
  }, [router])

  const onCreateAgency = async () => {
    if (!supabase) return
    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/login")
        return
      }

      const res = await fetch("/api/v1/onboarding/create-agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agencyName }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to create agency")
      }

      toast.success("Agency created!")
      router.replace("/dashboard")
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || "Onboarding failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  if (!supabase) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set up your agency</CardTitle>
          <CardDescription>Create your workspace to start adding properties, contacts, and tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agencyName">Agency name</Label>
            <Input
              id="agencyName"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g., Votre Agence Immobilière"
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={isSubmitting || !agencyName.trim()} onClick={() => void onCreateAgency()}>
              {isSubmitting ? "Creating…" : "Create agency"}
            </Button>
            <Button variant="outline" onClick={() => void onSignOut()}>
              Sign out
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You can invite more users and create multiple agencies later (coming soon).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
