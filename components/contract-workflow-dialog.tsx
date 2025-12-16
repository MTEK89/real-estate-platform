"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Contract, Task } from "@/lib/mock-data"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useDataStore } from "@/lib/data-store"
import { toast } from "sonner"
import { CheckCircle2, Circle, Send, FileCheck2, Archive, XCircle, Clock } from "lucide-react"

type SignatureMethod = Contract["signatureMethod"]

type AuditStats = { openCount: number; lastOpenedAt: string | null; totalTimeMs: number }

function isoDatePlusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function yyyyMmDd(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function getString(data: Record<string, unknown> | undefined, key: string) {
  const v = data?.[key]
  return typeof v === "string" ? v : null
}

export function ContractWorkflowDialog({
  contract,
  open,
  onOpenChange,
}: {
  contract: Contract | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { updateContract, addTask, currentUserId } = useDataStore()
  const [signatureMethodDraft, setSignatureMethodDraft] = useState<SignatureMethod>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [stats, setStats] = useState<AuditStats | null>(null)

  const viewSessionRef = useRef<{ sessionId: string; startedAt: number } | null>(null)
  const contractIdRef = useRef<string | null>(null)

  useEffect(() => {
    contractIdRef.current = contract?.id ?? null
  }, [contract?.id])

  const postAudit = async (payload: { action: string; entityType: string; entityId: string; meta?: Record<string, unknown> }) => {
    try {
      await fetch("/api/v1/audit/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch {
      // ignore
    }
  }

  const beaconAudit = (payload: { action: string; entityType: string; entityId: string; meta?: Record<string, unknown> }) => {
    try {
      if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return false
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" })
      return navigator.sendBeacon("/api/v1/audit/track", blob)
    } catch {
      return false
    }
  }

  // Track "view session" time for this contract whenever the workflow dialog is opened.
  useEffect(() => {
    if (!contract?.id) return

    if (open) {
      const sessionId = crypto.randomUUID()
      viewSessionRef.current = { sessionId, startedAt: Date.now() }
      void postAudit({
        action: "contract.view_start",
        entityType: "contract",
        entityId: contract.id,
        meta: { sessionId, source: "contracts.workflow_dialog", startedAt: new Date().toISOString() },
      })
      return
    }

    const sess = viewSessionRef.current
    if (!sess) return
    viewSessionRef.current = null

    const durationMs = Date.now() - sess.startedAt
    void postAudit({
      action: "contract.view_end",
      entityType: "contract",
      entityId: contract.id,
      meta: {
        sessionId: sess.sessionId,
        source: "contracts.workflow_dialog",
        durationMs,
        endedAt: new Date().toISOString(),
      },
    })
  }, [open, contract?.id])

  // Best-effort: if the tab closes while dialog is open, send a beacon with duration.
  useEffect(() => {
    const onUnload = () => {
      const sess = viewSessionRef.current
      const contractId = contractIdRef.current
      if (!sess || !contractId) return
      const durationMs = Date.now() - sess.startedAt
      beaconAudit({
        action: "contract.view_end",
        entityType: "contract",
        entityId: contractId,
        meta: {
          sessionId: sess.sessionId,
          source: "contracts.workflow_dialog",
          durationMs,
          endedAt: new Date().toISOString(),
          via: "beforeunload",
        },
      })
    }

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", onUnload)
      return () => window.removeEventListener("beforeunload", onUnload)
    }
  }, [])

  const derived = useMemo(() => {
    if (!contract) return null
    const reviewedAt = getString(contract.data, "reviewedAt")
    const sentAt = getString(contract.data, "sentForSignatureAt")
    const archivedAt = getString(contract.data, "archivedAt")

    const isDraftCreated = true
    const isReviewed = Boolean(reviewedAt)
    const isPendingSignature = contract.status === "pending_signature" || contract.status === "signed" || contract.status === "declined" || contract.status === "expired"
    const isSigned = contract.status === "signed"
    const isArchived = Boolean(archivedAt)

    const nextAction =
      contract.status === "draft"
        ? isReviewed
          ? { key: "send", label: "Send for signature", icon: Send }
          : { key: "review", label: "Mark reviewed", icon: FileCheck2 }
        : contract.status === "pending_signature"
          ? { key: "signed", label: "Mark signed", icon: CheckCircle2 }
          : contract.status === "signed" && !isArchived
            ? { key: "archive", label: "Archive", icon: Archive }
            : null

    return {
      reviewedAt,
      sentAt,
      archivedAt,
      isDraftCreated,
      isReviewed,
      isPendingSignature,
      isSigned,
      isArchived,
      nextAction,
    }
  }, [contract])

  if (!contract || !derived) return null

  // Load view stats when opened (for "last opened" + "time spent").
  useEffect(() => {
    let cancelled = false
    if (!open) return
    setStats(null)
    void (async () => {
      try {
        const res = await fetch(
          `/api/v1/audit/stats?entityType=${encodeURIComponent("contract")}&entityId=${encodeURIComponent(contract.id)}`,
        )
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || "Failed to load stats")
        if (!cancelled) {
          setStats({
            openCount: Number(json?.openCount ?? 0),
            lastOpenedAt: typeof json?.lastOpenedAt === "string" ? json.lastOpenedAt : null,
            totalTimeMs: Number(json?.totalTimeMs ?? 0),
          })
        }
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, contract.id])

  const setDataPatch = async (patch: Record<string, unknown>) => {
    updateContract(contract.id, { data: { ...(contract.data ?? {}), ...patch } })
  }

  const createFollowUpTask = (args: { title: string; description: string; dueInDays: number; priority?: Task["priority"] }) => {
    addTask({
      title: args.title,
      description: args.description,
      assignedTo: currentUserId ?? "u1",
      relatedTo: { type: "contract", id: contract.id },
      priority: args.priority ?? "medium",
      status: "todo",
      dueDate: yyyyMmDd(isoDatePlusDays(args.dueInDays)),
      completedAt: null,
    })
  }

  const markReviewed = async () => {
    setIsWorking(true)
    try {
      await setDataPatch({ reviewedAt: new Date().toISOString() })
      createFollowUpTask({
        title: `Send contract ${contract.id.slice(0, 8).toUpperCase()} for signature`,
        description: "Pick signature method and send to client.",
        dueInDays: 1,
        priority: "high",
      })
      toast.success("Marked as reviewed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update workflow")
    } finally {
      setIsWorking(false)
    }
  }

  const sendForSignature = async (method: SignatureMethod) => {
    setIsWorking(true)
    try {
      const now = new Date().toISOString()
      const expiresAt = contract.expiresAt ?? isoDatePlusDays(14)
      updateContract(contract.id, {
        status: "pending_signature",
        signatureMethod: method ?? contract.signatureMethod ?? null,
        expiresAt,
      })
      await setDataPatch({ sentForSignatureAt: now })

      createFollowUpTask({
        title: `Follow up signature: ${contract.id.slice(0, 8).toUpperCase()}`,
        description: "Client has not signed yet. Follow up by email/call.",
        dueInDays: 2,
        priority: "high",
      })
      toast.success("Moved to Pending Signature")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send")
    } finally {
      setIsWorking(false)
    }
  }

  const markSigned = async () => {
    setIsWorking(true)
    try {
      updateContract(contract.id, { status: "signed", signedAt: new Date().toISOString() })
      toast.success("Marked as signed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setIsWorking(false)
    }
  }

  const markDeclined = async () => {
    setIsWorking(true)
    try {
      updateContract(contract.id, { status: "declined" })
      toast.success("Marked as declined")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setIsWorking(false)
    }
  }

  const markExpired = async () => {
    setIsWorking(true)
    try {
      updateContract(contract.id, { status: "expired" })
      toast.success("Marked as expired")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setIsWorking(false)
    }
  }

  const archiveContract = async () => {
    setIsWorking(true)
    try {
      await setDataPatch({ archivedAt: new Date().toISOString() })
      toast.success("Archived")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to archive")
    } finally {
      setIsWorking(false)
    }
  }

  const Step = ({
    done,
    title,
    meta,
  }: {
    done: boolean
    title: string
    meta?: string | null
  }) => (
    <div className="flex items-start gap-3">
      {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {done ? <Badge variant="secondary">Done</Badge> : <Badge variant="outline">Todo</Badge>}
        </div>
        {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </div>
  )

  const statusLabel = contract.status.replace("_", " ")

  const formatDuration = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    const m = Math.floor(s / 60)
    const r = s % 60
    if (m <= 0) return `${r}s`
    return `${m}m ${r}s`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Workflow</DialogTitle>
          <DialogDescription>
            Make the contract actionable by moving it through clear states. Signature method is optional until you actually send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("capitalize", contract.status === "signed" ? "bg-emerald-100 text-emerald-700" : undefined)}>
              {statusLabel}
            </Badge>
            {derived.reviewedAt ? <Badge variant="outline">Reviewed</Badge> : null}
            {derived.sentAt ? <Badge variant="outline">Sent</Badge> : null}
            {derived.archivedAt ? <Badge variant="outline">Archived</Badge> : null}
          </div>

          {stats ? (
            <div className="grid gap-2 rounded-lg border p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Opened</p>
                <p className="text-sm font-medium">{stats.openCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last opened</p>
                <p className="text-sm font-medium">
                  {stats.lastOpenedAt ? new Date(stats.lastOpenedAt).toLocaleString() : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time spent</p>
                <p className="text-sm font-medium">{formatDuration(stats.totalTimeMs)}</p>
              </div>
            </div>
          ) : open ? (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">Loading activity…</div>
          ) : null}

          <div className="space-y-3 rounded-lg border p-4">
            <Step done={derived.isDraftCreated} title="Create Draft" meta={`Created ${new Date(contract.createdAt).toLocaleString()}`} />
            <Step done={derived.isReviewed} title="Review & Edit" meta={derived.reviewedAt ? `Reviewed at ${new Date(derived.reviewedAt).toLocaleString()}` : "Review the content and mark it reviewed."} />
            <Step done={derived.isPendingSignature} title="Send for Signature" meta={derived.sentAt ? `Sent at ${new Date(derived.sentAt).toLocaleString()}` : "Move to Pending Signature (provider integration can be added later)."} />
            <Step done={derived.isSigned && derived.isArchived} title="Signed & Archived" meta={derived.archivedAt ? `Archived at ${new Date(derived.archivedAt).toLocaleString()}` : "Mark signed when received, then archive to close the loop."} />
          </div>

          {(contract.status === "draft" || contract.status === "pending_signature") && (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Signature method (optional)</p>
              <p className="mt-1 text-xs text-muted-foreground">You can leave this unset and choose later.</p>
              <div className="mt-3">
                <Select
                  value={(signatureMethodDraft ?? contract.signatureMethod ?? "unset") as any}
                  onValueChange={(v) => setSignatureMethodDraft(v === "unset" ? null : (v as SignatureMethod))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="scanned">Scanned</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {contract.status === "draft" && (
              <Button variant="outline" onClick={() => void markReviewed()} disabled={isWorking}>
                <FileCheck2 className="mr-2 h-4 w-4" />
                Mark reviewed
              </Button>
            )}
            {(contract.status === "draft" || contract.status === "pending_signature") && (
              <Button onClick={() => void sendForSignature(signatureMethodDraft)} disabled={isWorking}>
                <Send className="mr-2 h-4 w-4" />
                Send for signature
              </Button>
            )}
            {contract.status === "pending_signature" && (
              <>
                <Button variant="outline" onClick={() => void markSigned()} disabled={isWorking}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark signed
                </Button>
                <Button variant="outline" onClick={() => void markDeclined()} disabled={isWorking}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark declined
                </Button>
                <Button variant="outline" onClick={() => void markExpired()} disabled={isWorking}>
                  <Clock className="mr-2 h-4 w-4" />
                  Mark expired
                </Button>
              </>
            )}
            {contract.status === "signed" && !derived.isArchived && (
              <Button variant="outline" onClick={() => void archiveContract()} disabled={isWorking}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            )}
          </div>

          {derived.nextAction ? (
            <Button
              className="sm:ml-auto"
              disabled={isWorking}
              onClick={() => {
                if (derived.nextAction?.key === "review") void markReviewed()
                else if (derived.nextAction?.key === "send") void sendForSignature(signatureMethodDraft)
                else if (derived.nextAction?.key === "signed") void markSigned()
                else if (derived.nextAction?.key === "archive") void archiveContract()
              }}
            >
              <derived.nextAction.icon className="mr-2 h-4 w-4" />
              Next: {derived.nextAction.label}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isWorking}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
