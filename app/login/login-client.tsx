"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export function LoginClient() {
  const router = useRouter()
  const search = useSearchParams()
  const nextPath = useMemo(() => search.get("next") || "/dashboard", [search])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Sign up extra fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null)

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient())
  }, [])

  const onSignIn = async () => {
    if (!supabase) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(nextPath)
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || "Sign in failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSignUp = async () => {
    if (!supabase) return
    setIsSubmitting(true)
    try {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error("Please enter your first and last name.")
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName.trim(), last_name: lastName.trim() },
        },
      })
      if (error) throw error

      // If email confirmations are enabled, there may be no session yet.
      if (!data.session) {
        toast.success("Account created. Check your email to confirm, then sign in.")
        return
      }

      toast.success("Welcome! Let's set up your agency.")
      router.push("/onboarding")
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || "Sign up failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onForgotPassword = async () => {
    if (!supabase) return
    if (!email.trim()) {
      toast.error("Enter your email first.")
      return
    }
    setIsResetting(true)
    try {
      const origin = window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      })
      if (error) throw error
      toast.success("Password reset email sent. Check your inbox.")
    } catch (e: any) {
      toast.error(e?.message || "Failed to send reset email")
    } finally {
      setIsResetting(false)
    }
  }

  if (!supabase) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your real-estate workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="signin" className="mt-4 space-y-4">
              <Button className="w-full" disabled={isSubmitting} onClick={() => void onSignIn()}>
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center"
                disabled={isResetting}
                onClick={() => void onForgotPassword()}
              >
                {isResetting ? "Sending reset email…" : "Forgot your password?"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <Button className="w-full" disabled={isSubmitting} onClick={() => void onSignUp()}>
                {isSubmitting ? "Creating…" : "Create account"}
              </Button>
              <p className="text-xs text-muted-foreground">
                If email confirmation is enabled, you’ll need to confirm your email before signing in.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
