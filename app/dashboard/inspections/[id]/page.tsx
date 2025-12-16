"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useDataStore } from "@/lib/data-store"
import type {
  Inspection,
  InspectionChecklistItem,
  InspectionCondition,
  InspectionMeter,
  InspectionPhoto,
  InspectionRoom,
} from "@/lib/inspections"
import { usePdfGeneration } from "@/hooks/usePdfGeneration"
import type { EtatDesLieuxData } from "@/lib/pdf-generator"
import type { Contact, Property } from "@/lib/mock-data"
import { ArrowLeft, Camera, CheckCircle2, ChevronLeft, ChevronRight, Download, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"

const conditionOptions: Array<{ value: InspectionCondition; label: string; tone: string }> = [
  { value: "excellent", label: "Excellent", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "good", label: "Bon", tone: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "fair", label: "Moyen", tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "poor", label: "Mauvais", tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  { value: "na", label: "N/A", tone: "bg-muted text-muted-foreground" },
]

function countPhotos(inspection: Inspection) {
  return (
    inspection.rooms.reduce((sum, room) => sum + room.items.reduce((s2, item) => s2 + item.photos.length, 0), 0) +
    inspection.keys.reduce((sum, k) => sum + k.photos.length, 0) +
    Object.values(inspection.meters).reduce((sum, m) => sum + m.photos.length, 0)
  )
}

function countFlaggedItems(inspection: Inspection) {
  return inspection.rooms.reduce(
    (sum, room) => sum + room.items.filter((i) => i.condition === "fair" || i.condition === "poor").length,
    0,
  )
}

function inspectionToEtatDesLieuxData(args: {
  inspection: Inspection
  property: Property
  landlord: Contact
  tenant: Contact
}): EtatDesLieuxData {
  const { inspection, property, landlord, tenant } = args

  const parseReading = (m: InspectionMeter) => {
    const n = Number.parseFloat(m.reading)
    return Number.isFinite(n) ? n : 0
  }

  return {
    type: inspection.type,
    property,
    landlord,
    tenant,
    date: inspection.scheduledDate || inspection.startedAt || new Date().toISOString(),
    rooms: inspection.rooms.map((room) => {
      const walls = room.items.find((i) => i.kind === "walls")
      const floor = room.items.find((i) => i.kind === "floor")
      const ceiling = room.items.find((i) => i.kind === "ceiling")
      const windows = room.items.find((i) => i.kind === "windows")
      const fixtures = room.items.filter((i) => i.kind === "fixture")

      const toSegment = (item?: InspectionChecklistItem) => ({
        condition: item?.condition === "na" ? "N/A" : conditionOptions.find((o) => o.value === item?.condition)?.label || "Bon",
        notes: item?.notes || "",
      })

      return {
        name: room.name,
        walls: toSegment(walls),
        floor: toSegment(floor),
        ceiling: toSegment(ceiling),
        windows: toSegment(windows),
        fixtures: fixtures.map((f) => ({
          item: f.label,
          condition: f.condition === "na" ? "N/A" : conditionOptions.find((o) => o.value === f.condition)?.label || "Bon",
          notes: f.notes || "",
        })),
      }
    }),
    meterReadings: {
      electricity: parseReading(inspection.meters.electricity),
      gas: parseReading(inspection.meters.gas),
      water: parseReading(inspection.meters.water),
    },
    keysProvided: inspection.keys.map((k) => ({ type: k.label, quantity: k.quantity })),
    generalComments: inspection.generalNotes,
  }
}

function PhotoGrid({
  photos,
  onAdd,
  onRemove,
  disabled,
}: {
  photos: InspectionPhoto[]
  onAdd: (files: FileList) => void
  onRemove: (photoId: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          if (!e.target.files || e.target.files.length === 0) return
          onAdd(e.target.files)
          e.target.value = ""
        }}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{photos.length} photo(s)</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="bg-transparent"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          Add photos
        </Button>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p) => (
            <div key={p.id} className="relative rounded-md border bg-muted/30 overflow-hidden">
              {p.dataUrl ? (
                <img src={p.dataUrl} alt={p.name} className="h-20 w-full object-cover" />
              ) : (
                <div className="h-20 w-full flex items-center justify-center text-xs text-muted-foreground">No preview</div>
              )}
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-background/80 p-1 hover:bg-background"
                onClick={() => onRemove(p.id)}
                aria-label="Remove photo"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

async function uploadFilesToInspectionPhotos(args: { inspectionId: string; files: FileList }): Promise<InspectionPhoto[]> {
  const form = new FormData()
  form.set("inspectionId", args.inspectionId)
  Array.from(args.files).forEach((f) => form.append("files", f))

  const res = await fetch("/api/v1/inspections/photos/upload", { method: "POST", body: form })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Upload failed")
  }

  const data = (await res.json()) as { created?: InspectionPhoto[] }
  return Array.isArray(data.created) ? data.created : []
}

export default function InspectionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { previewPdf, downloadPdf, isGenerating } = usePdfGeneration()
  const { getInspectionById, saveInspection, deleteInspection, getPropertyById, getContactById } = useDataStore()

  const inspectionFromStore = getInspectionById(params.id)
  const [inspection, setInspection] = useState<Inspection | null>(inspectionFromStore || null)
  const [activeRoomId, setActiveRoomId] = useState<string>("")
  const [step, setStep] = useState<number>(0)
  const didInitStep = useRef(false)

  useEffect(() => {
    setInspection(inspectionFromStore || null)
  }, [inspectionFromStore])

  useEffect(() => {
    if (!inspection) return
    if (didInitStep.current) return
    setStep(inspection.status === "draft" ? 0 : 1)
    didInitStep.current = true
  }, [inspection])

  useEffect(() => {
    if (!inspection) return
    if (!activeRoomId) {
      setActiveRoomId(inspection.rooms[0]?.id || "")
    }
  }, [inspection, activeRoomId])

  const property = useMemo(() => (inspection ? getPropertyById(inspection.propertyId) : undefined), [inspection, getPropertyById])
  const landlord = useMemo(() => (inspection ? getContactById(inspection.landlordId) : undefined), [inspection, getContactById])
  const tenant = useMemo(() => (inspection ? getContactById(inspection.tenantId) : undefined), [inspection, getContactById])

  const stats = useMemo(() => {
    if (!inspection) return null
    return {
      photos: countPhotos(inspection),
      flagged: countFlaggedItems(inspection),
      rooms: inspection.rooms.length,
    }
  }, [inspection])

  const steps = useMemo(
    () => [
      { id: "setup", title: "Setup" },
      { id: "rooms", title: "Rooms" },
      { id: "meters", title: "Meters" },
      { id: "keys", title: "Keys" },
      { id: "review", title: "Review" },
    ],
    [],
  )

  const hideSetupInStepper = inspection.status !== "draft" && step !== 0
  const visibleSteps = hideSetupInStepper ? steps.slice(1) : steps
  const minStep = hideSetupInStepper ? 1 : 0

  const updateInspection = (updater: (current: Inspection) => Inspection) => {
    setInspection((prev) => {
      if (!prev) return prev
      const next = updater(prev)
      saveInspection(next)
      return next
    })
  }

  if (!inspection) {
    return (
      <div className="flex flex-col">
        <DashboardHeader
          title="Inspection"
          description="Not found"
          actions={
            <Link href="/dashboard/inspections">
              <Button variant="outline" className="bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          }
        />
        <div className="p-6">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Inspection not found</CardTitle>
              <CardDescription>It may have been deleted or not saved in this browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/inspections">
                <Button>Go to inspections</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentRoom: InspectionRoom | undefined = inspection.rooms.find((r) => r.id === activeRoomId)

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Inspection walkthrough"
        description={`${inspection.type === "move_in" ? "Move-in" : "Move-out"} • ${inspection.id.toUpperCase()}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {inspection.type.replace("_", "-")}
            </Badge>
            <Badge
              className={cn(
                inspection.status === "completed"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : inspection.status === "in_progress"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-muted text-muted-foreground",
                "capitalize",
              )}
            >
              {inspection.status.replace("_", " ")}
            </Badge>
            {inspection.status !== "draft" && step !== 0 && (
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => setStep(0)}>
                Edit details
              </Button>
            )}
            <Link href="/dashboard/inspections">
              <Button variant="outline" className="bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Walkthrough</CardTitle>
                <CardDescription>Capture checklist + photo evidence per room, then export a clean report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {visibleSteps.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStep(hideSetupInStepper ? idx + 1 : idx)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        (hideSetupInStepper ? idx + 1 : idx) === step
                          ? "bg-primary/10 border-primary text-primary"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <span className="text-xs rounded-full bg-muted px-2 py-0.5">
                        {(hideSetupInStepper ? idx + 2 : idx + 1)}
                      </span>
                      {s.title}
                    </button>
                  ))}
                </div>

                <Separator />

                {step === 0 && (
                  <div className="space-y-4">
                    {inspection.status !== "draft" && (
                      <Card>
                        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">Editing inspection details</p>
                            <p className="text-sm text-muted-foreground">Return to Rooms when you’re done.</p>
                          </div>
                          <Button type="button" variant="outline" className="bg-transparent" onClick={() => setStep(1)}>
                            Back to walkthrough
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    {inspection.status === "draft" && (
                      <Card>
                        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">Ready to start the walkthrough?</p>
                            <p className="text-sm text-muted-foreground">
                              Start with Rooms, take photos, then export the report.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={() =>
                              updateInspection((curr) => {
                                const now = new Date().toISOString()
                                setStep(1)
                                return { ...curr, status: "in_progress", startedAt: curr.startedAt || now }
                              })
                            }
                          >
                            Start walkthrough
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Scheduled</Label>
                        <Input
                          type="datetime-local"
                          value={inspection.scheduledDate ? new Date(inspection.scheduledDate).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            const v = e.target.value
                            updateInspection((curr) => ({ ...curr, scheduledDate: v ? new Date(v).toISOString() : null }))
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={inspection.status}
                          onValueChange={(v) =>
                            updateInspection((curr) => {
                              const now = new Date().toISOString()
                              if (v === "in_progress" && !curr.startedAt) return { ...curr, status: "in_progress", startedAt: now }
                              if (v === "completed" && !curr.completedAt)
                                return { ...curr, status: "completed", completedAt: now }
                              return { ...curr, status: v as Inspection["status"] }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>General notes</Label>
                      <Textarea
                        value={inspection.generalNotes}
                        onChange={(e) => updateInspection((curr) => ({ ...curr, generalNotes: e.target.value }))}
                        placeholder="Anything to note before starting (special clauses, constraints, tenant remarks)…"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Rooms</p>
                        <div className="rounded-lg border bg-muted/20">
                          {inspection.rooms.map((room) => {
                            const flagged = room.items.filter((i) => i.condition === "fair" || i.condition === "poor").length
                            const roomPhotos = room.items.reduce((sum, i) => sum + i.photos.length, 0)
                            return (
                              <button
                                key={room.id}
                                type="button"
                                onClick={() => setActiveRoomId(room.id)}
                                className={cn(
                                  "w-full px-3 py-2 text-left border-b last:border-b-0 hover:bg-muted/50",
                                  room.id === activeRoomId && "bg-background",
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{room.name}</span>
                                  <div className="flex items-center gap-2">
                                    {flagged > 0 && (
                                      <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                        {flagged} flagged
                                      </Badge>
                                    )}
                                    {roomPhotos > 0 && <Badge variant="secondary">{roomPhotos} photos</Badge>}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tip: take at least 1 photo for every item you mark as “Moyen” or “Mauvais”.
                        </p>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      {currentRoom ? (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{currentRoom.name}</p>
                            <Button
                              type="button"
                              variant="outline"
                              className="bg-transparent"
                              onClick={() =>
                                updateInspection((curr) => ({
                                  ...curr,
                                  rooms: curr.rooms.map((r) =>
                                    r.id === currentRoom.id
                                      ? {
                                          ...r,
                                          items: [
                                            ...r.items,
                                            {
                                              id: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                                              kind: "fixture",
                                              label: "New item",
                                              condition: "good",
                                              notes: "",
                                              photos: [],
                                            },
                                          ],
                                        }
                                      : r,
                                  ),
                                }))
                              }
                            >
                              Add item
                            </Button>
                          </div>

                          <div className="space-y-4">
                            {currentRoom.items.map((item) => (
                              <Card key={item.id}>
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                      <p className="font-medium">
                                        {item.label}
                                        {item.kind === "fixture" && (
                                          <span className="ml-2 text-xs text-muted-foreground">(fixture)</span>
                                        )}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {item.condition !== "na" && (
                                          <Badge
                                            variant="secondary"
                                            className={cn(
                                              conditionOptions.find((o) => o.value === item.condition)?.tone,
                                            )}
                                          >
                                            {conditionOptions.find((o) => o.value === item.condition)?.label}
                                          </Badge>
                                        )}
                                        {item.photos.length > 0 && <Badge variant="secondary">{item.photos.length} photo(s)</Badge>}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {item.kind === "fixture" && (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="bg-transparent"
                                          onClick={() =>
                                            updateInspection((curr) => ({
                                              ...curr,
                                              rooms: curr.rooms.map((r) =>
                                                r.id !== currentRoom.id
                                                  ? r
                                                  : { ...r, items: r.items.filter((i) => i.id !== item.id) },
                                              ),
                                            }))
                                          }
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Remove
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {item.kind === "fixture" && (
                                    <div className="space-y-2">
                                      <Label>Label</Label>
                                      <Input
                                        value={item.label}
                                        onChange={(e) =>
                                          updateInspection((curr) => ({
                                            ...curr,
                                            rooms: curr.rooms.map((r) =>
                                              r.id !== currentRoom.id
                                                ? r
                                                : {
                                                    ...r,
                                                    items: r.items.map((i) => (i.id === item.id ? { ...i, label: e.target.value } : i)),
                                                  },
                                            ),
                                          }))
                                        }
                                      />
                                    </div>
                                  )}

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Condition</Label>
                                      <Select
                                        value={item.condition}
                                        onValueChange={(v) =>
                                          updateInspection((curr) => ({
                                            ...curr,
                                            rooms: curr.rooms.map((r) =>
                                              r.id !== currentRoom.id
                                                ? r
                                                : {
                                                    ...r,
                                                    items: r.items.map((i) => (i.id === item.id ? { ...i, condition: v as InspectionCondition } : i)),
                                                  },
                                            ),
                                          }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {conditionOptions.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                              {o.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Notes</Label>
                                      <Textarea
                                        value={item.notes}
                                        onChange={(e) =>
                                          updateInspection((curr) => ({
                                            ...curr,
                                            rooms: curr.rooms.map((r) =>
                                              r.id !== currentRoom.id
                                                ? r
                                                : {
                                                    ...r,
                                                    items: r.items.map((i) => (i.id === item.id ? { ...i, notes: e.target.value } : i)),
                                                  },
                                            ),
                                          }))
                                        }
                                        placeholder="What did you observe? Location, severity, context…"
                                        className="min-h-[72px]"
                                      />
                                    </div>
                                  </div>

                                  <PhotoGrid
                                    photos={item.photos}
                                    disabled={inspection.status === "completed"}
                                    onAdd={async (files) => {
                                      try {
                                        const newPhotos = await uploadFilesToInspectionPhotos({ inspectionId: inspection.id, files })
                                        updateInspection((curr) => ({
                                          ...curr,
                                          rooms: curr.rooms.map((r) =>
                                            r.id !== currentRoom.id
                                              ? r
                                              : {
                                                  ...r,
                                                  items: r.items.map((i) =>
                                                    i.id === item.id ? { ...i, photos: [...i.photos, ...newPhotos] } : i,
                                                  ),
                                                },
                                          ),
                                        }))
                                      } catch (e) {
                                        console.error(e)
                                        toast.error(e instanceof Error ? e.message : "Upload failed")
                                      }
                                    }}
                                    onRemove={(photoId) => {
                                      updateInspection((curr) => ({
                                        ...curr,
                                        rooms: curr.rooms.map((r) =>
                                          r.id !== currentRoom.id
                                            ? r
                                            : {
                                                ...r,
                                                items: r.items.map((i) =>
                                                  i.id === item.id ? { ...i, photos: i.photos.filter((p) => p.id !== photoId) } : i,
                                                ),
                                              },
                                        ),
                                      }))
                                    }}
                                  />
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </>
                      ) : (
                        <Card>
                          <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">Select a room to start.</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      {(["electricity", "gas", "water"] as const).map((meterKey) => {
                        const meter = inspection.meters[meterKey]
                        const label = meterKey === "electricity" ? "Electricity" : meterKey === "gas" ? "Gas" : "Water"
                        return (
                          <Card key={meterKey}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">{label}</CardTitle>
                              <CardDescription>Reading + photo of the meter.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="space-y-2">
                                <Label>Reading</Label>
                                <Input
                                  value={meter.reading}
                                  onChange={(e) =>
                                    updateInspection((curr) => ({
                                      ...curr,
                                      meters: { ...curr.meters, [meterKey]: { ...curr.meters[meterKey], reading: e.target.value } },
                                    }))
                                  }
                                  placeholder="e.g. 45230"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                  value={meter.notes}
                                  onChange={(e) =>
                                    updateInspection((curr) => ({
                                      ...curr,
                                      meters: { ...curr.meters, [meterKey]: { ...curr.meters[meterKey], notes: e.target.value } },
                                    }))
                                  }
                                  className="min-h-[70px]"
                                />
                              </div>
                              <PhotoGrid
                                photos={meter.photos}
                                disabled={inspection.status === "completed"}
                                onAdd={async (files) => {
                                  let newPhotos: InspectionPhoto[] = []
                                  try {
                                    newPhotos = await uploadFilesToInspectionPhotos({ inspectionId: inspection.id, files })
                                  } catch (e) {
                                    console.error(e)
                                    toast.error(e instanceof Error ? e.message : "Upload failed")
                                    return
                                  }
                                  updateInspection((curr) => ({
                                    ...curr,
                                    meters: {
                                      ...curr.meters,
                                      [meterKey]: { ...curr.meters[meterKey], photos: [...curr.meters[meterKey].photos, ...newPhotos] },
                                    },
                                  }))
                                }}
                                onRemove={(photoId) => {
                                  updateInspection((curr) => ({
                                    ...curr,
                                    meters: {
                                      ...curr.meters,
                                      [meterKey]: {
                                        ...curr.meters[meterKey],
                                        photos: curr.meters[meterKey].photos.filter((p) => p.id !== photoId),
                                      },
                                    },
                                  }))
                                }}
                              />
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Keys & access</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() =>
                          updateInspection((curr) => ({
                            ...curr,
                            keys: [
                              ...curr.keys,
                              {
                                id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                                label: "New key item",
                                quantity: 1,
                                notes: "",
                                photos: [],
                              },
                            ],
                          }))
                        }
                      >
                        Add key
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {inspection.keys.map((k) => (
                        <Card key={k.id}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{k.label}</p>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="bg-transparent"
                                onClick={() => updateInspection((curr) => ({ ...curr, keys: curr.keys.filter((x) => x.id !== k.id) }))}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="space-y-2 sm:col-span-2">
                                <Label>Label</Label>
                                <Input
                                  value={k.label}
                                  onChange={(e) =>
                                    updateInspection((curr) => ({
                                      ...curr,
                                      keys: curr.keys.map((x) => (x.id === k.id ? { ...x, label: e.target.value } : x)),
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Qty</Label>
                                <Input
                                  type="number"
                                  value={k.quantity}
                                  onChange={(e) =>
                                    updateInspection((curr) => ({
                                      ...curr,
                                      keys: curr.keys.map((x) =>
                                        x.id === k.id ? { ...x, quantity: Number.parseInt(e.target.value || "0", 10) } : x,
                                      ),
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Textarea
                                value={k.notes}
                                onChange={(e) =>
                                  updateInspection((curr) => ({
                                    ...curr,
                                    keys: curr.keys.map((x) => (x.id === k.id ? { ...x, notes: e.target.value } : x)),
                                  }))
                                }
                                className="min-h-[70px]"
                              />
                            </div>

                            <PhotoGrid
                              photos={k.photos}
                              disabled={inspection.status === "completed"}
                              onAdd={async (files) => {
                                let newPhotos: InspectionPhoto[] = []
                                try {
                                  newPhotos = await uploadFilesToInspectionPhotos({ inspectionId: inspection.id, files })
                                } catch (e) {
                                  console.error(e)
                                  toast.error(e instanceof Error ? e.message : "Upload failed")
                                  return
                                }
                                updateInspection((curr) => ({
                                  ...curr,
                                  keys: curr.keys.map((x) => (x.id === k.id ? { ...x, photos: [...x.photos, ...newPhotos] } : x)),
                                }))
                              }}
                              onRemove={(photoId) => {
                                updateInspection((curr) => ({
                                  ...curr,
                                  keys: curr.keys.map((x) =>
                                    x.id === k.id ? { ...x, photos: x.photos.filter((p) => p.id !== photoId) } : x,
                                  ),
                                }))
                              }}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Summary</CardTitle>
                        <CardDescription>What you’ve captured so far.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Rooms</p>
                          <p className="text-2xl font-semibold">{stats?.rooms ?? 0}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Photos</p>
                          <p className="text-2xl font-semibold">{stats?.photos ?? 0}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Flagged items</p>
                          <p className="text-2xl font-semibold">{stats?.flagged ?? 0}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent"
                        onClick={async () => {
                          if (!property || !landlord || !tenant) return
                          const data = inspectionToEtatDesLieuxData({ inspection, property, landlord, tenant })
                          await previewPdf({
                            documentType: "etat_des_lieux",
                            data: data as unknown as Record<string, unknown>,
                            filename: `etat_des_lieux_${property.reference}_${inspection.type}_${new Date().toISOString().slice(0, 10)}.pdf`,
                          })
                        }}
                        disabled={isGenerating || !property || !landlord || !tenant}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview PDF (no photos yet)
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent"
                        onClick={async () => {
                          if (!property || !landlord || !tenant) return
                          const data = inspectionToEtatDesLieuxData({ inspection, property, landlord, tenant })
                          await downloadPdf({
                            documentType: "etat_des_lieux",
                            data: data as unknown as Record<string, unknown>,
                            filename: `etat_des_lieux_${property.reference}_${inspection.type}_${new Date().toISOString().slice(0, 10)}.pdf`,
                          })
                        }}
                        disabled={isGenerating || !property || !landlord || !tenant}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF (no photos yet)
                      </Button>

                      <Button
                        type="button"
                        onClick={() =>
                          updateInspection((curr) => ({
                            ...curr,
                            status: "completed",
                            completedAt: curr.completedAt || new Date().toISOString(),
                          }))
                        }
                        disabled={inspection.status === "completed"}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark complete
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          deleteInspection(inspection.id)
                          router.push("/dashboard/inspections")
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete inspection
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => setStep((s) => Math.max(minStep, s - 1))}
                    disabled={step <= minStep}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                    disabled={step === steps.length - 1}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Context</CardTitle>
                <CardDescription>Who/what this inspection is for.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Property</p>
                  <p className="font-medium">{property ? property.address.street : "—"}</p>
                  <p className="text-xs text-muted-foreground">{property ? property.reference : "—"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Landlord / Owner</p>
                  <p className="font-medium">{landlord ? `${landlord.firstName} ${landlord.lastName}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tenant</p>
                  <p className="font-medium">{tenant ? `${tenant.firstName} ${tenant.lastName}` : "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evidence</CardTitle>
                <CardDescription>Quick health check.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Photos</span>
                  <span className="font-medium">{stats?.photos ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Flagged items</span>
                  <span className="font-medium">{stats?.flagged ?? 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  For the demo, photos are stored as data URLs in localStorage and may hit browser storage limits.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next iteration</CardTitle>
                <CardDescription>What we’d add when moving beyond mock-local.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>1) Sync to storage (S3/R2) + DB, 2) PDF photo appendix, 3) signatures, 4) move-out comparison.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
