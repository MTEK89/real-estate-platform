"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AcceptInviteClient() {
  const router = useRouter()
  const search = useSearchParams()
  const inviteId = useMemo(() => search.get("invite_id"), [search])
  const [isWorking, setIsWorking] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!inviteId) {
        setIsWorking(false)
        return
      }
      setIsWorking(true)
      try {
        const res = await fetch("/api/v1/team/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteId }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to accept invitation")
        if (cancelled) return
        toast.success("Invitation accepted!")
        router.replace("/dashboard")
        router.refresh()
      } catch (e: any) {
        if (cancelled) return
        toast.error(e?.message || "Failed to accept invitation")
        setIsWorking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [inviteId, router])

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept invitation</CardTitle>
          <CardDescription>Joining your agency workspace…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" disabled>
            {isWorking ? "Working…" : "Done"}
          </Button>
          {!isWorking ? (
            <Button className="w-full" variant="outline" onClick={() => router.replace("/dashboard")}>
              Go to dashboard
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

