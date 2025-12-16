"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export function ResetPasswordClient() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient())
  }, [])

  const canSubmit = useMemo(() => password.length >= 8 && password === confirm, [password, confirm])

  const onUpdate = async () => {
    if (!supabase) return
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      toast.success("Password updated. You're signed in.")
      router.replace("/dashboard")
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || "Failed to update password")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!supabase) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={isSubmitting || !canSubmit} onClick={() => void onUpdate()}>
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

