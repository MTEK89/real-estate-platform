"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { useDataStore } from "@/lib/data-store"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function VisitsCalendar() {
  const { visits, getContactById } = useDataStore()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const datePrefix = useMemo(
    () => `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-`,
    [currentDate],
  )

  const toDateStr = (day: number) => `${datePrefix}${String(day).padStart(2, "0")}`

  const getVisitsForDay = (day: number) => {
    const dateStr = toDateStr(day)
    return visits.filter((v) => v.date === dateStr)
  }

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const today = new Date()

  return (
    <div className="rounded-xl border bg-card">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-card-foreground">{monthYear}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 border-b">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[120px] border-b border-r p-2 bg-muted/30" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const dayVisits = getVisitsForDay(day)
          const isToday =
            day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()

          return (
            <div
              key={day}
              className={cn(
                "min-h-[120px] border-b border-r p-2 hover:bg-muted/30 transition-colors cursor-pointer",
                isToday && "bg-primary/5",
              )}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/dashboard/visits/new?date=${encodeURIComponent(toDateStr(day))}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  router.push(`/dashboard/visits/new?date=${encodeURIComponent(toDateStr(day))}`)
                }
              }}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                  isToday && "bg-primary text-primary-foreground font-medium",
                )}
              >
                {day}
              </span>
              <div className="mt-1 space-y-1">
                {dayVisits.slice(0, 2).map((visit) => {
                  const contact = getContactById(visit.contactId)
                  return (
                    <div
                      key={visit.id}
                      className={cn(
                        "rounded px-2 py-1 text-xs cursor-pointer truncate",
                        visit.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : visit.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700",
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/visits/new?date=${encodeURIComponent(visit.date)}`)
                      }}
                    >
                      {visit.startTime} - {contact?.firstName}
                    </div>
                  )
                })}
                {dayVisits.length > 2 && (
                  <span className="text-xs text-muted-foreground pl-2">+{dayVisits.length - 2} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
